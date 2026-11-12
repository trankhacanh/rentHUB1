package com.renthub.controller;

import com.renthub.payload.request.ChangePasswordRequest;
import com.renthub.payload.request.ForgotPasswordRequest;
import com.renthub.payload.request.LoginRequest;
import com.renthub.payload.request.ResetPasswordRequest;
import com.renthub.payload.request.SignupRequest;
import com.renthub.payload.response.JwtResponse;
//import com.renthub.payload.response.MessageResponse;
import com.renthub.security.jwt.JwtUtils;
import com.renthub.security.services.UserDetailsImpl;
import com.renthub.service.EmailService;
import com.renthub.user.entity.Role;
import com.renthub.user.entity.User;
import com.renthub.user.repository.RoleRepository;
import com.renthub.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.renthub.exception.ErrorResponse;
import org.springframework.http.HttpStatus;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
//import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;
import com.renthub.payload.response.ApiResponse;
import org.springframework.security.core.AuthenticationException;


@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;
        
    
@PostMapping("/signin")
public ResponseEntity<?> authenticateUser(
        @Valid @RequestBody LoginRequest loginRequest
) {
    Authentication authentication;

    try {
        authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );
    } catch (AuthenticationException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse(
                        "Invalid email or password."
                ));
    }

    SecurityContextHolder.getContext()
            .setAuthentication(authentication);

    String jwt = jwtUtils.generateToken(authentication);

    UserDetailsImpl userDetails =
            (UserDetailsImpl) authentication.getPrincipal();

    List<String> roles = userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList());

    JwtResponse jwtResponse = new JwtResponse(
            jwt,
            userDetails.getId(),
            userDetails.getEmail(),
            roles
    );

    return ResponseEntity.ok(
            ApiResponse.success("Login successful.", jwtResponse)
    );
}


    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
       if (userRepository.existsByEmail(signUpRequest.getEmail())) {
    return ResponseEntity
            .status(org.springframework.http.HttpStatus.CONFLICT)
            .body(new ErrorResponse("Email is already in use."));
}

        User user = new User();
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setFirstName(signUpRequest.getFirstName());
        user.setLastName(signUpRequest.getLastName());
        user.setPhoneNumber(signUpRequest.getPhoneNumber());

        Set<Role> roles = new HashSet<>();
        
        Role userRole = roleRepository.findById("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
        roles.add(userRole);

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok(
        ApiResponse.success("User registered successfully.")
);
    }
    @PostMapping("/signup-admin")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
    return ResponseEntity
            .status(HttpStatus.CONFLICT)
            .body(new ErrorResponse("Email is already in use."));
}
        User user = new User();
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setFirstName(signUpRequest.getFirstName());
        user.setLastName(signUpRequest.getLastName());
        user.setPhoneNumber(signUpRequest.getPhoneNumber());

        Set<Role> roles = new HashSet<>();
        
        // CHỈ LẤY VÀ GÁN QUYỀN ADMIN
        Role adminRole = roleRepository.findById("ROLE_ADMIN")
                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                
        roles.add(adminRole);

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok(
        ApiResponse.success("Admin registered successfully.")
);
    }

    // ==========================================
    // CHỨC NĂNG 1: ĐỔI MẬT KHẨU (Yêu cầu đăng nhập)
    // ==========================================
    
@PostMapping("/change-password")
public ResponseEntity<?> changePassword(
        @AuthenticationPrincipal UserDetailsImpl userDetails,
        @Valid @RequestBody ChangePasswordRequest request
) {
    if (userDetails == null) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Authentication required."));
    }

    User user = userRepository.findByEmail(userDetails.getEmail())
            .orElseThrow(() ->
                    new RuntimeException("User not found."));

    if (!encoder.matches(
            request.getOldPassword(),
            user.getPassword()
    )) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(
                        "Current password is incorrect."
                ));
    }

    if (encoder.matches(
            request.getNewPassword(),
            user.getPassword()
    )) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(
                        "New password must be different from the current password."
                ));
    }

    user.setPassword(encoder.encode(request.getNewPassword()));
    userRepository.save(user);

    return ResponseEntity.ok(
            ApiResponse.success("Password changed successfully.")
    );
}

    // ==========================================
    // CHỨC NĂNG 2: GỬI MÃ OTP QUÊN MẬT KHẨU QUA EMAIL
    // ==========================================
    private static final java.security.SecureRandom SECURE_RANDOM =
        new java.security.SecureRandom();

private String generateOtp() {
    return String.format(
        java.util.Locale.ROOT,
        "%06d",
        SECURE_RANDOM.nextInt(1_000_000)
    );
}

  
@PostMapping("/forgot-password")
public ResponseEntity<?> forgotPassword(
        @Valid @RequestBody ForgotPasswordRequest request
) {
    User user = userRepository.findByEmail(request.getEmail())
            .orElse(null);

    // Không tiết lộ email có tồn tại hay không.
    if (user == null) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "If the email exists, an OTP has been sent."
                )
        );
    }

    String otp = generateOtp();

    user.setResetToken(otp);
    user.setResetTokenExpiry(
            Instant.now().plus(10, ChronoUnit.MINUTES)
    );
    userRepository.save(user);

    emailService.sendOtpEmail(user.getEmail(), otp);

    return ResponseEntity.ok(
            ApiResponse.success(
                    "If the email exists, an OTP has been sent."
            )
    );
}


    // ==========================================
    // CHỨC NĂNG 3: XÁC THỰC OTP VÀ ĐẶT LẠI MẬT KHẨU
    // ==========================================
    
@PostMapping("/reset-password")
public ResponseEntity<?> resetPassword(
        @Valid @RequestBody ResetPasswordRequest request
) {
    User user = userRepository.findByEmail(request.getEmail())
            .orElse(null);

    if (user == null) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Invalid email or OTP."));
    }

    if (user.getResetToken() == null
            || !user.getResetToken().equals(request.getOtp())) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Invalid email or OTP."));
    }

    if (user.getResetTokenExpiry() == null
            || Instant.now().isAfter(user.getResetTokenExpiry())) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("OTP has expired."));
    }

    if (encoder.matches(
            request.getNewPassword(),
            user.getPassword())) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(
                        "New password must be different from the current password."
                ));
    }

    user.setPassword(encoder.encode(request.getNewPassword()));
    user.setResetToken(null);
    user.setResetTokenExpiry(null);
    userRepository.save(user);

    return ResponseEntity.ok(
            ApiResponse.success("Password reset successfully.")
    );
}

}