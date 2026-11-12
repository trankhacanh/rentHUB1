CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL,
    payer_id UUID NOT NULL,

    amount NUMERIC(15, 2) NOT NULL,
    deposit_amount NUMERIC(15, 2),
    total_amount NUMERIC(15, 2) NOT NULL,

    payment_method VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    transaction_id VARCHAR(100) UNIQUE,

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id),

    CONSTRAINT fk_payment_payer
        FOREIGN KEY (payer_id)
        REFERENCES users(id),

    CONSTRAINT uq_payment_booking
        UNIQUE (booking_id),

    CONSTRAINT chk_payment_amount
        CHECK (amount >= 0),

    CONSTRAINT chk_payment_deposit
        CHECK (
            deposit_amount IS NULL
            OR deposit_amount >= 0
        ),

    CONSTRAINT chk_payment_total_amount
        CHECK (total_amount >= 0)
);

CREATE INDEX idx_payment_booking
    ON payments(booking_id);

CREATE INDEX idx_payment_payer
    ON payments(payer_id);

CREATE INDEX idx_payment_status
    ON payments(status);