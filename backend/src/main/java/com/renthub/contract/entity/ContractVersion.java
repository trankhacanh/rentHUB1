package com.renthub.contract.entity;

import com.renthub.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "contract_versions")
@Getter
@Setter
@NoArgsConstructor
public class ContractVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contract_id", nullable = false)
    private Contract contract;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "equipment_title", nullable = false)
    private String equipmentTitle;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "total_days", nullable = false)
    private Integer totalDays;

    @Column(
            name = "price_per_day",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal pricePerDay;

    @Column(
            name = "rental_amount",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal rentalAmount;

    @Column(
            name = "deposit_amount",
            precision = 15,
            scale = 2
    )
    private BigDecimal depositAmount;

    @Column(
            name = "total_amount",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal totalAmount;

    @Column(columnDefinition = "TEXT")
    private String terms;

    @Column(name = "renter_signed_at")
    private ZonedDateTime renterSignedAt;

    @Column(name = "owner_signed_at")
    private ZonedDateTime ownerSignedAt;

    @CreationTimestamp
    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private ZonedDateTime createdAt;

    @Column(name = "renter_reviewed_at")
    private ZonedDateTime renterReviewedAt;

// Renter identity snapshot at signing time
@Column(name = "renter_first_name", length = 255)
private String renterFirstName;

@Column(name = "renter_last_name", length = 255)
private String renterLastName;

@Column(name = "renter_email", length = 255)
private String renterEmail;

// Owner identity snapshot at signing time
@Column(name = "owner_first_name", length = 255)
private String ownerFirstName;

@Column(name = "owner_last_name", length = 255)
private String ownerLastName;

@Column(name = "owner_email", length = 255)
private String ownerEmail;
}