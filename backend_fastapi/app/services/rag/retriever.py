from dataclasses import dataclass, replace

from app.services.embeddings import EmbeddingService
from app.services.vector_store import VectorStore


@dataclass(frozen=True)
class RetrievedChunk:
    chunk_id: int
    document_id: int
    document_name: str
    chunk_index: int
    content: str
    score: float
    context_label: str = "SUPPORTING CONTEXT"


class RagService:
    def __init__(
        self,
        embedding_service: EmbeddingService | None = None,
        vector_store: VectorStore | None = None,
    ) -> None:
        self.embeddings = embedding_service or EmbeddingService()
        self.vector_store = vector_store or VectorStore()

    async def retrieve(
        self,
        *,
        query: str,
        user_id: int,
        document_id: int | None = None,
        top_k: int = 5,
    ) -> list[RetrievedChunk]:
        if document_id is None:
            return []

        query_embedding = await self.embeddings.embed_query(query)

        matches = self.vector_store.query(
            embedding=query_embedding,
            top_k=min(top_k, 5),
            metadata_filter={
                "user_id": {"$eq": str(user_id)},
                "document_id": {"$eq": str(document_id)},
            },
        )

        chunks: list[RetrievedChunk] = []

        for match in matches:
            metadata = match.get("metadata", {})

            chunks.append(
                RetrievedChunk(
                    chunk_id=int(metadata["chunk_id"]),
                    document_id=int(metadata["document_id"]),
                    document_name=str(metadata.get("document_name", "Policy document")),
                    chunk_index=int(metadata.get("chunk_index", 0)),
                    content=str(metadata.get("text", "")),
                    score=float(match.get("score", 0.0)),
                )
            )

        sorted_chunks = sorted(chunks, key=lambda chunk: chunk.score, reverse=True)
        reordered = self._lost_in_middle_reorder(sorted_chunks)

        return self._label_chunks(reordered)

    def _lost_in_middle_reorder(self, chunks: list[RetrievedChunk]) -> list[RetrievedChunk]:
        if len(chunks) <= 2:
            return chunks

        reordered: list[RetrievedChunk] = []
        left = 0
        right = len(chunks) - 1

        while left <= right:
            reordered.append(chunks[left])
            left += 1

            if left <= right:
                reordered.append(chunks[right])
                right -= 1

        return reordered

    def _label_chunks(self, chunks: list[RetrievedChunk]) -> list[RetrievedChunk]:
        if not chunks:
            return []

        labeled = [replace(chunks[0], context_label="HIGH RELEVANCE CONTEXT")]

        for chunk in chunks[1:]:
            labeled.append(replace(chunk, context_label="SUPPORTING CONTEXT"))

        return labeled
