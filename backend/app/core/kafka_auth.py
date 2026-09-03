"""
Shared Kafka connection settings.
If KAFKA_USERNAME is set, connects using SASL_SSL (required by managed
brokers like Redpanda Cloud, Confluent Cloud, Upstash Kafka).
Otherwise falls back to a plain local broker (e.g. the docker-compose Kafka).
"""
from app.core.config import settings


def kafka_connection_kwargs() -> dict:
    kwargs = {"bootstrap_servers": settings.KAFKA_BOOTSTRAP_SERVERS}

    if settings.KAFKA_USERNAME:
        kwargs.update(
            security_protocol=settings.KAFKA_SECURITY_PROTOCOL,
            sasl_mechanism=settings.KAFKA_SASL_MECHANISM,
            sasl_plain_username=settings.KAFKA_USERNAME,
            sasl_plain_password=settings.KAFKA_PASSWORD,
        )

    return kwargs
