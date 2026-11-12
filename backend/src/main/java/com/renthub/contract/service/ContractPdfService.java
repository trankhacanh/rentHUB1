
package com.renthub.contract.service;

import com.renthub.contract.event.ContractSignedEvent;
import com.renthub.contract.generator.ContractPdfGenerator;
import com.renthub.contract.storage.ContractPdfStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContractPdfService {

    private final ContractDocumentService documentService;
    private final ContractPdfGenerator pdfGenerator;
    private final ContractPdfStorageService storageService;

    /**
     * Generate and store the PDF for a signed contract version.
     *
     * The eventId must come from the RabbitMQ messageId.
     */
    public void generateAndStore(
            UUID eventId,
            ContractSignedEvent event
    ) {
        if (event == null || eventId == null) {
            throw new IllegalArgumentException(
                    "Contract signed event and event ID are required"
            );
        }

        var prepared = documentService.prepareForGeneration(
                event.contractId(),
                event.contractVersionId(),
                event.versionNumber(),
                eventId
        );

        if (prepared.alreadyAvailable()) {
            log.info(
                    "Contract PDF already exists. Skipping duplicate event: eventId={}",
                    eventId
            );
            return;
        }

        try {
            byte[] pdfBytes = pdfGenerator.generate(
                    prepared.pdfData()
            );

            var stored = storageService.upload(
                    prepared.pdfData().contractId(),
                    prepared.pdfData().contractVersionId(),
                    prepared.pdfData().versionNumber(),
                    pdfBytes
            );

            documentService.markAvailable(
                    prepared.documentId(),
                    stored
            );

            log.info(
                    "Contract PDF generation completed: contractId={}, version={}, objectKey={}",
                    prepared.pdfData().contractId(),
                    prepared.pdfData().versionNumber(),
                    stored.objectKey()
            );

        } catch (Exception exception) {
            try {
                documentService.markFailed(
                        prepared.documentId(),
                        exception
                );
            } catch (Exception persistenceException) {
                exception.addSuppressed(persistenceException);

                log.error(
                        "Could not persist PDF generation failure: documentId={}",
                        prepared.documentId(),
                        persistenceException
                );
            }

            throw new IllegalStateException(
                    "Contract PDF generation failed for event " + eventId,
                    exception
            );
        }
    }
}
