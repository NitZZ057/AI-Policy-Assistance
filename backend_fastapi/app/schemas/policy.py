from datetime import datetime

from pydantic import BaseModel
from typing import Any


class PolicyAnalyzeRequest(BaseModel):
    type: str
    coverage: str
    location: str
    risk: str
    document_id: int | None = None


class PolicyAnalyzeResponse(BaseModel):
    id: int
    summary: str
    risk_analysis: str
    email: str
    references: list[dict[str, str | float]]
    sources: list[dict[str, str | int | float]]
    meta: dict[str, str]


class PolicyHistoryItem(BaseModel):
    id: int
    policy_document_id: int | None = None
    policy_type: str
    summary: str
    risk_analysis: str
    email: str
    status: str
    prompt_version: str
    final_output_payload: dict[str, Any] | None = None
    output_payload: dict[str, str]
    references: list[dict[str, str | float]] = []
    sources: list[dict[str, str | int | float]] = []
    reviewed_at: datetime | None = None
    created_at: datetime

class PolicyFinalizeRequest(BaseModel):
    final_output_payload: dict[str, Any]


class PolicyFinalizeResponse(BaseModel):
    id: int
    status: str
    final_output_payload: dict[str, Any]
    reviewed_at: datetime
