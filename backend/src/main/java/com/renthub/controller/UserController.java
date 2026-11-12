package com.renthub.controller;

import com.renthub.payload.request.UpdateProfileRequest;
//import com.renthub.payload.response.MessageResponse;
import com.renthub.payload.response.UserProfileResponse;
import com.renthub.security.services.UserDetailsImpl;
import com.renthub.user.entity.Role;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import java.util.List;
import java.util.stream.Collectors;
import jakarta.validation.Valid; 
import com.renthub.payload.response.ApiResponse;
import com.renthub.exception.ErrorResponse;


@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    // API Lấy thông tin cá nhân dựa vào JWT Token hiện tại
    
@GetMapping("/me")
public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUserProfile(
        @AuthenticationPrincipal UserDetailsImpl userDetails) {

    User user = userRepository.findById(userDetails.getId())
            .orElseThrow(() -> new RuntimeException("Error: User not found."));

    UserProfileResponse response = new UserProfileResponse(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getPhoneNumber(),
            user.getStatus(),
            user.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.toSet())
    );

    return ResponseEntity.ok(
            ApiResponse.success("Profile retrieved successfully.", response)
    );
}


    // API Cập nhật thông tin cá nhân
    
@PutMapping("/me")
public ResponseEntity<?> updateProfile(
        @AuthenticationPrincipal UserDetailsImpl userDetails,
        @Valid @RequestBody UpdateProfileRequest request) {

    User user = userRepository.findById(userDetails.getId())
            .orElseThrow(() -> new RuntimeException("Error: User not found."));

    if (request.getFirstName() != null) {
        user.setFirstName(request.getFirstName());
    }

    if (request.getLastName() != null) {
        user.setLastName(request.getLastName());
    }

    if (request.getEmail() != null) {
        String requestedEmail = request.getEmail().trim();

        if (!requestedEmail.equalsIgnoreCase(user.getEmail())) {
            Optional<User> existingUser =
                    userRepository.findByEmail(requestedEmail);

            if (existingUser.isPresent()
                    && !existingUser.get().getId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ErrorResponse("Email is already in use."));
            }

            user.setEmail(requestedEmail);
        }
    }

    
if (request.getPhoneNumber() != null) {
    String requestedPhoneNumber = request.getPhoneNumber().trim();

    if (!requestedPhoneNumber.equals(user.getPhoneNumber())) {
        Optional<User> existingPhoneUser =
                userRepository.findByPhoneNumber(requestedPhoneNumber);

        if (existingPhoneUser.isPresent()
                && !existingPhoneUser.get().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(
                            "Phone number is already in use."
                    ));
        }

        user.setPhoneNumber(requestedPhoneNumber);
    }
}


    userRepository.save(user);

    return ResponseEntity.ok(
            ApiResponse.success("Profile updated successfully.")
    );
}


    // ==========================================
    // BỔ SUNG: API dành cho Admin lấy danh sách user
    // ==========================================
    @GetMapping("/admin/all")
   public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllUsersForAdmin() {
        List<UserProfileResponse> users = userRepository.findAll().stream()
                .filter(user -> !user.getEmail().equalsIgnoreCase("admin@renthub.com"))
                .map(user -> new UserProfileResponse(
                        user.getId(),
                        user.getEmail(),
                        user.getFirstName(),
                        user.getLastName(),
                        user.getPhoneNumber(),
                        user.getStatus(),
                        user.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(
        ApiResponse.success("Users retrieved successfully.", users)
);
    }
}