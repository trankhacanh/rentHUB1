ALTER TABLE contract_documents
ALTER COLUMN checksum_sha256
TYPE VARCHAR(64)
USING BTRIM(checksum_sha256)::VARCHAR(64);