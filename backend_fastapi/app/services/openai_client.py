import json
from collections.abc import AsyncIterator

from openai import AsyncOpenAI, APIConnectionError, APIStatusError, RateLimitError
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.errors import UpstreamAIError
from app.core.config import get_settings

class OpenAIClient:
    def __init__(self) -> None:
        settings = get_settings()
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = settings.openai_model
        self._embedding_model = settings.openai_embedding_model

    @retry(wait=wait_exponential(min=1, max=8), stop=stop_after_attempt(3), reraise=True)
    async def create_embedding(self, text: str) -> list[float]:
        try:
            response = await self._client.embeddings.create(
                model=self._embedding_model,
                input=text,
            )

            return response.data[0].embedding
        except RateLimitError as exc:
            raise UpstreamAIError(
                message="OpenAI quota or rate limit is unavailable right now.",
                code="openai_rate_limited",
                status_code=503,
            ) from exc
        except APIConnectionError as exc:
            raise UpstreamAIError(
                message="OpenAI is temporarily unreachable.",
                code="openai_unreachable",
                status_code=503,
            ) from exc
        except APIStatusError as exc:
            raise UpstreamAIError(
                message="OpenAI rejected the request.",
                code="openai_request_failed",
                status_code=502,
            ) from exc


    @retry(wait=wait_exponential(min=1, max=8), stop=stop_after_attempt(3), reraise=True)
    async def create_text_response(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        try:
            response = await self._client.responses.create(
                model = self._model,
                input=[
                    {
                        "role" : "system",
                        "content" : system_prompt,
                    },
                    {
                        "role" : "user",
                        "content" : user_prompt,
                    },
                ],
            )

            return response.output_text
        except RateLimitError as exc:
            raise UpstreamAIError(
                message="OpenAI quota or rate limit is unavailable right now.",
                code="openai_rate_limited",
                status_code=503,
            ) from exc
        except APIConnectionError as exc:
            raise UpstreamAIError(
                message="OpenAI is temporarily unreachable.",
                code="openai_unreachable",
                status_code=503,
            ) from exc
        except APIStatusError as exc:
            raise UpstreamAIError(
                message="OpenAI rejected the request.",
                code="openai_request_failed",
                status_code=502,
            ) from exc

    async def stream_text_response(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
    ) -> AsyncIterator[str]:
        try:
            async with self._client.responses.stream(
                model=self._model,
                input=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": user_prompt,
                    },
                ],
            ) as stream:
                async for event in stream:
                    if getattr(event, "type", "") == "response.output_text.delta":
                        delta = getattr(event, "delta", "")

                        if delta:
                            yield delta
        except RateLimitError as exc:
            raise UpstreamAIError(
                message="OpenAI quota or rate limit is unavailable right now.",
                code="openai_rate_limited",
                status_code=503,
            ) from exc
        except APIConnectionError as exc:
            raise UpstreamAIError(
                message="OpenAI is temporarily unreachable.",
                code="openai_unreachable",
                status_code=503,
            ) from exc
        except APIStatusError as exc:
            raise UpstreamAIError(
                message="OpenAI rejected the request.",
                code="openai_request_failed",
                status_code=502,
            ) from exc


    @retry(wait=wait_exponential(min=1, max=8), stop=stop_after_attempt(3), reraise=True)
    async def create_json_response(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        schema: dict,
        schema_name: str,
    ) -> dict:
        try:
            response = await self._client.responses.create(
                model=self._model,
                input=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": user_prompt,
                    },
                ],
                text={
                    "format": {
                        "type": "json_schema",
                        "name": schema_name,
                        "schema": schema,
                        "strict": True,
                    }
                },
            )

            return json.loads(response.output_text)
        except RateLimitError as exc:
            raise UpstreamAIError(
                message="OpenAI quota or rate limit is unavailable right now.",
                code="openai_rate_limited",
                status_code=503,
            ) from exc
        except APIConnectionError as exc:
            raise UpstreamAIError(
                message="OpenAI is temporarily unreachable.",
                code="openai_unreachable",
                status_code=503,
            ) from exc
        except APIStatusError as exc:
            raise UpstreamAIError(
                message="OpenAI rejected the request.",
                code="openai_request_failed",
                status_code=502,
            ) from exc
