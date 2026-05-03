from dataclasses import dataclass
from collections.abc import AsyncIterator

from app.services.openai_client import OpenAIClient
from app.services.rag import RagService, RetrievedChunk
from app.services.prompt_registry import PromptRegistry, document_qa_template

from app.core.config import get_settings


@dataclass(frozen=True)
class DocumentQAResult:
    answer: str
    references: list[dict[str, str | float]]
    contexts: list[str]
    prompt_version: str


class DocumentQAAgent:
    def __init__(
        self,
        rag_service: RagService | None = None,
        openai_client: OpenAIClient | None = None,
    ) -> None:
        settings = get_settings()
        self.prompt_version = settings.document_qa_prompt_version
        self.rag = rag_service or RagService()
        self.openai = openai_client or OpenAIClient()
        self.prompts = PromptRegistry()

    async def answer(
        self,
        *,
        question: str,
        user_id: int,
        document_id: int,
    ) -> DocumentQAResult:
        chunks = await self.rag.retrieve(
            query=question,
            user_id=user_id,
            document_id=document_id,
            top_k=5,
        )

        if not chunks:
            return DocumentQAResult(
                answer="I could not find enough indexed document context to answer that from the selected policy document.",
                references=[],
                contexts=[],
                prompt_version=self.prompt_version,
            )

        response = await self.openai.create_text_response(
            system_prompt=self._system_prompt(),
            user_prompt=self._user_prompt(question, chunks),
        )

        return DocumentQAResult(
            answer=response.strip(),
            references=self._references(chunks),
            contexts=[chunk.content for chunk in chunks],
            prompt_version=self.prompt_version,
        )

    def _system_prompt(self) -> str:
        return (
            "You are the Document Q&A Agent for an AI policy assistant. "
            "Answer only from the supplied document context. "
            "If the context is insufficient, say so clearly. "
            "Be concise, practical, and grounded."
        )

    def _user_prompt(self, question: str, chunks: list[RetrievedChunk]) -> str:
        return self.prompts.render(
            document_qa_template(self.prompt_version),
            {
                "question": question,
                "chunks": chunks,
            },
        )


    def _references(self, chunks: list[RetrievedChunk]) -> list[dict[str, str | float]]:
        return [
            {
                "document": chunk.document_name,
                "section": f"Section {chunk.chunk_index + 1}",
                "score": round(chunk.score, 3),
            }
            for chunk in chunks
        ]

    async def retrieve_chunks(
        self,
        *,
        question: str,
        user_id: int,
        document_id: int,
    ) -> list[RetrievedChunk]:
        return await self.rag.retrieve(
            query=question,
            user_id=user_id,
            document_id=document_id,
            top_k=5,
        )

    async def stream_answer_text(
        self,
        *,
        question: str,
        chunks: list[RetrievedChunk],
    ) -> AsyncIterator[str]:
        async for delta in self.openai.stream_text_response(
            system_prompt=self._system_prompt(),
            user_prompt=self._user_prompt(question, chunks),
        ):
            yield delta
