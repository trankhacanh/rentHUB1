
package com.renthub.contract.service;

import com.renthub.contract.entity.ContractDocument;
import com.renthub.contract.entity.ContractVersion;
import com.renthub.contract.enums.ContractDocumentStatus;
import com.renthub.contract.generator.ContractPdfData;
import com.renthub.contract.repository.ContractDocumentRepository;
import com.renthub.contract.repository.ContractVersionRepository;
import com.renthub.contract.storage.ContractPdfStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContractDocumentService {

    private final ContractDocumentRepository documentRepository;
    private final ContractVersionRepository versionRepository;

    /**
     * Validate the signed version, create or reuse a document record,
     * and prepare immutable PDF data.
     */
    @Transactional
    public PreparedDocument prepareForGeneration(
            UUID contractId,
            UUID contractVersionId,
            Integer versionNumber,
            UUID eventId
    ) {
        if (contractId == null
                || contractVersionId == null
                || versionNumber == null
                || eventId == null) {
            throw new IllegalArgumentException(
                    "Contract PDF event identifiers are required"
            );
        }

        ContractVersion version = versionRepository
                .findByIdAndContractId(contractVersionId, contractId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Contract version not found"
                ));

        if (!version.getVersionNumber().equals(versionNumber)) {
            throw new IllegalArgumentException(
                    "Contract version number does not match event"
            );
        }

        if (version.getRenterSignedAt() == null
                || version.getOwnerSignedAt() == null) {
            throw new IllegalStateException(
                    "Both parties must sign before PDF generation"
            );
        }

        ContractPdfData pdfData = createPdfData(version);

        Optional<ContractDocument> existing =
                documentRepository.findByContractVersionId(
                        contractVersionId
                );

        ContractDocument document;

        if (existing.isPresent()) {
            document = existing.get();

            if (document.getStatus()
                    == ContractDocumentStatus.AVAILABLE) {
                return new PreparedDocument(
                        document.getId(),
                        null,
                        true
                );
            }

            if (!document.getEventId().equals(eventId)) {
                throw new IllegalStateException(
                        "Contract version is already associated with another event"
                );
            }

            document.setStatus(ContractDocumentStatus.PROCESSING);
            document.setAttemptCount(document.getAttemptCount() + 1);
            document.setFailureReason(null);

        } else {
            Optional<ContractDocument> eventDocument =
                    documentRepository.findByEventId(eventId);

            if (eventDocument.isPresent()) {
                throw new IllegalStateException(
                        "Event ID is already associated with another document"
                );
            }

            document = new ContractDocument();
            document.setContractVersion(version);
            document.setEventId(eventId);
            document.setStatus(ContractDocumentStatus.PROCESSING);
            document.setContentType("application/pdf");
            document.setAttemptCount(1);
        }

        ContractDocument saved =
                documentRepository.saveAndFlush(document);

        return new PreparedDocument(
                saved.getId(),
                pdfData,
                false
        );
    }

    /**
     * Persist successful PDF metadata.
     */
    @Transactional
    public void markAvailable(
            UUID documentId,
            ContractPdfStorageService.StoredContractPdf stored
    ) {
        ContractDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Contract document not found"
                ));

        document.setObjectKey(stored.objectKey());
        document.setFileName(stored.fileName());
        document.setContentType(stored.contentType());
        document.setFileSize(stored.fileSize());
        document.setChecksumSha256(stored.checksumSha256());
        document.setGeneratedAt(OffsetDateTime.now(ZoneOffset.UTC));
        document.setFailureReason(null);
        document.setStatus(ContractDocumentStatus.AVAILABLE);

        documentRepository.saveAndFlush(document);
    }

    /**
     * Persist failure information independently from the PDF generation
     * transaction so RabbitMQ can retry the message.
     */
    @Transactional
    public void markFailed(UUID documentId, Exception exception) {
        ContractDocument document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Contract document not found"
                ));

        if (document.getStatus() == ContractDocumentStatus.AVAILABLE) {
            return;
        }

        String reason = exception.getMessage();

        if (reason == null || reason.isBlank()) {
            reason = exception.getClass().getSimpleName();
        }

        if (reason.length() > 4000) {
            reason = reason.substring(0, 4000);
        }

        document.setStatus(ContractDocumentStatus.FAILED);
        document.setFailureReason(reason);

        documentRepository.saveAndFlush(document);
    }

    private ContractPdfData createPdfData(ContractVersion version) {
        requireSnapshot(version.getRenterFirstName(), "renterFirstName");
        requireSnapshot(version.getRenterLastName(), "renterLastName");
        requireSnapshot(version.getRenterEmail(), "renterEmail");

        requireSnapshot(version.getOwnerFirstName(), "ownerFirstName");
        requireSnapshot(version.getOwnerLastName(), "ownerLastName");
        requireSnapshot(version.getOwnerEmail(), "ownerEmail");

        var contract = version.getContract();

        return new ContractPdfData(
                contract.getId(),
                version.getId(),
                version.getVersionNumber(),

                version.getEquipmentTitle(),
                version.getStartDate(),
                version.getEndDate(),
                version.getTotalDays(),

                version.getPricePerDay(),
                version.getRentalAmount(),
                version.getDepositAmount(),
                version.getTotalAmount(),

                fullName(
                       version.getRenterFirstName(),
    version.getRenterLastName()
                ),
                version.getRenterEmail(),

                fullName(
                         version.getOwnerFirstName(),
    version.getOwnerLastName()
                ),
                version.getOwnerEmail(),

                version.getTerms(),

                version.getRenterSignedAt(),
                version.getOwnerSignedAt()
        );
    }

    private void requireSnapshot(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(
                    "Missing contract identity snapshot: " + field
            );
        }
    }

private String fullName(String firstName, String lastName) {
    return lastName.trim() + " " + firstName.trim();
}

    public record PreparedDocument(
            UUID documentId,
            ContractPdfData pdfData,
            boolean alreadyAvailable
    ) {}
}
