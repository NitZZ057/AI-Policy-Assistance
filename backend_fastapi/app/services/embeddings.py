from app.services.openai_client import OpenAIClient

class EmbeddingService:
    def __init__(self, openai_client: OpenAIClient | None = None) -> None:
        self._openai = openai_client or OpenAIClient()

    async def embed_query(self, query: str) -> list[float]:
        cleaned = query.strip()

        if not cleaned:
            raise ValueError("Query cannot be empty.")

        return await self._openai.create_embedding(cleaned)

    async def embed_document_chunk(self, content: str) -> list[float]:
        cleaned = content.strip()

        if not cleaned:
            raise ValueError("Document chunk cannot be empty")

        return await self._openai.create_embedding(cleaned)
