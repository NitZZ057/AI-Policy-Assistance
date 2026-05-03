import asyncio
from pathlib import Path

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.document import PolicyDocument
from app.models.document_chunk import DocumentChunk
from app.services.chunking import DocumentChunker
from app.services.embeddings import EmbeddingService
from app.services.extraction import DocumentTextExtractor
from app.services.vector_store import VectorStore


class DocumentIngestionService:
    def __init__(self) -> None:
        self.extractor = DocumentTextExtractor()
        self.chunker = DocumentChunker()
        self.embeddings = EmbeddingService()
        self.vector_store = VectorStore()

    async def process_document(self, document_id: int) -> None:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(PolicyDocument).where(PolicyDocument.id == document_id)
            )
            document = result.scalar_one_or_none()

            if document is None:
                return

            try:
                document.status = "processing"
                await session.commit()

                raw_text = self.extractor.extract(
                    file_path=document.storage_path,
                    mime_type=document.mime_type,
                )

                if not raw_text:
                    raise ValueError("The uploaded document did not contain extractable text.")

                chunks = self.chunker.chunk(raw_text)

                if not chunks:
                    raise ValueError("The uploaded document could not be chunked.")

                document.raw_text = raw_text

                for index, chunk in enumerate(chunks):
                    db_chunk = DocumentChunk(
                        policy_document_id=document.id,
                        chunk_index=index,
                        content=chunk.content,
                        token_count=chunk.token_count,
                    )

                    session.add(db_chunk)
                    await session.flush()

                    vector_id = f"document:{document.id}:chunk:{db_chunk.id}"
                    embedding = await self.embeddings.embed_document_chunk(chunk.content)

                    metadata = {
                        "user_id": str(document.user_id),
                        "document_id": str(document.id),
                        "chunk_id": str(db_chunk.id),
                        "chunk_index": index,
                        "document_name": document.original_name,
                        "text": chunk.content,
                    }

                    await asyncio.to_thread(
                        self.vector_store.upsert_chunk,
                        vector_id=vector_id,
                        embedding=embedding,
                        metadata=metadata,
                    )

                    db_chunk.pinecone_vector_id = vector_id

                document.status = "ready"
                document.metadata_ = {
                    **(document.metadata_ or {}),
                    "chunk_count": len(chunks),
                }

                await session.commit()

            except Exception as exc:
                document.status = "failed"
                document.metadata_ = {
                    **(document.metadata_ or {}),
                    "error": str(exc),
                }

                await session.commit()
