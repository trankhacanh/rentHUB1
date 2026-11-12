package com.renthub.booking.repository;

import com.renthub.booking.entity.Booking;
import com.renthub.booking.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    java.util.Optional<Booking> findByIdForUpdate(@Param("id") UUID id);

    // Các booking của một người thuê
    List<Booking> findByRenterIdOrderByCreatedAtDesc(UUID renterId);

    // Các booking của thiết bị thuộc owner
    List<Booking> findByEquipmentOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    List<Booking> findAllByOrderByCreatedAtDesc();
    // Các booking của một thiết bị
    List<Booking> findByEquipmentIdOrderByCreatedAtDesc(UUID equipmentId);

    // Kiểm tra booking đang tồn tại trong khoảng thời gian thuê
    @Query("""
        SELECT b
        FROM Booking b
        WHERE b.equipment.id = :equipmentId
          AND b.status IN :statuses
          AND b.startDate < :endDate
          AND b.endDate > :startDate
    """)
    List<Booking> findConflictingBookings(
            @Param("equipmentId") UUID equipmentId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("statuses") List<BookingStatus> statuses
    );

    @Query("""
    SELECT b
    FROM Booking b
    WHERE b.equipment.id = :equipmentId
      AND b.status IN :statuses
    ORDER BY b.startDate ASC
""")
List<Booking> findByEquipmentIdAndStatusInOrderByStartDateAsc(
        @Param("equipmentId") UUID equipmentId,
        @Param("statuses") List<BookingStatus> statuses
);


}
