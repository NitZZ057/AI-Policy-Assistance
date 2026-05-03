from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class AnalysisSource(Base):
    __tablename__ = "analysis_sources"

    id: Mapped[int] = mapped_column(primary_key=True)

    policy_analysis_id: Mapped[int] = mapped_column(ForeignKey("policy_analyses.id"),index=True)
    document_chunk_id: Mapped[int] = mapped_column(ForeignKey("document_chunks.id"), index=True)
    score: Mapped[float] = mapped_column(Float)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),server_default=func.now())

    policy_analysis = relationship("PolicyAnalysis", back_populates="sources")
    chunk = relationship("DocumentChunk", back_populates="analysis_sources")