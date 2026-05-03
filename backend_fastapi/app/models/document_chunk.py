from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    __table_args__ = (
        UniqueConstraint("policy_document_id", "chunk_index", name="uq_document_chunk_index"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    policy_document_id: Mapped[int] = mapped_column(ForeignKey("policy_documents.id"), index=True)

    chunk_index: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    token_count: Mapped[int] = mapped_column(Integer)

    pinecone_vector_id: Mapped[str | None] = mapped_column(index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document = relationship("PolicyDocument", back_populates="chunks")
    analysis_sources = relationship("AnalysisSource", back_populates="chunk")
