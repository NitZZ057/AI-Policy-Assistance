from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_env: str = "local"
    app_name: str = "AI Policy Assistant API"

    database_url: str

    openai_api_key: str
    openai_model: str = "gpt-4.1-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    policy_analysis_prompt_version: str = "v1"
    document_qa_prompt_version: str = "v1"

    pinecone_api_key: str
    pinecone_index_name: str = "policy-assistant"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"
    pinecone_namespace: str = "documents"

    upload_dir: str = "storage/uploads"

    model_config = SettingsConfigDict(
        env_file = ".env",
        env_file_encoding = "utf-8",
        case_sensitive = False,
        extra = "ignore",
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()
