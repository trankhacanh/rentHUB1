package com.renthub.payment.dto;

import com.renthub.payment.enums.PaymentMethod;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreatePaymentRequest {

    private UUID bookingId;

    private PaymentMethod paymentMethod;
}