
package com.renthub.contract.service;

import com.renthub.contract.dto.ContractDocumentStatusResponse;
import com.renthub.contract.entity.ContractDocument;
import com.renthub.contract.entity.ContractVersion;
import com.renthub.contract.enums.ContractDocumentStatus;
import com.renthub.contract.repository.ContractVersionRepository;
import com.renthub.contract.storage.ContractPdfStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.renthub.contract.repository.ContractDocumentRepository;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContractPdfAccessService {

    private final ContractService contractService;
    private final ContractVersionRepository versionRepository;
    private final ContractDocumentRepository documentRepository;
    private final ContractPdfStorageService storageService;

    public ContractDocumentStatusResponse getDocumentStatus(
            UUID contractId,
            Integer versionNumber,
            UUID userId
    ) {
        Optional<ContractDocument> document = findAuthorizedDocument(
                contractId,
                versionNumber,
                userId
        );

        if (document.isEmpty()) {
            ContractVersion version = findVersion(
                    contractId,
                    versionNumber
            );

            return new ContractDocumentStatusResponse(
                    contractId,
                    version.getId(),
                    versionNumber,
                    "NOT_GENERATED",
                    null,
                    null,
                    null,
                    null
            );
        }

        return toStatusResponse(
                contractId,
                document.get()
        );
    }

    public DownloadResult download(
            UUID contractId,
            Integer versionNumber,
            UUID userId
    ) {
        Optional<ContractDocument> optionalDocument =
                findAuthorizedDocument(
                        contractId,
                        versionNumber,
                        userId
                );

        if (optionalDocument.isEmpty()) {
            ContractVersion version = findVersion(
                    contractId,
                    versionNumber
            );

            ContractDocumentStatusResponse status =
                    new ContractDocumentStatusResponse(
                            contractId,
                            version.getId(),
                            versionNumber,
                            "NOT_GENERATED",
                            null,
                            null,
                            null,
                            null
                    );

            return new DownloadResult(status, null);
        }

        ContractDocument document = optionalDocument.get();

        ContractDocumentStatusResponse status =
                toStatusResponse(contractId, document);

        if (document.getStatus()
                != ContractDocumentStatus.AVAILABLE) {
            return new DownloadResult(status, null);
        }

        if (document.getObjectKey() == null
                || document.getFileName() == null
                || document.getFileSize() == null
                || document.getChecksumSha256() == null) {
            throw new IllegalStateException(
                    "Available contract document has incomplete metadata"
            );
        }

        byte[] pdfBytes = storageService.download(
                document.getObjectKey()
        );

        // Verify file integrity before returning it to the user.
        if (pdfBytes.length != document.getFileSize()) {
            throw new IllegalStateException(
                    "Contract PDF file size verification failed"
            );
        }

        String actualChecksum = calculateSha256(pdfBytes);

        if (!MessageDigest.isEqual(
                actualChecksum.getBytes(java.nio.charset.StandardCharsets.US_ASCII),
                document.getChecksumSha256().getBytes(
                        java.nio.charset.StandardCharsets.US_ASCII
                )
        )) {
            throw new IllegalStateException(
                    "Contract PDF checksum verification failed"
            );
        }

        return new DownloadResult(status, pdfBytes);
    }

    private Optional<ContractDocument> findAuthorizedDocument(
            UUID contractId,
            Integer versionNumber,
            UUID userId
    ) {
        // Reuse existing participant authorization.
        contractService.getContractById(contractId, userId);

        ContractVersion version = findVersion(
                contractId,
                versionNumber
        );

        return documentRepository.findByContractVersionId(
        version.getId()
);
    }

    private ContractVersion findVersion(
            UUID contractId,
            Integer versionNumber
    ) {
        if (versionNumber == null || versionNumber < 1) {
            throw new IllegalArgumentException(
                    "Invalid contract version number"
            );
        }

        return versionRepository
                .findByContractIdAndVersionNumber(
                        contractId,
                        versionNumber
                )
                .orElseThrow(() -> new IllegalArgumentException(
                        "Contract version not found"
                ));
    }

    private ContractDocumentStatusResponse toStatusResponse(
            UUID contractId,
            ContractDocument document
    ) {
        ContractVersion version = document.getContractVersion();

        return new ContractDocumentStatusResponse(
                contractId,
                version.getId(),
                version.getVersionNumber(),
                document.getStatus().name(),
                document.getFileName(),
                document.getContentType(),
                document.getFileSize(),
                document.getGeneratedAt()
        );
    }

    private String calculateSha256(byte[] content) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256")
                            .digest(content)
            );
        } catch (java.security.NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 algorithm is unavailable",
                    exception
            );
        }
    }

    public record DownloadResult(
            ContractDocumentStatusResponse status,
            byte[] content
    ) {
    }
}
