package com.renthub.booking.entity;

import com.renthub.booking.enums.BookingStatus;
import com.renthub.equipment.entity.Equipment;
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
        name = "bookings",
        indexes = {
                @Index(name = "idx_booking_equipment", columnList = "equipment_id"),
                @Index(name = "idx_booking_renter", columnList = "renter_id"),
                @Index(name = "idx_booking_dates", columnList = "start_date, end_date"),
                @Index(name = "idx_booking_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Equipment được thuê
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "equipment_id",
            nullable = false
    )
    private Equipment equipment;

    /**
     * User thực hiện việc thuê
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "renter_id",
            nullable = false
    )
    private User renter;

    /**
     * Ngày bắt đầu thuê
     */
    @Column(
            name = "start_date",
            nullable = false
    )
    private LocalDate startDate;

    /**
     * Ngày kết thúc thuê
     */
    @Column(
            name = "end_date",
            nullable = false
    )
    private LocalDate endDate;

    /**
     * Số ngày thuê
     */
    @Column(
            name = "total_days",
            nullable = false
    )
    private Integer totalDays;

    /**
     * Giá thuê tại thời điểm booking.
     *
     * Lưu lại giá thay vì chỉ lấy từ Equipment,
     * vì giá Equipment có thể thay đổi sau này.
     */
    @Column(
            name = "price_per_day",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal pricePerDay;

    /**
     * Tổng tiền thuê.
     */
    @Column(
            name = "total_amount",
            nullable = false,
            precision = 15,
            scale = 2
    )
    private BigDecimal totalAmount;

    /**
     * Tiền đặt cọc.
     */
    @Column(
            name = "deposit_amount",
            precision = 15,
            scale = 2
    )
    private BigDecimal depositAmount;

    /**
     * Trạng thái booking.
     */
    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 30
    )
    private BookingStatus status = BookingStatus.PENDING;

    /**
     * Ghi chú của renter.
     */
    @Column(
            columnDefinition = "TEXT"
    )
    private String renterNote;

    /**
     * Lý do owner từ chối booking.
     */
    @Column(
            name = "rejection_reason",
            columnDefinition = "TEXT"
    )
    private String rejectionReason;

    @CreationTimestamp
    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(
            name = "updated_at",
            nullable = false
    )
    private ZonedDateTime updatedAt;
}