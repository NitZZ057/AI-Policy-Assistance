from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    id: int
    original_name: str
    mime_type: str
    status: str
    metadata_: dict[str, Any]
    created_at: datetime
    chunks_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class DocumentUploadResponse(BaseModel):
    data: DocumentResponse
    duplicate: bool = False
    message: str


class DocumentQueryRequest(BaseModel):
    document_id: int
    question: str


class DocumentQueryResponse(BaseModel):
    answer: str
    references: list[dict[str, str | float]]
    meta: dict[str, str]
