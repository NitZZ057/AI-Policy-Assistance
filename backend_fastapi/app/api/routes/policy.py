from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.agents.policy_analysis import PolicyAnalysisAgent, PolicyAnalysisInput
from app.core.auth import get_current_user
from app.core.database import get_db_session
from app.models.analysis_source import AnalysisSource
from app.models.policy_analysis import PolicyAnalysis
from app.models.user import User
from app.schemas.policy import (
    PolicyAnalyzeRequest,
    PolicyAnalyzeResponse,
    PolicyFinalizeRequest,
    PolicyFinalizeResponse,
    PolicyHistoryItem,
)
from app.services.evaluation import RagasEvaluationPayload, RagasEvaluationService


router = APIRouter(prefix="/policy", tags=["policy"])


@router.post("/analyze", response_model=PolicyAnalyzeResponse)
async def analyze_policy(
    background_tasks: BackgroundTasks,
    payload: PolicyAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> PolicyAnalyzeResponse:
    user_id = current_user.id

    agent = PolicyAnalysisAgent()
    result = await agent.analyze(
        policy=PolicyAnalysisInput(
            type=payload.type,
            coverage=payload.coverage,
            location=payload.location,
            risk=payload.risk,
            document_id=payload.document_id,
        ),
        user_id=user_id,
    )

    analysis = PolicyAnalysis(
        user_id=user_id,
        policy_document_id=payload.document_id,
        policy_type=payload.type,
        coverage=payload.coverage,
        location=payload.location,
        risk=payload.risk,
        summary=result.summary,
        risk_analysis=result.risk_analysis,
        email=result.email,
        status="draft",
        prompt_version=result.prompt_version,
        metadata_={
            "references": result.references,
        },
    )

    session.add(analysis)
    await session.flush()

    for source in result.sources:
        session.add(
            AnalysisSource(
                policy_analysis_id=analysis.id,
                document_chunk_id=int(source["document_chunk_id"]),
                score=float(source["score"]),
            )
        )

    await session.commit()
    await session.refresh(analysis)

    if result.contexts:
        background_tasks.add_task(
            RagasEvaluationService().evaluate_and_store,
            RagasEvaluationPayload(
                question=" ".join([payload.type, payload.coverage, payload.location, payload.risk]),
                contexts=result.contexts,
                answer="\n\n".join([result.summary, result.risk_analysis, result.email]),
                agent_type="policy_analysis",
                user_id=user_id,
            ),
        )

    return PolicyAnalyzeResponse(
        id=analysis.id,
        summary=result.summary,
        risk_analysis=result.risk_analysis,
        email=result.email,
        references=result.references,
        sources=result.sources,
        meta={
            "prompt_version": result.prompt_version,
        },
    )


@router.get("/history", response_model=dict[str, list[PolicyHistoryItem]])
async def policy_history(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, list[PolicyHistoryItem]]:
    user_id = current_user.id

    result = await session.execute(
        select(PolicyAnalysis)
        .options(
            selectinload(PolicyAnalysis.sources)
            .selectinload(AnalysisSource.chunk)
        )
        .where(PolicyAnalysis.user_id == user_id)
        .order_by(PolicyAnalysis.created_at.desc())
    )

    rows = result.scalars().all()

    return {
        "data": [
            PolicyHistoryItem(
                id=row.id,
                policy_document_id=row.policy_document_id,
                policy_type=row.policy_type,
                summary=row.summary,
                risk_analysis=row.risk_analysis,
                email=row.email,
                status=row.status,
                prompt_version=row.prompt_version,
                final_output_payload=row.final_output_payload,
                output_payload={
                    "summary": row.summary,
                    "risk_analysis": row.risk_analysis,
                    "email": row.email,
                },
                references=(row.metadata_ or {}).get("references", []),
                sources=[
                    {
                        "document_chunk_id": source.document_chunk_id,
                        "score": round(float(source.score), 8),
                        "excerpt": f"Section {source.chunk.chunk_index + 1}",
                    }
                    for source in row.sources
                ],
                reviewed_at=row.reviewed_at,
                created_at=row.created_at,
            )
            for row in rows
        ]
    }

@router.put("/{analysis_id}/finalize", response_model=PolicyFinalizeResponse)
async def finalize_policy_analysis(
    analysis_id: int,
    payload: PolicyFinalizeRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> PolicyFinalizeResponse:
    user_id = current_user.id

    result = await session.execute(
        select(PolicyAnalysis).where(
            PolicyAnalysis.id == analysis_id,
            PolicyAnalysis.user_id == user_id,
        )
    )
    analysis = result.scalar_one_or_none()

    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy analysis was not found.",
        )

    reviewed_at = datetime.now(timezone.utc)

    analysis.status = "reviewed"
    analysis.final_output_payload = payload.final_output_payload
    analysis.reviewed_at = reviewed_at

    await session.commit()
    await session.refresh(analysis)

    return PolicyFinalizeResponse(
        id=analysis.id,
        status=analysis.status,
        final_output_payload=analysis.final_output_payload or {},
        reviewed_at=analysis.reviewed_at,
    )
