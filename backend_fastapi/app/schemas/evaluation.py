from datetime import datetime

from pydantic import BaseModel


class EvaluationScoreSummary(BaseModel):
    faithfulness: float | None
    relevance: float | None
    context_precision: float | None
    context_recall: float | None


class EvaluationTrendPoint(BaseModel):
    date: str
    faithfulness: float | None
    relevance: float | None
    count: int


class EvaluationAgentSummary(BaseModel):
    agent_type: str
    count: int
    faithfulness: float | None
    relevance: float | None
    context_precision: float | None
    context_recall: float | None


class EvaluationSummaryResponse(BaseModel):
    averages: EvaluationScoreSummary
    total_evaluations: int
    failed_evaluations: int
    trend: list[EvaluationTrendPoint]
    agents: list[EvaluationAgentSummary]


class EvaluationHistoryItem(BaseModel):
    id: int
    query: str
    answer: str
    agent_type: str
    faithfulness_score: float | None
    relevance_score: float | None
    context_precision: float | None
    context_recall: float | None
    error_message: str | None
    created_at: datetime


class EvaluationHistoryResponse(BaseModel):
    data: list[EvaluationHistoryItem]
