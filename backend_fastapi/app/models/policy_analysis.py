from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class PolicyAnalysis(Base):
    __tablename__ = "policy_analyses"

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"),index=True)
    policy_document_id: Mapped[int | None] =  mapped_column(ForeignKey("policy_documents.id"), nullable=True, index=True)

    policy_type: Mapped[str] = mapped_column(String(255))
    coverage: Mapped[str] = mapped_column(Text)
    location: Mapped[str] = mapped_column(String(255))
    risk: Mapped[str] = mapped_column(Text)

    summary: Mapped[str] = mapped_column(Text)
    risk_analysis: Mapped[str] = mapped_column(Text)
    email: Mapped[str] = mapped_column(Text)

    status: Mapped[str] = mapped_column(String(40), default="draft", index=True)
    prompt_version: Mapped[str] = mapped_column(String(40), default="v1")

    final_output_payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    metadata_: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict)

    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(),onupdate=func.now())


    user = relationship("User", back_populates="policy_analyses")
    document = relationship("PolicyDocument", back_populates="policy_analyses")
    sources = relationship("AnalysisSource", back_populates="policy_analysis", cascade="all, delete-orphan")
