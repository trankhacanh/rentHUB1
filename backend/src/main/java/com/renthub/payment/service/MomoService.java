
package com.renthub.payment.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.renthub.payment.entity.Payment;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MomoService {

    private final ObjectMapper objectMapper;

    @Value("${renthub.payment.momo.api-url}")
    private String apiUrl;

    @Value("${renthub.payment.momo.partner-code}")
    private String partnerCode;

    @Value("${renthub.payment.momo.access-key}")
    private String accessKey;

    @Value("${renthub.payment.momo.secret-key}")
    private String secretKey;

    @Value("${renthub.payment.momo.redirect-url}")
    private String redirectUrl;

    @Value("${renthub.payment.momo.ipn-url}")
    private String ipnUrl;

    private final RestClient restClient = RestClient.create();

    public String createPaymentUrl(Payment payment) {
        requireCredentials();

        if (ipnUrl == null || ipnUrl.isBlank()
                || !ipnUrl.startsWith("https://")) {
            throw new IllegalStateException(
                    "A public HTTPS MoMo IPN URL must be configured"
            );
        }

        long amount = toVnd(payment.getTotalAmount());

        // UUID is used as our unique order ID and payment correlation key.
        String orderId = payment.getId().toString();
        String requestId = UUID.randomUUID().toString();
        String orderInfo = "RentHub payment " + orderId;
        String extraData = "";
        String requestType = "captureWallet";

        String rawSignature =
                "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + requestType;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("partnerCode", partnerCode);
        body.put("requestId", requestId);
        body.put("amount", amount);
        body.put("orderId", orderId);
        body.put("orderInfo", orderInfo);
        body.put("redirectUrl", redirectUrl);
        body.put("ipnUrl", ipnUrl);
        body.put("requestType", requestType);
        body.put("extraData", extraData);
        body.put("lang", "vi");
        body.put("signature", hmacSha256(rawSignature));

        Map<String, Object> response;
        try {
            response = restClient.post()
                    .uri(apiUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(new org.springframework.core.ParameterizedTypeReference<>() {});
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Unable to create MoMo payment request", ex
            );
        }

        if (response == null) {
            throw new IllegalStateException(
                    "Empty response from MoMo"
            );
        }

        String responseSignature = stringValue(response.get("signature"));
        String responseRaw =
                "accessKey=" + accessKey
                + "&amount=" + stringValue(response.get("amount"))
                + "&message=" + stringValue(response.get("message"))
                + "&orderId=" + stringValue(response.get("orderId"))
                + "&partnerCode=" + stringValue(response.get("partnerCode"))
                + "&payUrl=" + stringValue(response.get("payUrl"))
                + "&requestId=" + stringValue(response.get("requestId"))
                + "&responseTime=" + stringValue(response.get("responseTime"))
                + "&resultCode=" + stringValue(response.get("resultCode"));

        if (!constantTimeEquals(
                hmacSha256(responseRaw), responseSignature)) {
            throw new IllegalStateException(
                    "Invalid signature in MoMo create response"
            );
        }

        if (!"0".equals(stringValue(response.get("resultCode")))) {
            throw new IllegalStateException(
                    "MoMo rejected payment creation: "
                            + stringValue(response.get("message"))
            );
        }

        String payUrl = stringValue(response.get("payUrl"));
        if (payUrl.isBlank()) {
            throw new IllegalStateException(
                    "MoMo did not return a payment URL"
            );
        }

        return payUrl;
    }

    public boolean verifyIpnSignature(Map<String, Object> params) {
        if (params == null || params.get("signature") == null) {
            return false;
        }

        String raw =
                "accessKey=" + accessKey
                + "&amount=" + stringValue(params.get("amount"))
                + "&extraData=" + stringValue(params.get("extraData"))
                + "&message=" + stringValue(params.get("message"))
                + "&orderId=" + stringValue(params.get("orderId"))
                + "&orderInfo=" + stringValue(params.get("orderInfo"))
                + "&orderType=" + stringValue(params.get("orderType"))
                + "&partnerCode=" + stringValue(params.get("partnerCode"))
                + "&payType=" + stringValue(params.get("payType"))
                + "&requestId=" + stringValue(params.get("requestId"))
                + "&responseTime=" + stringValue(params.get("responseTime"))
                + "&resultCode=" + stringValue(params.get("resultCode"))
                + "&transId=" + stringValue(params.get("transId"));

        return constantTimeEquals(
                hmacSha256(raw),
                stringValue(params.get("signature"))
        );
    }

    public boolean amountMatches(
            Payment payment, Map<String, Object> params) {
        try {
            long receivedAmount = Long.parseLong(
                    stringValue(params.get("amount")));
            return receivedAmount == toVnd(payment.getTotalAmount());
        } catch (Exception ex) {
            return false;
        }
    }

    public boolean isSuccessful(Map<String, Object> params) {
        return "0".equals(stringValue(params.get("resultCode")));
    }

    public String getOrderId(Map<String, Object> params) {
        return stringValue(params.get("orderId"));
    }

    public String getTransactionId(Map<String, Object> params) {
        return stringValue(params.get("transId"));
    }

    private long toVnd(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException(
                    "Payment amount must be greater than zero");
        }
        try {
            return amount.longValueExact();
        } catch (ArithmeticException ex) {
            throw new IllegalArgumentException(
                    "Payment amount must be a whole VND amount", ex);
        }
    }

    private void requireCredentials() {
        if (isBlank(partnerCode) || isBlank(accessKey)
                || isBlank(secretKey)) {
            throw new IllegalStateException(
                    "MoMo credentials are not configured");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String hmacSha256(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                    secretKey.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"));

            byte[] bytes = mac.doFinal(
                    data.getBytes(StandardCharsets.UTF_8));

            StringBuilder result = new StringBuilder();
            for (byte b : bytes) {
                result.append(String.format("%02x", b & 0xff));
            }
            return result.toString();
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Unable to sign MoMo request", ex);
        }
    }

    private boolean constantTimeEquals(String expected, String actual) {
        if (expected == null || actual == null || actual.isBlank()) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.US_ASCII),
                actual.toLowerCase().getBytes(StandardCharsets.US_ASCII)
        );
    }
}
