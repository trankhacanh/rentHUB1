CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    type VARCHAR(100) NOT NULL,

    title VARCHAR(255) NOT NULL,

    message TEXT,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    reference_id UUID,

    reference_type VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
);

CREATE INDEX idx_notification_user
    ON notifications(user_id);

CREATE INDEX idx_notification_read
    ON notifications(is_read);

CREATE INDEX idx_notification_created
    ON notifications(created_at);