package com.renthub.ai.knowledge.repository;

import com.renthub.ai.knowledge.entity.AiKnowledgeDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface AiKnowledgeDocumentRepository
        extends JpaRepository<AiKnowledgeDocument, UUID> {

    boolean existsByStatus(String status);

    List<AiKnowledgeDocument> findAllByOrderByCreatedAtDesc();

    List<AiKnowledgeDocument> findAllByIdInAndStatus(Collection<UUID> ids, String status);
}
