package com.renthub.controller;

import com.renthub.equipment.entity.Equipment;
import com.renthub.equipment.repository.EquipmentRepository;
import com.renthub.payload.request.CreateRentalRequest;
import com.renthub.payload.response.MessageResponse;
import com.renthub.payload.response.RentalResponse;
import com.renthub.rental.entity.Rental;
import com.renthub.rental.repository.RentalRepository;
import com.renthub.security.services.UserDetailsImpl;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/rentals")
@RequiredArgsConstructor
public class RentalController {

    private final RentalRepository rentalRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;

    private RentalResponse mapToResponse(Rental rental) {
        return new RentalResponse(
                rental.getId(),
                rental.getEquipment().getId(),
                rental.getEquipment().getTitle(),
                rental.getRenter().getId(),
                rental.getRenter().getFirstName() + " " + rental.getRenter().getLastName(),
                rental.getEquipment().getOwner().getId(),
                rental.getStartDate(),
                rental.getEndDate(),
                rental.getTotalPrice(),
                rental.getDepositAmount(),
                rental.getStatus()
        );
    }

    // 1. Tạo đơn đặt thuê thiết bị mới
    @PostMapping
    public ResponseEntity<?> createRental(@AuthenticationPrincipal UserDetailsImpl userDetails,
                                          @RequestBody CreateRentalRequest request) {
        User renter = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        Equipment equipment = equipmentRepository.findById(request.getEquipmentId())
                .orElseThrow(() -> new RuntimeException("Error: Equipment not found."));

        // Kiểm tra xem user có tự thuê thiết bị của chính mình không
        if (equipment.getOwner().getId().equals(renter.getId())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: You cannot rent your own equipment!"));
        }

        // Tính số ngày thuê
        long days = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate());
        if (days <= 0) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: End date must be after start date!"));
        }

        BigDecimal totalPrice = equipment.getPricePerDay().multiply(BigDecimal.valueOf(days));

        Rental rental = new Rental();
        rental.setRenter(renter);
        rental.setEquipment(equipment);
        rental.setStartDate(request.getStartDate());
        rental.setEndDate(request.getEndDate());
        rental.setTotalPrice(totalPrice);
        rental.setDepositAmount(equipment.getDepositAmount() != null ? equipment.getDepositAmount() : BigDecimal.ZERO);
        rental.setStatus("PENDING");

        rentalRepository.save(rental);

        return ResponseEntity.ok(new MessageResponse("Rental request created successfully!"));
    }

    // 2. Xem danh sách đơn thuê của cá nhân (Các đơn mình đi thuê)
    @GetMapping("/my-rentals")
    public ResponseEntity<List<RentalResponse>> getMyRentals(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<RentalResponse> rentals = rentalRepository.findByRenterId(userDetails.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(rentals);
    }

    // 3. Xem danh sách đơn đặt hàng gửi tới thiết bị của tôi (Dành cho chủ thiết bị quản lý)
    @GetMapping("/owner-requests")
    public ResponseEntity<List<RentalResponse>> getOwnerRequests(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<RentalResponse> rentals = rentalRepository.findByEquipmentOwnerId(userDetails.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(rentals);
    }

    // 4. Chủ thiết bị duyệt hoặc từ chối đơn (status: APPROVED / REJECTED)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateRentalStatus(@AuthenticationPrincipal UserDetailsImpl userDetails,
                                                @PathVariable UUID id,
                                                @RequestParam String status) {
        Rental rental = rentalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Rental request not found."));

        // Kiểm tra xem user hiện tại có phải là chủ thiết bị đó không
        if (!rental.getEquipment().getOwner().getId().equals(userDetails.getId())) {
            return ResponseEntity.status(403).body(new MessageResponse("Error: You are not authorized to update this rental!"));
        }

        rental.setStatus(status.toUpperCase());
        rentalRepository.save(rental);

        return ResponseEntity.ok(new MessageResponse("Rental status updated to " + rental.getStatus() + "!"));
    }
}