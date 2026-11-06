CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    equipment_id UUID NOT NULL,
    renter_id UUID NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    total_days INTEGER NOT NULL,

    price_per_day NUMERIC(15, 2) NOT NULL,
    total_amount NUMERIC(15, 2) NOT NULL,
    deposit_amount NUMERIC(15, 2),

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    renter_note TEXT,
    rejection_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_booking_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES equipments(id),

    CONSTRAINT fk_booking_renter
        FOREIGN KEY (renter_id)
        REFERENCES users(id),

    CONSTRAINT chk_booking_dates
        CHECK (end_date >= start_date),

    CONSTRAINT chk_booking_total_days
        CHECK (total_days > 0),

    CONSTRAINT chk_booking_price
        CHECK (price_per_day >= 0),

    CONSTRAINT chk_booking_total_amount
        CHECK (total_amount >= 0),

    CONSTRAINT chk_booking_deposit
        CHECK (deposit_amount IS NULL OR deposit_amount >= 0)
);

CREATE INDEX idx_booking_equipment
    ON bookings(equipment_id);

CREATE INDEX idx_booking_renter
    ON bookings(renter_id);

CREATE INDEX idx_booking_dates
    ON bookings(start_date, end_date);

CREATE INDEX idx_booking_status
    ON bookings(status);