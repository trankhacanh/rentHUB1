package com.renthub.ai.knowledge.application;

import com.renthub.ai.knowledge.entity.AiKnowledgeDocument;
import com.renthub.ai.knowledge.repository.AiKnowledgeDocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Retrieves evidence from pgvector, then re-validates that its parent document
 * is still published and currently effective before exposing it to the LLM.
 */
@Service
public class KnowledgeRetrievalService {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeRetrievalService.class);
    private static final int TOP_K = 6;
    private static final double SIMILARITY_THRESHOLD = 0.45;
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final VectorStore vectorStore;
    private final AiKnowledgeDocumentRepository documentRepository;

    public KnowledgeRetrievalService(
            VectorStore vectorStore,
            AiKnowledgeDocumentRepository documentRepository
    ) {
        this.vectorStore = vectorStore;
        this.documentRepository = documentRepository;
    }

    /**
     * Backward-compatible helper for callers that only need the evidence text.
     * Prefer retrieveEvidence() when citations are required.
     */
    public String retrieve(String query) {
        return retrieveEvidence(query).context();
    }

    public KnowledgeRetrievalResult retrieveEvidence(String query) {
        if (!StringUtils.hasText(query)) {
            return KnowledgeRetrievalResult.empty();
        }

        List<Document> matches = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query.trim())
                        .topK(TOP_K)
                        .similarityThreshold(SIMILARITY_THRESHOLD)
                        .build()
        );

        if (matches == null || matches.isEmpty()) {
            return KnowledgeRetrievalResult.empty();
        }

        Set<UUID> documentIds = new LinkedHashSet<>();
        for (Document match : matches) {
            UUID documentId = parseDocumentId(match.getMetadata());
            if (documentId != null) {
                documentIds.add(documentId);
            }
        }

        if (documentIds.isEmpty()) {
            return KnowledgeRetrievalResult.empty();
        }

        Collection<AiKnowledgeDocument> publishedDocuments =
                documentRepository.findAllByIdInAndStatus(documentIds, "PUBLISHED");
        Map<UUID, AiKnowledgeDocument> activeDocuments = new LinkedHashMap<>();
        LocalDate today = LocalDate.now(BUSINESS_ZONE);

        if (publishedDocuments != null) {
            for (AiKnowledgeDocument document : publishedDocuments) {
                if (document == null || !isEffectiveToday(document, today)) {
                    continue;
                }
                activeDocuments.put(document.getId(), document);
            }
        }

        if (activeDocuments.isEmpty()) {
            return KnowledgeRetrievalResult.empty();
        }

        Map<UUID, Integer> citationIndexes = new LinkedHashMap<>();
        List<KnowledgeSourceCitation> sources = new ArrayList<>();
        StringBuilder context = new StringBuilder();

        for (Document match : matches) {
            UUID documentId = parseDocumentId(match.getMetadata());
            AiKnowledgeDocument owner = documentId == null ? null : activeDocuments.get(documentId);
            if (owner == null || !StringUtils.hasText(match.getText())) {
                continue;
            }

            int citationIndex = citationIndexes.computeIfAbsent(documentId, id -> {
                int nextIndex = sources.size() + 1;
                sources.add(new KnowledgeSourceCitation(
                        nextIndex,
                        owner.getTitle(),
                        owner.getCategory()
                ));
                return nextIndex;
            });

            Object rawChunkIndex = match.getMetadata().get("chunkIndex");
            context.append("[").append("S").append(citationIndex).append("] ")
                    .append("Tài liệu: ").append(owner.getTitle()).append('\n')
                    .append("Nhóm: ").append(owner.getCategory() == null ? "không phân loại" : owner.getCategory()).append('\n')
                    .append("Đoạn: ").append(rawChunkIndex == null ? "không rõ" : rawChunkIndex).append('\n')
                    .append("Nội dung bằng chứng:\n")
                    .append(match.getText().trim())
                    .append("\n\n");
        }

        if (sources.isEmpty() || context.isEmpty()) {
            return KnowledgeRetrievalResult.empty();
        }

        return new KnowledgeRetrievalResult(context.toString().trim(), sources, true);
    }

    private boolean isEffectiveToday(AiKnowledgeDocument document, LocalDate today) {
        LocalDate from = document.getEffectiveFrom();
        LocalDate until = document.getEffectiveUntil();
        return (from == null || !today.isBefore(from))
                && (until == null || !today.isAfter(until));
    }

    private UUID parseDocumentId(Map<String, Object> metadata) {
        if (metadata == null) {
            return null;
        }
        Object value = metadata.get("knowledgeDocumentId");
        if (value == null) {
            return null;
        }
        try {
            return UUID.fromString(value.toString());
        } catch (IllegalArgumentException exception) {
            log.warn("Skipping vector chunk with invalid knowledgeDocumentId metadata");
            return null;
        }
    }
}
