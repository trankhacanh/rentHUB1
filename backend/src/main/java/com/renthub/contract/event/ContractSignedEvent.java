package com.renthub.contract.event;

import java.util.UUID;

public record ContractSignedEvent(
        UUID contractId,
        UUID contractVersionId,
        Integer versionNumber
) {
}