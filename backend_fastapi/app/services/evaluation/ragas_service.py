import asyncio
import math
import os
from dataclasses import dataclass

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.models.rag_evaluation import RagEvaluation


@dataclass(frozen=True)
class RagasEvaluationPayload:
    question: str
    contexts: list[str]
    answer: str
    agent_type: str
    user_id: int | None = None
    ground_truth: str | None = None


class RagasEvaluationService:
    async def evaluate_and_store(self, payload: RagasEvaluationPayload) -> None:
        scores: dict[str, float | None] = {
            "faithfulness": None,
            "answer_relevancy": None,
            "context_precision": None,
            "context_recall": None,
        }
        error_message: str | None = None

        try:
            scores = await asyncio.to_thread(self._evaluate_sync, payload)
        except Exception as exc:
            error_message = str(exc)

        async with AsyncSessionLocal() as session:
            session.add(
                RagEvaluation(
                    user_id=payload.user_id,
                    query=payload.question,
                    answer=payload.answer,
                    faithfulness_score=scores.get("faithfulness"),
                    relevance_score=scores.get("answer_relevancy"),
                    context_precision=scores.get("context_precision"),
                    context_recall=scores.get("context_recall"),
                    agent_type=payload.agent_type,
                    error_message=error_message,
                )
            )
            await session.commit()

    def _evaluate_sync(self, payload: RagasEvaluationPayload) -> dict[str, float | None]:
        from datasets import Dataset
        from langchain_openai import ChatOpenAI, OpenAIEmbeddings
        from ragas import evaluate
        from ragas.metrics import answer_relevancy, context_precision, context_recall, faithfulness

        settings = get_settings()
        os.environ["OPENAI_API_KEY"] = settings.openai_api_key

        row = {
            "user_input": [payload.question],
            "response": [payload.answer],
            "retrieved_contexts": [payload.contexts],
        }
        metrics = [faithfulness, answer_relevancy]

        if payload.ground_truth:
            row["reference"] = [payload.ground_truth]
            metrics.extend([context_precision, context_recall])

        dataset = Dataset.from_dict(row)
        result = evaluate(
            dataset,
            metrics=metrics,
            llm=ChatOpenAI(model=settings.openai_model, api_key=settings.openai_api_key),
            embeddings=OpenAIEmbeddings(
                model=settings.openai_embedding_model,
                api_key=settings.openai_api_key,
            ),
            raise_exceptions=False,
        )
        frame = result.to_pandas()
        values = frame.iloc[0].to_dict()

        return {
            "faithfulness": self._score(values.get("faithfulness")),
            "answer_relevancy": self._score(values.get("answer_relevancy")),
            "context_precision": self._score(values.get("context_precision")),
            "context_recall": self._score(values.get("context_recall")),
        }

    def _score(self, value: object) -> float | None:
        if value is None:
            return None

        try:
            score = float(value)

            if not math.isfinite(score):
                return None

            return round(score, 6)
        except (TypeError, ValueError):
            return None
