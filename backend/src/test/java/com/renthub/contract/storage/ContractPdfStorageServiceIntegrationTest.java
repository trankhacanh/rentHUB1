
package com.renthub.contract.storage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@EnabledIfSystemProperty(
        named = "runMinioIT",
        matches = "true"
)
class ContractPdfStorageServiceIntegrationTest {

    @Autowired
    private ContractPdfStorageService storageService;

    @Autowired
    private S3Client s3Client;

    @Value("${app.aws.contract-bucket}")
    private String bucketName;

    @Test
    void shouldUploadAndDownloadContractPdf() {
        UUID contractId = UUID.randomUUID();
        UUID versionId = UUID.randomUUID();

        // Payload mẫu để kiểm tra lưu trữ và tải xuống.
        // Chưa phải PDF được sinh bởi PDF Generator.
        byte[] testBytes = (
                "%PDF-1.4\nRentHub MinIO integration test"
        ).getBytes(StandardCharsets.UTF_8);

        ContractPdfStorageService.StoredContractPdf stored = null;

        try {
            stored = storageService.upload(
                    contractId,
                    versionId,
                    1,
                    testBytes
            );

            assertNotNull(stored.objectKey());
            assertEquals(
                    "application/pdf",
                    stored.contentType()
            );

            assertEquals(
                    (long) testBytes.length,
                    stored.fileSize()
            );

            byte[] downloaded = storageService.download(
                    stored.objectKey()
            );

            assertArrayEquals(testBytes, downloaded);

        } finally {
            if (stored != null) {
                s3Client.deleteObject(
                        DeleteObjectRequest.builder()
                                .bucket(bucketName)
                                .key(stored.objectKey())
                                .build()
                );
            }
        }
    }
}
