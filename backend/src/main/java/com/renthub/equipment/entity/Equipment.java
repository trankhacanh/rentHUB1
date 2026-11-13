package com.renthub.equipment.entity;

import com.renthub.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "equipments")
@Getter
@Setter
@NoArgsConstructor
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "price_per_day", nullable = false)
    private BigDecimal pricePerDay;

    @Column(nullable = false, length = 20)
    private String status = "AVAILABLE";

    @Column(length = 50)
    private String condition;

    @Column(length = 100)
    private String brand;

    @Column(length = 100)
    private String model;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "year_purchased")
    private Integer yearPurchased;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String district;

    @Column(name = "deposit_amount")
    private BigDecimal depositAmount;

    @Column(name = "weekly_discount")
    private BigDecimal weeklyDiscount;

    @Column(name = "monthly_discount")
    private BigDecimal monthlyDiscount;

    @Column(name = "availability", length = 50)
    private String availability = "Available";

    @Column(name = "available_from")
    private String availableFrom;

    @Column(name = "available_until")
    private String availableUntil;

    @Column(name = "allow_request_booking")
    private Boolean allowRequestBooking = true;

    @Column(name = "rules_json", columnDefinition = "TEXT")
    private String rulesJson;

    @Column(name = "additional_rules", columnDefinition = "TEXT")
    private String additionalRules;

    private String address;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private ZonedDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private ZonedDateTime updatedAt;
}