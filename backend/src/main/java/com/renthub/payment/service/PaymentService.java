package com.renthub.payment.service;
import java.util.Map;
import com.renthub.booking.entity.Booking;
import com.renthub.booking.enums.BookingStatus;
import com.renthub.booking.repository.BookingRepository;
import com.renthub.payment.dto.CreatePaymentRequest;
import com.renthub.payment.dto.PaymentResponse;
import com.renthub.payment.entity.Payment;
import com.renthub.payment.enums.PaymentMethod;
import com.renthub.payment.enums.PaymentStatus;
import com.renthub.payment.repository.PaymentRepository;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
        private final VnPayService vnPayService;
        private final MomoService momoService;
    @Transactional
    public PaymentResponse createPayment(
            CreatePaymentRequest request,
            UUID payerId
    ) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Payment request is required"
            );
        }

        if (request.getBookingId() == null) {
            throw new IllegalArgumentException(
                    "Booking ID is required"
            );
        }

        if (request.getPaymentMethod() == null) {
            throw new IllegalArgumentException(
                    "Payment method is required"
            );
        }

       if (request.getPaymentMethod() != PaymentMethod.MOCK
        && request.getPaymentMethod() != PaymentMethod.MOMO) {
    throw new IllegalArgumentException(
            "This payment method is not integrated yet"
    );
}

        User payer = userRepository.findById(payerId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Payer not found"
                        )
                );

        Booking booking = bookingRepository.findById(
                request.getBookingId()
        ).orElseThrow(() ->
                new IllegalArgumentException(
                        "Booking not found"
                )
        );

        if (!booking.getRenter().getId().equals(payerId)) {
            throw new IllegalArgumentException(
                    "You are not the renter of this booking"
            );
        }

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalArgumentException(
                    "Only APPROVED bookings can be paid"
            );
        }

        if (paymentRepository.existsByBookingId(
                booking.getId()
        )) {
            throw new IllegalArgumentException(
                    "Payment already exists for this booking"
            );
        }

      
 // 1. Lấy tiền thuê từ booking đã lưu
BigDecimal amount = booking.getTotalAmount();

if (amount == null ||
        amount.compareTo(BigDecimal.ZERO) <= 0) {
    throw new IllegalArgumentException(
            "Booking rental amount must be greater than zero"
    );
}

// 2. Lấy và kiểm tra tiền cọc
BigDecimal depositAmount = booking.getDepositAmount();

if (depositAmount != null &&
        depositAmount.compareTo(BigDecimal.ZERO) < 0) {
    throw new IllegalArgumentException(
            "Booking deposit amount cannot be negative"
    );
}

// 3. Tổng thanh toán = tiền thuê + tiền cọc
BigDecimal totalAmount = amount.add(
        depositAmount != null
                ? depositAmount
                : BigDecimal.ZERO
);

if (totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
    throw new IllegalArgumentException(
            "Payment total amount must be greater than zero"
    );
}


        Payment payment = new Payment();

        payment.setBooking(booking);
        payment.setPayer(payer);
        payment.setAmount(amount);
        payment.setDepositAmount(depositAmount);
        payment.setTotalAmount(totalAmount);
        payment.setPaymentMethod(
                request.getPaymentMethod()
        );
        payment.setStatus(PaymentStatus.PENDING);

        Payment savedPayment =
                paymentRepository.saveAndFlush(payment);

        return toResponse(savedPayment);
    }

    @Transactional
    public PaymentResponse processMockPayment(
            UUID paymentId,
            UUID payerId
    ) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Payment not found"
                        )
                );

        if (!payment.getPayer().getId().equals(payerId)) {
            throw new IllegalArgumentException(
                    "You are not the payer of this payment"
            );
        }

        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Only PENDING payments can be processed"
            );
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setTransactionId(
                "MOCK-" + UUID.randomUUID()
        );
        payment.setPaidAt(ZonedDateTime.now());

        Payment savedPayment =
                paymentRepository.saveAndFlush(payment);

        return toResponse(savedPayment);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(
            UUID paymentId,
            UUID userId
    ) {

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Payment not found"
                        )
                );

        if (!payment.getPayer().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "You are not the payer of this payment"
            );
        }

        return toResponse(payment);
    }

@Transactional(readOnly = true)
public List<PaymentResponse> getAllPaymentsForAdmin() {
    return paymentRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(this::toResponse)
            .toList();
}

    @Transactional(readOnly = true)
    public List<PaymentResponse> getMyPayments(
            UUID payerId
    ) {

        return paymentRepository
                .findByPayerIdOrderByCreatedAtDesc(payerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private PaymentResponse toResponse(
            Payment payment
    ) {

        PaymentResponse response =
                new PaymentResponse();

        response.setId(payment.getId());

        response.setBookingId(
                payment.getBooking().getId()
        );

        response.setPayerId(
                payment.getPayer().getId()
        );

        response.setAmount(
                payment.getAmount()
        );

        response.setDepositAmount(
                payment.getDepositAmount()
        );

        response.setTotalAmount(
                payment.getTotalAmount()
        );

        response.setPaymentMethod(
                payment.getPaymentMethod()
        );

        response.setStatus(
                payment.getStatus()
        );

        response.setTransactionId(
                payment.getTransactionId()
        );

        response.setPaidAt(
                payment.getPaidAt()
        );

        response.setCreatedAt(
                payment.getCreatedAt()
        );

        response.setUpdatedAt(
                payment.getUpdatedAt()
        );

        return response;
    }

    
@Transactional
public String createVnPayPaymentUrl(
        UUID paymentId,
        UUID payerId,
        String clientIp
) {
    Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Payment not found"));

    if (!payment.getPayer().getId().equals(payerId)) {
        throw new IllegalArgumentException(
                "You are not the payer of this payment");
    }

    if (payment.getPaymentMethod() != PaymentMethod.VNPAY) {
        throw new IllegalArgumentException(
                "Payment method must be VNPAY");
    }

    if (payment.getStatus() != PaymentStatus.PENDING) {
        throw new IllegalArgumentException(
                "Only PENDING payments can be processed");
    }

    return vnPayService.createPaymentUrl(payment, clientIp);
}

@Transactional
public void processVnPayReturn(Map<String, String> params) {
    if (!vnPayService.verifySignature(params)) {
        throw new IllegalArgumentException(
                "Invalid VNPay signature");
    }

    String txnRef = params.get("vnp_TxnRef");
    if (txnRef == null || txnRef.isBlank()) {
        throw new IllegalArgumentException(
                "Missing VNPay transaction reference");
    }

    UUID paymentId;
    try {
        paymentId = UUID.fromString(txnRef);
    } catch (IllegalArgumentException ex) {
        throw new IllegalArgumentException(
                "Invalid VNPay transaction reference");
    }

    Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Payment not found"));

    if (payment.getPaymentMethod() != PaymentMethod.VNPAY) {
        throw new IllegalArgumentException(
                "Payment method mismatch");
    }

    if (!vnPayService.amountMatches(payment, params)) {
        throw new IllegalArgumentException(
                "VNPay amount mismatch");
    }

    // Idempotent: do not process a completed payment again.
    if (payment.getStatus() == PaymentStatus.PAID) {
        return;
    }

    if (payment.getStatus() != PaymentStatus.PENDING) {
        throw new IllegalArgumentException(
                "Payment is not pending");
    }

    if (vnPayService.isSuccessful(params)) {
        payment.setStatus(PaymentStatus.PAID);
        payment.setTransactionId(params.get("vnp_TransactionNo"));
        payment.setPaidAt(ZonedDateTime.now());
    } else {
        payment.setStatus(PaymentStatus.FAILED);
    }

    paymentRepository.saveAndFlush(payment);
}

@Transactional(readOnly = true)
public String createMomoPaymentUrl(UUID paymentId, UUID payerId) {
    Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Payment not found"));

    if (!payment.getPayer().getId().equals(payerId)) {
        throw new IllegalArgumentException(
                "You are not the payer of this payment");
    }

    if (payment.getPaymentMethod() != PaymentMethod.MOMO) {
        throw new IllegalArgumentException(
                "Payment method must be MOMO");
    }

    if (payment.getStatus() != PaymentStatus.PENDING) {
        throw new IllegalArgumentException(
                "Only PENDING payments can be processed");
    }

    return momoService.createPaymentUrl(payment);
}

@Transactional
public void processMomoIpn(Map<String, Object> params) {
    if (!momoService.verifyIpnSignature(params)) {
        throw new IllegalArgumentException("Invalid MoMo IPN signature");
    }

    UUID paymentId;
    try {
        paymentId = UUID.fromString(momoService.getOrderId(params));
    } catch (Exception ex) {
        throw new IllegalArgumentException("Invalid MoMo order ID");
    }

    Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Payment not found"));

    if (payment.getPaymentMethod() != PaymentMethod.MOMO) {
        throw new IllegalArgumentException("Payment method mismatch");
    }

    if (!momoService.amountMatches(payment, params)) {
        throw new IllegalArgumentException("MoMo amount mismatch");
    }

    // Repeated notifications must not process an already-paid payment again.
    if (payment.getStatus() == PaymentStatus.PAID) {
        return;
    }

    if (payment.getStatus() != PaymentStatus.PENDING) {
        return;
    }

    if (momoService.isSuccessful(params)) {
        payment.setStatus(PaymentStatus.PAID);
        payment.setTransactionId(momoService.getTransactionId(params));
        payment.setPaidAt(ZonedDateTime.now());
    } else {
        payment.setStatus(PaymentStatus.FAILED);
    }

    paymentRepository.saveAndFlush(payment);
}




}