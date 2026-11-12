ALTER TABLE outbox_events
    ADD COLUMN claimed_until TIMESTAMPTZ;

CREATE INDEX idx_outbox_processing_timeout
    ON outbox_events (claimed_until)
    WHERE status = 'PROCESSING';