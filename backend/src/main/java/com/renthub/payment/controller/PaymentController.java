package com.renthub.payment.controller;

import com.renthub.payment.dto.CreatePaymentRequest;
import com.renthub.payment.dto.PaymentResponse;
import com.renthub.payment.service.PaymentService;
import com.renthub.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        PaymentResponse response =
                paymentService.createPayment(
                        request,
                        userDetails.getId()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @PutMapping("/{paymentId}/mock-pay")
    public ResponseEntity<PaymentResponse> processMockPayment(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        PaymentResponse response =
                paymentService.processMockPayment(
                        paymentId,
                        userDetails.getId()
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        PaymentResponse response =
                paymentService.getPaymentById(
                        paymentId,
                        userDetails.getId()
                );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<PaymentResponse>> getMyPayments(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        List<PaymentResponse> payments =
                paymentService.getMyPayments(
                        userDetails.getId()
                );

        return ResponseEntity.ok(payments);
    }

    
@PostMapping("/{paymentId}/vnpay-url")
public ResponseEntity<Map<String, String>> createVnPayUrl(
        @PathVariable UUID paymentId,
        @AuthenticationPrincipal UserDetailsImpl userDetails,
        HttpServletRequest request
) {
    String clientIp = request.getRemoteAddr();

    String paymentUrl = paymentService.createVnPayPaymentUrl(
            paymentId,
            userDetails.getId(),
            clientIp
    );

    return ResponseEntity.ok(Map.of(
            "paymentUrl", paymentUrl
    ));
}

@GetMapping("/vnpay/return")
public ResponseEntity<Map<String, String>> vnpayReturn(
        @RequestParam Map<String, String> params
) {
    paymentService.processVnPayReturn(params);

    return ResponseEntity.ok(Map.of(
            "message", "VNPay return processed"
    ));
}


@PostMapping("/{paymentId}/momo-url")
public ResponseEntity<Map<String, String>> createMomoUrl(
        @PathVariable UUID paymentId,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {
    String paymentUrl = paymentService.createMomoPaymentUrl(
            paymentId,
            userDetails.getId()
    );

    return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
}

@PostMapping("/momo/ipn")
public ResponseEntity<Map<String, String>> momoIpn(
        @RequestBody Map<String, Object> params
) {
    paymentService.processMomoIpn(params);

    return ResponseEntity.ok(Map.of("message", "MoMo IPN processed"));
}

@GetMapping("/admin/all")
public ResponseEntity<List<PaymentResponse>> getAllPaymentsForAdmin() {
    List<PaymentResponse> payments =
            paymentService.getAllPaymentsForAdmin();

    return ResponseEntity.ok(payments);
}


}