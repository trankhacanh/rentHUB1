CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL,
    renter_id UUID NOT NULL,
    owner_id UUID NOT NULL,

    equipment_title VARCHAR(255) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    total_days INTEGER NOT NULL,

    price_per_day NUMERIC(15, 2) NOT NULL,
    rental_amount NUMERIC(15, 2) NOT NULL,
    deposit_amount NUMERIC(15, 2),
    total_amount NUMERIC(15, 2) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

    renter_signed_at TIMESTAMPTZ,
    owner_signed_at TIMESTAMPTZ,

    terms TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_contract_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id),

    CONSTRAINT fk_contract_renter
        FOREIGN KEY (renter_id)
        REFERENCES users(id),

    CONSTRAINT fk_contract_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(id),

    CONSTRAINT uq_contract_booking
        UNIQUE (booking_id),

    CONSTRAINT chk_contract_dates
        CHECK (end_date >= start_date),

    CONSTRAINT chk_contract_total_days
        CHECK (total_days > 0),

    CONSTRAINT chk_contract_price
        CHECK (price_per_day >= 0),

    CONSTRAINT chk_contract_rental_amount
        CHECK (rental_amount >= 0),

    CONSTRAINT chk_contract_deposit
        CHECK (
            deposit_amount IS NULL
            OR deposit_amount >= 0
        ),

    CONSTRAINT chk_contract_total_amount
        CHECK (total_amount >= 0)
);

CREATE INDEX idx_contract_booking
    ON contracts(booking_id);

CREATE INDEX idx_contract_renter
    ON contracts(renter_id);

CREATE INDEX idx_contract_owner
    ON contracts(owner_id);

CREATE INDEX idx_contract_status
    ON contracts(status);