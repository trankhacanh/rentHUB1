package com.renthub.payment.dto;

import com.renthub.payment.enums.PaymentMethod;
import com.renthub.payment.enums.PaymentStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class PaymentResponse {

    private UUID id;

    private UUID bookingId;

    private UUID payerId;

    private BigDecimal amount;

    private BigDecimal depositAmount;

    private BigDecimal totalAmount;

    private PaymentMethod paymentMethod;

    private PaymentStatus status;

    private String transactionId;

    private ZonedDateTime paidAt;

    private ZonedDateTime createdAt;

    private ZonedDateTime updatedAt;
}