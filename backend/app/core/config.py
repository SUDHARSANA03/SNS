from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-powered Log Analyzer"
    API_V1_STR: str = "/api"
    NVIDIA_API_KEY: Optional[str] = None
    NVIDIA_MODEL: str = "nvidia/nemotron-4-340b-instruct"
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None

    # Kafka & Redis Queue Configuration
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    KAFKA_TOPIC_JOBS: str = "incident-jobs"
    KAFKA_TOPIC_RESULTS: str = "incident-results"
    KAFKA_TOPIC_DLQ: str = "incident-dlq"
    KAFKA_GROUP_ID: str = "incident-ai-workers"
    REDIS_URL: str = "redis://localhost:6379"

    # Kafka SASL auth (needed for managed brokers like Redpanda Cloud/Upstash/Confluent).
    # Leave KAFKA_USERNAME unset to fall back to a plaintext local broker (e.g. docker-compose).
    KAFKA_USERNAME: Optional[str] = None
    KAFKA_PASSWORD: Optional[str] = None
    KAFKA_SASL_MECHANISM: str = "SCRAM-SHA-256"
    KAFKA_SECURITY_PROTOCOL: str = "SASL_SSL"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
