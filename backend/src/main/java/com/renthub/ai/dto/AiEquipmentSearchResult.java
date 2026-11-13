package com.renthub.ai.dto;

import java.util.List;

/** Result returned to the LLM after a controlled database search. */
public record AiEquipmentSearchResult(
        String status,
        String message,
        int returnedCount,
        List<AiEquipmentSearchItem> items
) {
    public AiEquipmentSearchResult {
        items = items == null ? List.of() : List.copyOf(items);
    }
}
