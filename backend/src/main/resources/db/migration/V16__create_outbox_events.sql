CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,

    event_type VARCHAR(150) NOT NULL,
    payload JSONB NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    last_error TEXT,

    CONSTRAINT chk_outbox_event_status
        CHECK (status IN ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED')),

    CONSTRAINT chk_outbox_retry_count
        CHECK (retry_count >= 0)
);

CREATE INDEX idx_outbox_pending_events
    ON outbox_events (next_attempt_at, created_at)
    WHERE status = 'PENDING';

CREATE INDEX idx_outbox_aggregate
    ON outbox_events (aggregate_type, aggregate_id);

CREATE INDEX idx_outbox_processing_events
    ON outbox_events (created_at)
    WHERE status = 'PROCESSING';