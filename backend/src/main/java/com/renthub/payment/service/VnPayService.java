
package com.renthub.payment.service;

import com.renthub.payment.entity.Payment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class VnPayService {

    @Value("${renthub.payment.vnpay.pay-url}")
    private String payUrl;

    @Value("${renthub.payment.vnpay.tmn-code}")
    private String tmnCode;

    @Value("${renthub.payment.vnpay.hash-secret}")
    private String hashSecret;

    @Value("${renthub.payment.vnpay.return-url}")
    private String returnUrl;

    private static final ZoneId VIETNAM_ZONE =
            ZoneId.of("Asia/Ho_Chi_Minh");

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    public String createPaymentUrl(Payment payment, String ipAddress) {
        if (tmnCode == null || tmnCode.isBlank()
                || hashSecret == null || hashSecret.isBlank()) {
            throw new IllegalStateException(
                    "VNPay credentials are not configured"
            );
        }

        long amount;
        try {
            amount = payment.getTotalAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .longValueExact();
        } catch (ArithmeticException ex) {
            throw new IllegalArgumentException(
                    "VNPay amount must be a whole VND amount"
            );
        }

        ZonedDateTime now = ZonedDateTime.now(VIETNAM_ZONE);

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amount));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", payment.getId().toString());
        params.put("vnp_OrderInfo",
                "RentHub payment " + payment.getId());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", normalizeIp(ipAddress));
        params.put("vnp_CreateDate", now.format(DATE_FORMAT));

        String signingData = encodeParams(params);
        String signature = hmacSHA512(hashSecret, signingData);

        return payUrl + "?" + signingData
                + "&vnp_SecureHash=" + signature;
    }

    public boolean verifySignature(Map<String, String> received) {
        String suppliedHash = received.get("vnp_SecureHash");
        if (suppliedHash == null || suppliedHash.isBlank()
                || hashSecret == null || hashSecret.isBlank()) {
            return false;
        }

        Map<String, String> params = new TreeMap<>(received);
        params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        String expected = hmacSHA512(
                hashSecret, encodeParams(params));

        return MessageDigest.isEqual(
                expected.toLowerCase().getBytes(StandardCharsets.UTF_8),
                suppliedHash.toLowerCase().getBytes(StandardCharsets.UTF_8)
        );
    }

    public boolean isSuccessful(Map<String, String> params) {
        return "00".equals(params.get("vnp_ResponseCode"))
                && "00".equals(params.get("vnp_TransactionStatus"));
    }

    public boolean amountMatches(
            Payment payment, Map<String, String> params) {
        try {
            long returnedAmount = Long.parseLong(
                    params.get("vnp_Amount"));
            long expectedAmount = payment.getTotalAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .longValueExact();
            return returnedAmount == expectedAmount;
        } catch (Exception ex) {
            return false;
        }
    }

    private String encodeParams(Map<String, String> params) {
        return params.entrySet().stream()
                .map(entry -> urlEncode(entry.getKey()) + "="
                        + urlEncode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            hmac.init(new SecretKeySpec(
                    key.getBytes(StandardCharsets.UTF_8),
                    "HmacSHA512"));

            byte[] bytes = hmac.doFinal(
                    data.getBytes(StandardCharsets.UTF_8));

            StringBuilder hex = new StringBuilder();
            for (byte b : bytes) {
                hex.append(String.format("%02x", b & 0xff));
            }
            return hex.toString();
        } catch (Exception ex) {
            throw new IllegalStateException(
                    "Unable to sign VNPay request", ex);
        }
    }

    private String normalizeIp(String ip) {
        if (ip == null || ip.isBlank()
                || "unknown".equalsIgnoreCase(ip)) {
            return "127.0.0.1";
        }

        // VNPay expects a single IP, not a proxy chain.
        return ip.split(",")[0].trim();
    }
}
