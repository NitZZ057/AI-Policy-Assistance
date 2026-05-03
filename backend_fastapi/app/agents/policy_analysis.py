from dataclasses import dataclass

from app.services.openai_client import OpenAIClient
from app.services.rag import RagService, RetrievedChunk
from app.services.prompt_registry import PromptRegistry, policy_analysis_template

from app.core.config import get_settings


@dataclass(frozen=True)
class PolicyAnalysisInput:
    type: str
    coverage: str
    location: str
    risk: str
    document_id: int | None = None


@dataclass(frozen=True)
class PolicyAnalysisResult:
    summary: str
    risk_analysis: str
    email: str
    references: list[dict[str, str | float]]
    sources: list[dict[str, str | int | float]]
    contexts: list[str]
    prompt_version: str


class PolicyAnalysisAgent:
    def __init__(
        self,
        rag_service: RagService | None = None,
        openai_client: OpenAIClient | None = None,
    ) -> None:
        settings = get_settings()
        self.prompt_version = settings.policy_analysis_prompt_version
        self.rag = rag_service or RagService()
        self.openai = openai_client or OpenAIClient()
        self.prompts = PromptRegistry()

    async def analyze(
        self,
        *,
        policy: PolicyAnalysisInput,
        user_id: int,
    ) -> PolicyAnalysisResult:
        chunks = await self.rag.retrieve(
            query=" ".join([policy.type, policy.coverage, policy.location, policy.risk]),
            user_id=user_id,
            document_id=policy.document_id,
            top_k=5,
        )

        response = await self.openai.create_json_response(
            system_prompt=self._system_prompt(),
            user_prompt=self._user_prompt(policy, chunks),
            schema={
                "type": "object",
                "additionalProperties": False,
                "required": ["summary", "risk_analysis", "email"],
                "properties": {
                    "summary": {"type": "string"},
                    "risk_analysis": {"type": "string"},
                    "email": {"type": "string"},
                },
            },
            schema_name="policy_analysis",
        )

        return PolicyAnalysisResult(
            summary=response["summary"],
            risk_analysis=response["risk_analysis"],
            email=self._ensure_client_email(
                email=response["email"],
                policy=policy,
                summary=response["summary"],
                risk_analysis=response["risk_analysis"],
            ),
            references=self._references(chunks),
            sources=self._sources(chunks),
            contexts=[chunk.content for chunk in chunks],
            prompt_version=self.prompt_version,
        )

    def _system_prompt(self) -> str:
        return (
            "You are the Policy Analysis Agent for an insurance operations product. "
            "Return structured, practical policy output for human review. "
            "Be specific, operationally useful, and avoid unsupported claims."
        )

    def _user_prompt(
        self,
        policy: PolicyAnalysisInput,
        chunks: list[RetrievedChunk],
    ) -> str:
        return self.prompts.render(
            policy_analysis_template(self.prompt_version),
            {
                "policy": policy,
                "chunks": chunks,
            },
        )

    def _ensure_client_email(
        self,
        *,
        email: str,
        policy: PolicyAnalysisInput,
        summary: str,
        risk_analysis: str,
    ) -> str:
        cleaned = email.strip()

        if self._looks_like_full_email(cleaned):
            return cleaned

        return (
            f"Subject: Policy Review Summary for {policy.type}\n\n"
            "Dear Client,\n\n"
            f"We reviewed the {policy.type} policy for {policy.location}. {summary}\n\n"
            f"Coverage notes: {policy.coverage}\n\n"
            f"Risk review: {risk_analysis}\n\n"
            "Recommended next steps: please review the coverage details, confirm that the listed risks and location "
            "information are accurate, and let us know if you would like any changes before finalizing the policy.\n\n"
            "Regards,\n"
            "Policy Review Team"
        )

    def _looks_like_full_email(self, value: str) -> bool:
        if len(value.split()) < 20:
            return False

        lowered = value.lower()

        return any(marker in lowered for marker in ["dear ", "subject:", "regards", "sincerely"])


    def _references(self, chunks: list[RetrievedChunk]) -> list[dict[str, str | float]]:
        return [
            {
                "document": chunk.document_name,
                "section": f"Section {chunk.chunk_index + 1}",
                "score": round(chunk.score, 3),
            }
            for chunk in chunks
        ]

    def _sources(self, chunks: list[RetrievedChunk]) -> list[dict[str, str | int | float]]:
        return [
            {
                "document_chunk_id": chunk.chunk_id,
                "score": round(chunk.score, 8),
                "excerpt": f"{chunk.document_name} - Section {chunk.chunk_index + 1}",
            }
            for chunk in chunks
        ]
