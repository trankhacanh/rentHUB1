
package com.renthub.contract.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class ContractPdfStorageService {

    private static final String CONTENT_TYPE = "application/pdf";
    private static final String OBJECT_PREFIX = "contracts/";

    private final S3Client s3Client;
    private final String bucketName;

    public ContractPdfStorageService(
            S3Client s3Client,
            @Value("${app.aws.contract-bucket}") String bucketName
    ) {
        this.s3Client = s3Client;
        this.bucketName = bucketName;
    }

    /**
     * Upload PDF to private MinIO bucket.
     *
     * The object key is deterministic for each contract version,
     * making repeated uploads target the same object.
     */
    public StoredContractPdf upload(
            UUID contractId,
            UUID contractVersionId,
            Integer versionNumber,
            byte[] pdfBytes
    ) {
        if (contractId == null || contractVersionId == null) {
            throw new IllegalArgumentException(
                    "Contract identifiers are required"
            );
        }

        if (versionNumber == null || versionNumber < 1) {
            throw new IllegalArgumentException(
                    "Version number must be positive"
            );
        }

        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalArgumentException(
                    "PDF content cannot be empty"
            );
        }

        String fileName = String.format(
                "contract-%s-v%d.pdf",
                contractId,
                versionNumber
        );

        String objectKey = String.format(
                "contracts/%s/versions/%d-%s.pdf",
                contractId,
                versionNumber,
                contractVersionId
        );

        String checksum = calculateSha256(pdfBytes);

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .contentType(CONTENT_TYPE)
                .contentLength((long) pdfBytes.length)
                .contentDisposition(
                        "attachment; filename=\"" + fileName + "\""
                )
                .metadata(Map.of(
                        "contract-id", contractId.toString(),
                        "contract-version-id", contractVersionId.toString(),
                        "version-number", versionNumber.toString(),
                        "checksum-sha256", checksum
                ))
                .build();

        log.info(
                "Uploading contract PDF: contractId={}, version={}, bucket={}",
                contractId,
                versionNumber,
                bucketName
        );

        s3Client.putObject(
                request,
                RequestBody.fromBytes(pdfBytes)
        );

        log.info(
                "Contract PDF uploaded successfully: objectKey={}",
                objectKey
        );

        return new StoredContractPdf(
                objectKey,
                fileName,
                CONTENT_TYPE,
                (long) pdfBytes.length,
                checksum
        );
    }

    /**
     * Download PDF using an internal object key.
     * Authorization must be checked by the calling service/controller.
     */
    public byte[] download(String objectKey) {
        validateObjectKey(objectKey);

        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .build();

        ResponseBytes<GetObjectResponse> response =
                s3Client.getObjectAsBytes(request);

        return response.asByteArray();
    }

    private void validateObjectKey(String objectKey) {
        if (objectKey == null
                || !objectKey.startsWith(OBJECT_PREFIX)
                || objectKey.contains("..")) {
            throw new IllegalArgumentException(
                    "Invalid contract PDF object key"
            );
        }
    }

    private String calculateSha256(byte[] content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            return HexFormat.of().formatHex(
                    digest.digest(content)
            );

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 algorithm is unavailable",
                    exception
            );
        }
    }

    public record StoredContractPdf(
            String objectKey,
            String fileName,
            String contentType,
            Long fileSize,
            String checksumSha256
    ) {}
}
