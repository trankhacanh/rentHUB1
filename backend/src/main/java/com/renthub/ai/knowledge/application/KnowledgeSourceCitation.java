package com.renthub.ai.knowledge.application;

/** A server-owned citation for a retrieved, currently published knowledge document. */
public record KnowledgeSourceCitation(
        int index,
        String title,
        String category
) {
    public String marker() {
        return "[S" + index + "]";
    }

    public String displayName() {
        if (category == null || category.isBlank()) {
            return title;
        }
        return title + " (nhóm: " + category + ")";
    }
}
