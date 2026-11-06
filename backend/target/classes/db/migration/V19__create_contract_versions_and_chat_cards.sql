-- =====================================================
-- V19: Contract Versions and Chat Contract Cards
-- =====================================================

-- 1. Track the current contract version
ALTER TABLE contracts
ADD COLUMN current_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE contracts
ADD CONSTRAINT chk_contract_current_version
CHECK (current_version > 0);


-- 2. Store immutable contract content snapshots
CREATE TABLE contract_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    contract_id UUID NOT NULL,
    version_number INTEGER NOT NULL,

    -- NULL is allowed for legacy contracts because
    -- the original creator was not recorded.
    created_by UUID,

    equipment_title VARCHAR(255) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,

    price_per_day NUMERIC(15, 2) NOT NULL,
    rental_amount NUMERIC(15, 2) NOT NULL,
    deposit_amount NUMERIC(15, 2),
    total_amount NUMERIC(15, 2) NOT NULL,

    terms TEXT,

    -- Signatures belong to a specific version.
    renter_signed_at TIMESTAMPTZ,
    owner_signed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_contract_version_contract
        FOREIGN KEY (contract_id)
        REFERENCES contracts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_contract_version_creator
        FOREIGN KEY (created_by)
        REFERENCES users(id),

    CONSTRAINT uq_contract_version_number
        UNIQUE (contract_id, version_number),

    CONSTRAINT chk_contract_version_number
        CHECK (version_number > 0),

    CONSTRAINT chk_contract_version_dates
        CHECK (end_date >= start_date),

    CONSTRAINT chk_contract_version_total_days
        CHECK (total_days > 0),

    CONSTRAINT chk_contract_version_price
        CHECK (price_per_day >= 0),

    CONSTRAINT chk_contract_version_rental
        CHECK (rental_amount >= 0),

    CONSTRAINT chk_contract_version_deposit
        CHECK (deposit_amount IS NULL OR deposit_amount >= 0),

    CONSTRAINT chk_contract_version_total
        CHECK (total_amount >= 0)
);

CREATE INDEX idx_contract_version_contract
    ON contract_versions(contract_id);


-- 3. Backfill version 1 for existing contracts.
-- Existing creator information is unavailable, so created_by = NULL.
INSERT INTO contract_versions (
    contract_id,
    version_number,
    created_by,
    equipment_title,
    start_date,
    end_date,
    total_days,
    price_per_day,
    rental_amount,
    deposit_amount,
    total_amount,
    terms,
    renter_signed_at,
    owner_signed_at,
    created_at
)
SELECT
    id,
    1,
    NULL,
    equipment_title,
    start_date,
    end_date,
    total_days,
    price_per_day,
    rental_amount,
    deposit_amount,
    total_amount,
    terms,
    renter_signed_at,
    owner_signed_at,
    created_at
FROM contracts;


-- 4. Allow chat messages to reference a contract version.
ALTER TABLE messages
ADD COLUMN contract_version_id UUID;

ALTER TABLE messages
ADD CONSTRAINT fk_message_contract_version
    FOREIGN KEY (contract_version_id)
    REFERENCES contract_versions(id)
    ON DELETE RESTRICT;

ALTER TABLE messages
ADD CONSTRAINT chk_contract_card_version
CHECK (
    (
        message_type = 'CONTRACT_CARD'
        AND contract_version_id IS NOT NULL
    )
    OR
    (
        message_type <> 'CONTRACT_CARD'
        AND contract_version_id IS NULL
    )
);

CREATE INDEX idx_message_contract_version
    ON messages(contract_version_id);
