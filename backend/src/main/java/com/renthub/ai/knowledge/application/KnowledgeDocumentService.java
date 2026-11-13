package com.renthub.ai.knowledge.application;

import com.renthub.ai.knowledge.dto.AiKnowledgeDocumentResponse;
import com.renthub.ai.knowledge.dto.CreateKnowledgeDocumentRequest;
import com.renthub.ai.knowledge.entity.AiKnowledgeDocument;
import com.renthub.ai.knowledge.repository.AiKnowledgeDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KnowledgeDocumentService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeDocumentService.class);

    private static final String DRAFT = "DRAFT";
    private static final String PUBLISHED = "PUBLISHED";
    private static final String UNPUBLISHED = "UNPUBLISHED";

    private final AiKnowledgeDocumentRepository documentRepository;
    private final KnowledgeChunker chunker;
    private final VectorStore vectorStore;

    @Transactional
    public AiKnowledgeDocumentResponse createDraft(
            CreateKnowledgeDocumentRequest request,
            String createdBy
    ) {
        validateRequest(request);

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        AiKnowledgeDocument document = new AiKnowledgeDocument();
        document.setId(UUID.randomUUID());
        document.setTitle(request.title().trim());
        document.setCategory(request.category().trim());
        document.setLanguage(request.language().trim().toLowerCase());
        document.setSourceReference(normalizeOptional(request.sourceReference()));
        document.setContent(request.content().trim());
        document.setStatus(DRAFT);
        document.setVersion(1);
        document.setEffectiveFrom(request.effectiveFrom());
        document.setEffectiveUntil(request.effectiveUntil());
        document.setCreatedBy(createdBy);
        document.setCreatedAt(now);
        document.setUpdatedAt(now);

        return AiKnowledgeDocumentResponse.from(documentRepository.save(document));
    }

    @Transactional(readOnly = true)
    public List<AiKnowledgeDocumentResponse> listDocuments() {
        return documentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AiKnowledgeDocumentResponse::from)
                .toList();
    }

    @Transactional
    public AiKnowledgeDocumentResponse publish(UUID documentId) {
        AiKnowledgeDocument document = findDocument(documentId);

        if (PUBLISHED.equals(document.getStatus())) {
            throw new IllegalStateException("Knowledge document is already published");
        }

        validateEffectiveDates(document.getEffectiveFrom(), document.getEffectiveUntil());
        List<String> chunks = chunker.split(document.getContent());
        if (chunks.isEmpty()) {
            throw new IllegalArgumentException("Knowledge document has no indexable content");
        }

        // Clean any stale vectors for this document before re-indexing.
        deleteVectors(document.getId());

        List<Document> vectorDocuments = new ArrayList<>(chunks.size());
        for (int i = 0; i < chunks.size(); i++) {
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("knowledgeDocumentId", document.getId().toString());
            metadata.put("title", document.getTitle());
            metadata.put("category", document.getCategory());
            metadata.put("language", document.getLanguage());
            metadata.put("chunkIndex", i);
            metadata.put("isPublished", true);

            if (document.getEffectiveFrom() != null) {
                metadata.put("effectiveFrom", document.getEffectiveFrom().toString());
            }
            if (document.getEffectiveUntil() != null) {
                metadata.put("effectiveUntil", document.getEffectiveUntil().toString());
            }
            if (StringUtils.hasText(document.getSourceReference())) {
                metadata.put("sourceReference", document.getSourceReference());
            }

            vectorDocuments.add(new Document(
                    UUID.randomUUID().toString(),
                    chunks.get(i),
                    metadata
            ));
        }

        vectorStore.add(vectorDocuments);

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        document.setStatus(PUBLISHED);
        document.setPublishedAt(now);
        document.setUpdatedAt(now);
        AiKnowledgeDocument saved = documentRepository.save(document);

        log.info(
                "[RAG_DOCUMENT_PUBLISHED] documentId={}, category={}, language={}, chunks={}",
                saved.getId(), saved.getCategory(), saved.getLanguage(), vectorDocuments.size()
        );

        return AiKnowledgeDocumentResponse.from(saved);
    }

    @Transactional
    public AiKnowledgeDocumentResponse unpublish(UUID documentId) {
        AiKnowledgeDocument document = findDocument(documentId);
        deleteVectors(document.getId());

        document.setStatus(UNPUBLISHED);
        document.setUpdatedAt(OffsetDateTime.now(ZoneOffset.UTC));
        AiKnowledgeDocument saved = documentRepository.save(document);

        log.info("[RAG_DOCUMENT_UNPUBLISHED] documentId={}", saved.getId());
        return AiKnowledgeDocumentResponse.from(saved);
    }

    private void deleteVectors(UUID documentId) {
        // UUID is generated server-side; it cannot contain filter-expression syntax.
        vectorStore.delete("knowledgeDocumentId == '" + documentId + "'");
    }

    private AiKnowledgeDocument findDocument(UUID documentId) {
        if (documentId == null) {
            throw new IllegalArgumentException("Document ID is required");
        }
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Knowledge document not found"));
    }

    private void validateRequest(CreateKnowledgeDocumentRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required");
        }
        validateEffectiveDates(request.effectiveFrom(), request.effectiveUntil());
        if (!StringUtils.hasText(request.content())) {
            throw new IllegalArgumentException("Document content is required");
        }
    }

    private void validateEffectiveDates(LocalDate effectiveFrom, LocalDate effectiveUntil) {
        if (effectiveFrom != null && effectiveUntil != null
                && effectiveUntil.isBefore(effectiveFrom)) {
            throw new IllegalArgumentException("effectiveUntil must not be before effectiveFrom");
        }
    }

    private String normalizeOptional(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
