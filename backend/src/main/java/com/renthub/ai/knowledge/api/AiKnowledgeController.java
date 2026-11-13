package com.renthub.ai.knowledge.api;

import com.renthub.ai.knowledge.application.KnowledgeDocumentService;
import com.renthub.ai.knowledge.dto.AiKnowledgeDocumentResponse;
import com.renthub.ai.knowledge.dto.CreateKnowledgeDocumentRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/ai/knowledge/documents")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AiKnowledgeController {

    private final KnowledgeDocumentService knowledgeDocumentService;

    @PostMapping
    public ResponseEntity<AiKnowledgeDocumentResponse> createDraft(
            @Valid @RequestBody CreateKnowledgeDocumentRequest request,
            Authentication authentication
    ) {
        AiKnowledgeDocumentResponse response = knowledgeDocumentService.createDraft(
                request,
                authentication.getName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<AiKnowledgeDocumentResponse> listDocuments() {
        return knowledgeDocumentService.listDocuments();
    }

    @PostMapping("/{documentId}/publish")
    public AiKnowledgeDocumentResponse publish(@PathVariable UUID documentId) {
        return knowledgeDocumentService.publish(documentId);
    }

    @PostMapping("/{documentId}/unpublish")
    public AiKnowledgeDocumentResponse unpublish(@PathVariable UUID documentId) {
        return knowledgeDocumentService.unpublish(documentId);
    }
}
