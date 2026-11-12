CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    booking_id UUID NOT NULL,
    equipment_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,

    rating INTEGER NOT NULL,
    comment TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id),

    CONSTRAINT fk_review_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES equipments(id),

    CONSTRAINT fk_review_reviewer
        FOREIGN KEY (reviewer_id)
        REFERENCES users(id),

    CONSTRAINT uq_review_booking
        UNIQUE (booking_id),

    CONSTRAINT chk_review_rating
        CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_review_booking
    ON reviews(booking_id);

CREATE INDEX idx_review_equipment
    ON reviews(equipment_id);

CREATE INDEX idx_review_reviewer
    ON reviews(reviewer_id);