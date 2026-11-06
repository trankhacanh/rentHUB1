CREATE TABLE processed_message_events (
    event_id UUID PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_processed_message_events_processed_at
    ON processed_message_events(processed_at);
