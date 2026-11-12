package com.renthub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async("taskExecutor")
    public void sendOtpEmail(String email, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Mã xác thực khôi phục mật khẩu - RentHub");
            message.setText(
                "Mã OTP khôi phục mật khẩu của bạn là: " + otp + "\n" +
                "Mã này có hiệu lực trong vòng 10 phút.\n\n" +
                "Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email này."
            );
            mailSender.send(message);
        } catch (Exception e) {
            // Log trong production, không làm fail API chính
            System.err.println("Failed to send OTP email to " + email + ": " + e.getMessage());
        }
    }
}
