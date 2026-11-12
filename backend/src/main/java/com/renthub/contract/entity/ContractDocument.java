package com.renthub.contract.entity;

import com.renthub.contract.enums.ContractDocumentStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "contract_documents")
@Getter
@Setter
@NoArgsConstructor
public class ContractDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "contract_version_id",
            nullable = false,
            unique = true
    )
    private ContractVersion contractVersion;

    @Column(
            name = "event_id",
            nullable = false,
            unique = true,
            updatable = false
    )
    private UUID eventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContractDocumentStatus status =
            ContractDocumentStatus.PROCESSING;

    @Column(name = "object_key", length = 512, unique = true)
    private String objectKey;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType = "application/pdf";

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "checksum_sha256", length = 64)
    private String checksumSha256;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;

    @Column(name = "generated_at")
    private OffsetDateTime generatedAt;

    @CreationTimestamp
    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}