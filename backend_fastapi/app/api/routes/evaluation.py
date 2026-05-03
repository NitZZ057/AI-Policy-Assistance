from collections import defaultdict
from datetime import date
import math

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db_session
from app.models.rag_evaluation import RagEvaluation
from app.models.user import User
from app.schemas.evaluation import (
    EvaluationAgentSummary,
    EvaluationHistoryItem,
    EvaluationHistoryResponse,
    EvaluationScoreSummary,
    EvaluationSummaryResponse,
    EvaluationTrendPoint,
)

router = APIRouter(prefix="/evaluation", tags=["evaluation"])


@router.get("/summary", response_model=EvaluationSummaryResponse)
async def evaluation_summary(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> EvaluationSummaryResponse:
    rows = (
        await session.execute(
            select(RagEvaluation)
            .where(RagEvaluation.user_id == current_user.id)
            .order_by(RagEvaluation.created_at.asc())
        )
    ).scalars().all()

    return EvaluationSummaryResponse(
        averages=EvaluationScoreSummary(
            faithfulness=_avg(row.faithfulness_score for row in rows),
            relevance=_avg(row.relevance_score for row in rows),
            context_precision=_avg(row.context_precision for row in rows),
            context_recall=_avg(row.context_recall for row in rows),
        ),
        total_evaluations=len(rows),
        failed_evaluations=sum(1 for row in rows if row.error_message),
        trend=_trend(rows),
        agents=_agent_summaries(rows),
    )


@router.get("/history", response_model=EvaluationHistoryResponse)
async def evaluation_history(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> EvaluationHistoryResponse:
    rows = (
        await session.execute(
            select(RagEvaluation)
            .where(RagEvaluation.user_id == current_user.id)
            .order_by(RagEvaluation.created_at.desc())
            .limit(50)
        )
    ).scalars().all()

    return EvaluationHistoryResponse(
        data=[
            EvaluationHistoryItem(
                id=row.id,
                query=row.query,
                answer=row.answer,
                agent_type=row.agent_type,
                faithfulness_score=row.faithfulness_score,
                relevance_score=row.relevance_score,
                context_precision=row.context_precision,
                context_recall=row.context_recall,
                error_message=row.error_message,
                created_at=row.created_at,
            )
            for row in rows
        ]
    )


def _avg(values: object) -> float | None:
    scored = [
        numeric
        for value in values
        if value is not None
        for numeric in [float(value)]
        if math.isfinite(numeric)
    ]

    if not scored:
        return None

    return round(sum(scored) / len(scored), 4)


def _trend(rows: list[RagEvaluation]) -> list[EvaluationTrendPoint]:
    grouped: dict[date, list[RagEvaluation]] = defaultdict(list)

    for row in rows:
        grouped[row.created_at.date()].append(row)

    return [
        EvaluationTrendPoint(
            date=day.isoformat(),
            faithfulness=_avg(row.faithfulness_score for row in day_rows),
            relevance=_avg(row.relevance_score for row in day_rows),
            count=len(day_rows),
        )
        for day, day_rows in sorted(grouped.items())
    ]


def _agent_summaries(rows: list[RagEvaluation]) -> list[EvaluationAgentSummary]:
    grouped: dict[str, list[RagEvaluation]] = defaultdict(list)

    for row in rows:
        grouped[row.agent_type].append(row)

    return [
        EvaluationAgentSummary(
            agent_type=agent_type,
            count=len(agent_rows),
            faithfulness=_avg(row.faithfulness_score for row in agent_rows),
            relevance=_avg(row.relevance_score for row in agent_rows),
            context_precision=_avg(row.context_precision for row in agent_rows),
            context_recall=_avg(row.context_recall for row in agent_rows),
        )
        for agent_type, agent_rows in sorted(grouped.items())
    ]
