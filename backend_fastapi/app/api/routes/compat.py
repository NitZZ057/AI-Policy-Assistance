from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.routes.documents import query_document, stream_document_query, upload_document
from app.api.routes.policy import policy_history
from app.core.auth import get_current_user
from app.core.database import get_db_session
from app.models.user import User
from app.schemas.document import DocumentQueryRequest, DocumentQueryResponse, DocumentUploadResponse
from app.schemas.policy import PolicyHistoryItem

router = APIRouter(tags=["compat"])


@router.post("/document/upload", response_model=DocumentUploadResponse, status_code=201)
async def upload_document_compat(
    background_tasks: BackgroundTasks,
    document: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> DocumentUploadResponse:
    return await upload_document(
        background_tasks=background_tasks,
        document=document,
        current_user=current_user,
        session=session,
    )


@router.post("/document/query", response_model=DocumentQueryResponse)
async def query_document_compat(
    background_tasks: BackgroundTasks,
    payload: DocumentQueryRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> DocumentQueryResponse:
    return await query_document(
        background_tasks=background_tasks,
        payload=payload,
        current_user=current_user,
        session=session,
    )


@router.post("/document/query/stream")
async def query_document_stream_compat(
    payload: DocumentQueryRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    return await stream_document_query(
        payload=payload,
        current_user=current_user,
        session=session,
    )


@router.get("/history", response_model=dict[str, list[PolicyHistoryItem]])
async def history_compat(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, list[PolicyHistoryItem]]:
    return await policy_history(current_user=current_user, session=session)
