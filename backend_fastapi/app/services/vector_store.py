from typing import Any
from pinecone.grpc import PineconeGRPC as Pinecone
from pinecone import ServerlessSpec

from app.core.config import get_settings
from app.core.errors import VectorStoreError

class VectorStore:
    def __init__(self) -> None:
        settings = get_settings()

        self._settings = settings
        self._pc = Pinecone(api_key=settings.pinecone_api_key)

        existing_indexes = {index["name"] for index in self._pc.list_indexes()}

        if settings.pinecone_index_name not in existing_indexes:
            self._pc.create_index(
                name=settings.pinecone_index_name,
                dimension=1536,
                metric="cosine",
                spec=ServerlessSpec(
                    cloud=settings.pinecone_cloud,
                    region=settings.pinecone_region,
                ),
            )

        self._index = self._pc.Index(settings.pinecone_index_name)

    def upsert_chunk(
            self,
            *,
            vector_id: str,
            embedding: list[float],
            metadata: dict[str, Any],
    ) -> None:
        try:
            self._index.upsert(
                vectors=[
                    {
                        "id": vector_id,
                        "values": embedding,
                        "metadata" : metadata,
                    }
                ],
                namespace=self._settings.pinecone_namespace,
            )
        except Exception as exc:
            raise VectorStoreError(
                message="Vector index update failed.",
                code="pinecone_upsert_failed",
                status_code=502,
            ) from exc

    def query(
            self,
            *,
            embedding: list[float],
            top_k: int,
            metadata_filter: dict[str, Any],
    ) -> list[dict[str, Any]]:
        try:
            result = self._index.query(
                vector = embedding,
                top_k = top_k,
                namespace = self._settings.pinecone_namespace,
                filter = metadata_filter,
                include_metadata = True,
            )

            return [
                {
                    "id": match["id"],
                    "score": match["score"],
                    "metadata": match.get("metadata",{}),
                }

                for match in result.get("matches", [])
            ]
        except Exception as exc:
            raise VectorStoreError(
                message="Vector search failed.",
                code="pinecone_query_failed",
                status_code=502,
            ) from exc
