package com.renthub.ai.knowledge.application;

import java.util.List;

/** Immutable evidence package passed to the chat model and citation formatter. */
public record KnowledgeRetrievalResult(
        String context,
        List<KnowledgeSourceCitation> sources,
        boolean retrievalAvailable
) {
    public KnowledgeRetrievalResult {
        context = context == null ? "" : context;
        sources = sources == null ? List.of() : List.copyOf(sources);
    }

    public static KnowledgeRetrievalResult empty() {
        return new KnowledgeRetrievalResult("", List.of(), true);
    }

    public static KnowledgeRetrievalResult unavailable() {
        return new KnowledgeRetrievalResult("", List.of(), false);
    }

    public boolean hasEvidence() {
        return !context.isBlank() && !sources.isEmpty();
    }
}
