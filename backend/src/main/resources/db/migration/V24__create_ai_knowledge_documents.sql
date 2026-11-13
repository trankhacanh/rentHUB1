-- Enable pgvector for semantic retrieval. Run this migration with a DB role
-- that has permission to install PostgreSQL extensions.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS hstore;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE ai_knowledge_documents (
    id UUID PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(80) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'vi',
    source_reference VARCHAR(500),
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    version INTEGER NOT NULL DEFAULT 1,
    effective_from DATE,
    effective_until DATE,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_ai_knowledge_document_status
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPUBLISHED')),
    CONSTRAINT ck_ai_knowledge_document_effective_dates
        CHECK (effective_until IS NULL OR effective_from IS NULL OR effective_until >= effective_from)
);

CREATE INDEX idx_ai_knowledge_documents_status
    ON ai_knowledge_documents(status);

CREATE INDEX idx_ai_knowledge_documents_category
    ON ai_knowledge_documents(category);
