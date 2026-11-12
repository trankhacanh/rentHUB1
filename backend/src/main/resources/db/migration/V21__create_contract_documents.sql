CREATE TABLE contract_documents (
    id UUID PRIMARY KEY,

    contract_version_id UUID NOT NULL,
    event_id UUID NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',

    object_key VARCHAR(512),
    file_name VARCHAR(255),
    content_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',

    file_size BIGINT,
    checksum_sha256 CHAR(64),

    failure_reason TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 0,

    generated_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_contract_documents_version
        FOREIGN KEY (contract_version_id)
        REFERENCES contract_versions(id)
        ON DELETE RESTRICT,

    -- Một phiên bản hợp đồng chỉ có một PDF chính thức.
    CONSTRAINT uq_contract_documents_version
        UNIQUE (contract_version_id),

    -- Chống ghi nhận cùng một Outbox event nhiều lần.
    CONSTRAINT uq_contract_documents_event
        UNIQUE (event_id),

    -- Không để nhiều tài liệu trỏ đến cùng object key.
    CONSTRAINT uq_contract_documents_object_key
        UNIQUE (object_key),

    CONSTRAINT chk_contract_documents_status
        CHECK (status IN ('PROCESSING', 'AVAILABLE', 'FAILED')),

    CONSTRAINT chk_contract_documents_attempt_count
        CHECK (attempt_count >= 0),

    CONSTRAINT chk_contract_documents_file_size
        CHECK (file_size IS NULL OR file_size > 0),

    -- Chỉ cho phép AVAILABLE khi đã có đủ metadata của file.
    CONSTRAINT chk_contract_documents_available_metadata
        CHECK (
            status <> 'AVAILABLE'
            OR (
                object_key IS NOT NULL
                AND file_name IS NOT NULL
                AND file_size IS NOT NULL
                AND checksum_sha256 IS NOT NULL
                AND generated_at IS NOT NULL
            )
        )
);

CREATE INDEX idx_contract_documents_status
    ON contract_documents(status);