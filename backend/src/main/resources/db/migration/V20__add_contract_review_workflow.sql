-- Record when renter accepts a specific contract version.
ALTER TABLE contract_versions
ADD COLUMN renter_reviewed_at TIMESTAMPTZ;


-- Store revision requests with their reasons.
CREATE TABLE contract_revision_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    contract_id UUID NOT NULL,
    contract_version_id UUID NOT NULL,
    requested_by UUID NOT NULL,

    reason TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

    resolved_by UUID,
    resolved_version_id UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ,

    CONSTRAINT fk_revision_contract
        FOREIGN KEY (contract_id)
        REFERENCES contracts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_revision_contract_version
        FOREIGN KEY (contract_version_id)
        REFERENCES contract_versions(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_revision_requested_by
        FOREIGN KEY (requested_by)
        REFERENCES users(id),

    CONSTRAINT fk_revision_resolved_by
        FOREIGN KEY (resolved_by)
        REFERENCES users(id),

    CONSTRAINT fk_revision_resolved_version
        FOREIGN KEY (resolved_version_id)
        REFERENCES contract_versions(id),

    CONSTRAINT chk_revision_reason
        CHECK (length(btrim(reason)) > 0),

    CONSTRAINT chk_revision_status
        CHECK (status IN ('OPEN', 'RESOLVED'))
);

CREATE INDEX idx_revision_contract
    ON contract_revision_requests(contract_id);

CREATE INDEX idx_revision_version
    ON contract_revision_requests(contract_version_id);

CREATE INDEX idx_revision_created
    ON contract_revision_requests(created_at DESC);

-- A contract may have only one unresolved revision request.
CREATE UNIQUE INDEX uq_contract_open_revision
    ON contract_revision_requests(contract_id)
    WHERE status = 'OPEN';