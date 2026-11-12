package com.renthub.contract.entity;

import com.renthub.booking.entity.Booking;
import com.renthub.contract.enums.ContractStatus;
import com.renthub.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "contracts",
        indexes = {
                @Index(name = "idx_contract_booking", columnList = "booking_id"),
                @Index(name = "idx_contract_renter", columnList = "renter_id"),
                @Index(name = "idx_contract_owner", columnList = "owner_id"),
                @Index(name = "idx_contract_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "booking_id",
            nullable = false,
            unique = true
    )
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "renter_id", nullable = false)
    private User renter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "equipment_title", nullable = false)
    private String equipmentTitle;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "total_days", nullable = false)
    private Integer totalDays;

    @Column(name = "price_per_day", nullable = false, precision = 15, scale = 2)
    private BigDecimal pricePerDay;

    @Column(name = "rental_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal rentalAmount;

    @Column(name = "deposit_amount", precision = 15, scale = 2)
    private BigDecimal depositAmount;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ContractStatus status = ContractStatus.DRAFT;
    
    @Column(name = "current_version", nullable = false)
private Integer currentVersion = 1;

    @Column(name = "renter_signed_at")
    private ZonedDateTime renterSignedAt;

    @Column(name = "owner_signed_at")
    private ZonedDateTime ownerSignedAt;

    @Column(columnDefinition = "TEXT")
    private String terms;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;
}