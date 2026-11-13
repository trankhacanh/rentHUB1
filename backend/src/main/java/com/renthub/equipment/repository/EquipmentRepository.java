package com.renthub.equipment.repository;

import com.renthub.equipment.entity.Equipment;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EquipmentRepository extends JpaRepository<Equipment, UUID> {

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT e FROM Equipment e WHERE e.id = :id")
        Optional<Equipment> findByIdForUpdate(@Param("id") UUID id);

        List<Equipment> findByStatus(String status);

        List<Equipment> findByOwnerId(UUID ownerId);

        // Existing location-based queries.
        List<Equipment> findByStatusAndAddressContaining(
                        String status,
                        String address);

        List<Equipment> findByStatusAndAddressContainingAndCategoryId(
                        String status,
                        String address,
                        UUID categoryId);

        /**
         * Controlled, read-only search for the AI assistant.
         * Only public listings with status AVAILABLE can be returned.
         */
        @Query("""
                        SELECT e
                        FROM Equipment e
                        LEFT JOIN e.category c
                        WHERE UPPER(e.status) = 'AVAILABLE'

                          AND (
                                CAST(:keyword AS string) IS NULL
                                OR LOWER(COALESCE(e.title, ''))
                                    LIKE CONCAT(
                                        '%',
                                        LOWER(CAST(:keyword AS string)),
                                        '%'
                                    )
                                OR LOWER(COALESCE(e.description, ''))
                                    LIKE CONCAT(
                                        '%',
                                        LOWER(CAST(:keyword AS string)),
                                        '%'
                                    )
                                OR LOWER(COALESCE(e.brand, ''))
                                    LIKE CONCAT(
                                        '%',
                                        LOWER(CAST(:keyword AS string)),
                                        '%'
                                    )
                                OR LOWER(COALESCE(e.model, ''))
                                    LIKE CONCAT(
                                        '%',
                                        LOWER(CAST(:keyword AS string)),
                                        '%'
                                    )
                                OR LOWER(COALESCE(c.name, ''))
                                    LIKE CONCAT(
                                        '%',
                                        LOWER(CAST(:keyword AS string)),
                                        '%'
                                    )
                          )

                          AND (
                                CAST(:category AS string) IS NULL
                                OR LOWER(COALESCE(c.name, ''))
                                    LIKE CONCAT(
                                        '%',
                                        LOWER(CAST(:category AS string)),
                                        '%'
                                    )
                          )

                          AND (
                                CAST(:city AS string) IS NULL
                                OR LOWER(COALESCE(e.city, ''))
                                    LIKE CONCAT(
                                        '%',
                                        LOWER(CAST(:city AS string)),
                                        '%'
                                    )
                          )

                          AND (
                                CAST(:district AS string) IS NULL
                                OR LOWER(COALESCE(e.district, ''))
                                    LIKE CONCAT(
                                        '%',
                                        LOWER(CAST(:district AS string)),
                                        '%'
                                    )
                          )

                          AND (
                                :minPricePerDay IS NULL
                                OR e.pricePerDay >= :minPricePerDay
                          )

                          AND (
                                :maxPricePerDay IS NULL
                                OR e.pricePerDay <= :maxPricePerDay
                          )

                        ORDER BY e.pricePerDay ASC, e.createdAt DESC
                        """)
        List<Equipment> searchAvailableForAi(
                        @Param("keyword") String keyword,
                        @Param("category") String category,
                        @Param("city") String city,
                        @Param("district") String district,
                        @Param("minPricePerDay") BigDecimal minPricePerDay,
                        @Param("maxPricePerDay") BigDecimal maxPricePerDay,
                        Pageable pageable);

}
