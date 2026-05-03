import hashlib
import json
import asyncio
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.document_qa import DocumentQAAgent
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.core.database import get_db_session
from app.models.document import PolicyDocument
from app.models.document_chunk import DocumentChunk
from app.models.user import User
from app.schemas.document import (
    DocumentQueryRequest,
    DocumentQueryResponse,
    DocumentResponse,
    DocumentUploadResponse,
)
from app.services.document_ingestion import DocumentIngestionService
from app.services.evaluation import RagasEvaluationPayload, RagasEvaluationService

router = APIRouter(prefix="/documents", tags=["documents"])


async def process_document_background(document_id: int) -> None:
    service = DocumentIngestionService()
    await service.process_document(document_id)


@router.get("", response_model=dict[str, list[DocumentResponse]])
async def list_documents(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, list[DocumentResponse]]:
    user_id = current_user.id

    result = await session.execute(
        select(
            PolicyDocument,
            func.count(DocumentChunk.id).label("chunks_count"),
        )
        .outerjoin(DocumentChunk, DocumentChunk.policy_document_id == PolicyDocument.id)
        .where(PolicyDocument.user_id == user_id)
        .group_by(PolicyDocument.id)
        .order_by(PolicyDocument.created_at.desc())
    )

    documents = []

    for document, chunks_count in result.all():
        documents.append(
            DocumentResponse(
                id=document.id,
                original_name=document.original_name,
                mime_type=document.mime_type,
                status=document.status,
                metadata_=document.metadata_ or {},
                created_at=document.created_at,
                chunks_count=chunks_count,
            )
        )

    return {"data": documents}


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    document: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> DocumentUploadResponse:
    user_id = current_user.id
    file = document

    if file.content_type not in {"application/pdf", "text/plain"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported document type. Upload a PDF or text file.",
        )

    contents = await file.read()
    file_hash = hashlib.sha256(contents).hexdigest()

    existing_result = await session.execute(
        select(PolicyDocument).where(
            PolicyDocument.user_id == user_id,
            PolicyDocument.file_hash == file_hash,
        )
    )
    existing = existing_result.scalar_one_or_none()

    if existing is not None:
        chunks_count = await session.scalar(
            select(func.count(DocumentChunk.id)).where(
                DocumentChunk.policy_document_id == existing.id
            )
        )

        return DocumentUploadResponse(
            data=DocumentResponse(
                id=existing.id,
                original_name=existing.original_name,
                mime_type=existing.mime_type,
                status=existing.status,
                metadata_=existing.metadata_ or {},
                created_at=existing.created_at,
                chunks_count=chunks_count or 0,
            ),
            duplicate=True,
            message="This document is already uploaded.",
        )

    settings = get_settings()
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = Path(file.filename or "document").name
    stored_name = f"{file_hash}_{safe_name}"
    storage_path = upload_dir / stored_name
    storage_path.write_bytes(contents)

    document = PolicyDocument(
        user_id=user_id,
        original_name=safe_name,
        mime_type=file.content_type or "application/octet-stream",
        file_hash=file_hash,
        storage_path=str(storage_path),
        raw_text="",
        status="queued",
        metadata_={
            "size": len(contents),
        },
    )

    session.add(document)
    await session.commit()
    await session.refresh(document)

    background_tasks.add_task(process_document_background, document.id)

    return DocumentUploadResponse(
        data=DocumentResponse(
            id=document.id,
            original_name=document.original_name,
            mime_type=document.mime_type,
            status=document.status,
            metadata_=document.metadata_ or {},
            created_at=document.created_at,
            chunks_count=0,
        ),
        message="Document uploaded. Indexing has started.",
    )


@router.post("/query", response_model=DocumentQueryResponse)
async def query_document(
    background_tasks: BackgroundTasks,
    payload: DocumentQueryRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> DocumentQueryResponse:
    user_id = current_user.id

    result = await session.execute(
        select(PolicyDocument).where(
            PolicyDocument.id == payload.document_id,
            PolicyDocument.user_id == user_id,
            PolicyDocument.status == "ready",
        )
    )
    document = result.scalar_one_or_none()

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document was not found or is not ready.",
        )

    agent = DocumentQAAgent()
    answer = await agent.answer(
        question=payload.question,
        user_id=user_id,
        document_id=payload.document_id,
    )

    if answer.contexts:
        background_tasks.add_task(
            RagasEvaluationService().evaluate_and_store,
            RagasEvaluationPayload(
                question=payload.question,
                contexts=answer.contexts,
                answer=answer.answer,
                agent_type="document_qa",
                user_id=user_id,
            ),
        )

    return DocumentQueryResponse(
        answer=answer.answer,
        references=answer.references,
        meta={
            "prompt_version": answer.prompt_version,
        },
    )


@router.post("/query/stream")
async def stream_document_query(
    payload: DocumentQueryRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> StreamingResponse:
    user_id = current_user.id

    result = await session.execute(
        select(PolicyDocument).where(
            PolicyDocument.id == payload.document_id,
            PolicyDocument.user_id == user_id,
            PolicyDocument.status == "ready",
        )
    )
    document = result.scalar_one_or_none()

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document was not found or is not ready.",
        )

    agent = DocumentQAAgent()
    chunks = await agent.retrieve_chunks(
        question=payload.question,
        user_id=user_id,
        document_id=payload.document_id,
    )

    references = agent._references(chunks)
    contexts = [chunk.content for chunk in chunks]

    async def event_stream():
        answer_parts: list[str] = []

        yield _sse(
            "meta",
            {
                "prompt_version": agent.prompt_version,
                "references": references,
            },
        )

        if not chunks:
            fallback = "I could not find enough indexed document context to answer that from the selected policy document."
            yield _sse("token", {"delta": fallback})
            yield _sse(
                "done",
                {
                    "answer": fallback,
                    "references": [],
                    "meta": {"prompt_version": agent.prompt_version},
                },
            )
            return

        try:
            async for delta in agent.stream_answer_text(question=payload.question, chunks=chunks):
                answer_parts.append(delta)
                yield _sse("token", {"delta": delta})

            answer = "".join(answer_parts).strip()

            if answer:
                asyncio.create_task(
                    RagasEvaluationService().evaluate_and_store(
                        RagasEvaluationPayload(
                            question=payload.question,
                            contexts=contexts,
                            answer=answer,
                            agent_type="document_qa",
                            user_id=user_id,
                        )
                    )
                )

            yield _sse(
                "done",
                {
                    "answer": answer,
                    "references": references,
                    "meta": {"prompt_version": agent.prompt_version},
                },
            )
        except Exception as exc:
            yield _sse("error", {"message": str(exc)})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


def _sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n"
