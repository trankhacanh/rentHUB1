package com.renthub.controller;

import com.renthub.equipment.entity.Category;
import com.renthub.equipment.entity.Equipment;
import com.renthub.equipment.entity.EquipmentImage;
import com.renthub.equipment.repository.CategoryRepository;
import com.renthub.equipment.repository.EquipmentImageRepository;
import com.renthub.equipment.repository.EquipmentRepository;
import com.renthub.payload.request.CategoryRequest;
import com.renthub.payload.request.CreateEquipmentRequest;
import com.renthub.payload.response.EquipmentResponse;
import com.renthub.payload.response.MessageResponse;
import com.renthub.security.services.UserDetailsImpl;
import com.renthub.service.S3StorageService;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.renthub.payload.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
//import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import com.renthub.service.EquipmentResponseMapper;
import com.renthub.service.AvailableEquipmentCacheService;
import org.springframework.cache.annotation.CacheEvict;


@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/equipments")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentRepository equipmentRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final EquipmentImageRepository equipmentImageRepository;
    private final S3StorageService s3StorageService;
    private final EquipmentResponseMapper equipmentResponseMapper;
    private final AvailableEquipmentCacheService availableEquipmentCacheService;


    // Helper map sang Response DTO
/*     private EquipmentResponse mapToResponse(Equipment equipment) {
        List<String> imageUrls = equipmentImageRepository.findByEquipmentIdOrderBySortOrderAsc(equipment.getId())
                .stream()
                .map(EquipmentImage::getImageUrl)
                .collect(Collectors.toList());

        String coverImageUrl = imageUrls.isEmpty() ? null : imageUrls.get(0);

        return new EquipmentResponse(
                equipment.getId(),
                equipment.getTitle(),
                equipment.getDescription(),
                equipment.getPricePerDay(),
                equipment.getDepositAmount(),
                equipment.getStatus(),
                equipment.getAddress(),
                equipment.getCategory() != null ? equipment.getCategory().getName() : null,
                equipment.getOwner() != null ? equipment.getOwner().getId() : null,
                equipment.getOwner() != null ? equipment.getOwner().getFirstName() + " " + equipment.getOwner().getLastName() : null,
                equipment.getBrand(),
                equipment.getModel(),
                equipment.getCondition(),
                equipment.getYearPurchased(),
                equipment.getCity(),
                equipment.getDistrict(),
                equipment.getAvailability(),
                equipment.getAvailableFrom(),
                equipment.getAvailableUntil(),
                coverImageUrl,
                imageUrls
        );
    } */

    // 1. Lấy danh sách (Ai cũng xem được)

@GetMapping
public ResponseEntity<ApiResponse<List<EquipmentResponse>>>
        getAllAvailableEquipments() {

    List<EquipmentResponse> equipments =
            availableEquipmentCacheService.getAllAvailableEquipments();

    return ResponseEntity.ok(
            ApiResponse.success(
                    "Equipments retrieved successfully.",
                    equipments
            )
    );
}



@GetMapping("/admin")
public ResponseEntity<ApiResponse<List<EquipmentResponse>>> getAllEquipmentsForAdmin(
        Authentication authentication) {

    if (authentication == null
            || authentication.getAuthorities().stream()
                .noneMatch(authority ->
                    authority.getAuthority().equals("ROLE_ADMIN"))) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Admin access required."
        );
    }

    List<EquipmentResponse> equipments = equipmentRepository.findAll()
            .stream()
            .map(equipmentResponseMapper::mapToResponse)
            .collect(Collectors.toList());

    return ResponseEntity.ok(
            ApiResponse.success(
                    "All equipments retrieved successfully.",
                    equipments
            )
    );
}

    // 2. Lấy chi tiết

@GetMapping("/{id}")
public ResponseEntity<ApiResponse<EquipmentResponse>> getEquipmentById(
        @PathVariable UUID id
) {
    Equipment equipment = equipmentRepository.findById(id)
            .orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Equipment not found."
                    )
            );

    if (equipment.getStatus() == null
            || !"AVAILABLE".equalsIgnoreCase(equipment.getStatus())) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Equipment not found."
        );
    }

    return ResponseEntity.ok(
            ApiResponse.success(
                    "Equipment retrieved successfully.",
                    equipmentResponseMapper.mapToResponse(equipment)
            )
    );
}

        @CacheEvict(
        cacheNames = "availableEquipments",
        allEntries = true
)
    @PostMapping
    public ResponseEntity<?> createEquipment(@AuthenticationPrincipal UserDetailsImpl userDetails,
                                             @RequestParam(value = "title", required = false) String title,
                                             @RequestParam(value = "description", required = false) String description,
                                             @RequestParam(value = "pricePerDay", required = false) String pricePerDay,
                                             @RequestParam(value = "depositAmount", required = false, defaultValue = "0") String depositAmount,
                                             @RequestParam(value = "address", required = false) String address,
                                             @RequestParam(value = "categoryId", required = false) UUID categoryId,
                                             @RequestParam(value = "condition", required = false) String condition,
                                             @RequestParam(value = "brand", required = false) String brand,
                                             @RequestParam(value = "model", required = false) String model,
                                             @RequestParam(value = "serialNumber", required = false) String serialNumber,
                                             @RequestParam(value = "yearPurchased", required = false) Integer yearPurchased,
                                             @RequestParam(value = "city", required = false) String city,
                                             @RequestParam(value = "district", required = false) String district,
                                             @RequestParam(value = "weeklyDiscount", required = false, defaultValue = "0") String weeklyDiscount,
                                             @RequestParam(value = "monthlyDiscount", required = false, defaultValue = "0") String monthlyDiscount,
                                             @RequestParam(value = "availability", required = false, defaultValue = "Available") String availability,
                                             @RequestParam(value = "availableFrom", required = false) String availableFrom,
                                             @RequestParam(value = "availableUntil", required = false) String availableUntil,
                                             @RequestParam(value = "allowRequestBooking", required = false, defaultValue = "true") Boolean allowRequestBooking,
                                             @RequestParam(value = "rules", required = false) String rules,
                                             @RequestParam(value = "additionalRules", required = false) String additionalRules,
                                             @RequestParam(value = "files", required = false) MultipartFile[] files) {
    
if (userDetails == null) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(new MessageResponse(
                    "Authentication required."
            ));
}

if (title == null || title.isBlank()) {
    return ResponseEntity.badRequest()
            .body(new MessageResponse("Title is required."));
}

if (pricePerDay == null || pricePerDay.isBlank()) {
    return ResponseEntity.badRequest()
            .body(new MessageResponse("Price per day is required."));
}

java.math.BigDecimal parsedPricePerDay;
java.math.BigDecimal parsedDepositAmount;
java.math.BigDecimal parsedWeeklyDiscount;
java.math.BigDecimal parsedMonthlyDiscount;

try {
    parsedPricePerDay = new java.math.BigDecimal(pricePerDay.trim());
    parsedDepositAmount = new java.math.BigDecimal(depositAmount.trim());
    parsedWeeklyDiscount = new java.math.BigDecimal(weeklyDiscount.trim());
    parsedMonthlyDiscount = new java.math.BigDecimal(monthlyDiscount.trim());
} catch (NumberFormatException | NullPointerException ex) {
    System.err.println("Invalid monetary value detected:");
    System.err.println("pricePerDay = [" + pricePerDay + "]");
    System.err.println("depositAmount = [" + depositAmount + "]");
    System.err.println("weeklyDiscount = [" + weeklyDiscount + "]");
    System.err.println("monthlyDiscount = [" + monthlyDiscount + "]");
    ex.printStackTrace();

    return ResponseEntity.badRequest()
            .body(new MessageResponse("Invalid monetary value."));
}

if (parsedPricePerDay.signum() <= 0) {
    return ResponseEntity.badRequest()
            .body(new MessageResponse("Price per day must be greater than zero."));
}

if (parsedDepositAmount.signum() < 0
        || parsedWeeklyDiscount.signum() < 0
        || parsedMonthlyDiscount.signum() < 0) {
    return ResponseEntity.badRequest()
            .body(new MessageResponse("Deposit and discounts cannot be negative."));
}

        User owner = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Error: User not found."));

        Equipment equipment = new Equipment();
        equipment.setTitle(title);
        equipment.setDescription(description);
        equipment.setPricePerDay(parsedPricePerDay);
equipment.setDepositAmount(parsedDepositAmount);
        equipment.setAddress(address);
        equipment.setCondition(condition);
        equipment.setBrand(brand);
        equipment.setModel(model);
        equipment.setSerialNumber(serialNumber);
        equipment.setYearPurchased(yearPurchased);
        equipment.setCity(city);
        equipment.setDistrict(district);
       equipment.setWeeklyDiscount(parsedWeeklyDiscount);
equipment.setMonthlyDiscount(parsedMonthlyDiscount);
        equipment.setAvailability(availability);
        equipment.setAvailableFrom(availableFrom);
        equipment.setAvailableUntil(availableUntil);
        equipment.setAllowRequestBooking(allowRequestBooking);
        equipment.setRulesJson(rules);
        equipment.setAdditionalRules(additionalRules);
        equipment.setStatus("AVAILABLE");
        equipment.setOwner(owner);

       if (categoryId != null) {
    Category category = categoryRepository.findById(categoryId)
            .orElse(null);

    if (category == null) {
        return ResponseEntity.badRequest()
                .body(new MessageResponse("Category not found."));
    }

    equipment.setCategory(category);
}

        Equipment savedEquipment = equipmentRepository.save(equipment);

        if (files != null && files.length > 0) {
            try {
                List<String> uploadedImages = s3StorageService.uploadFiles(files);
                if (uploadedImages != null && !uploadedImages.isEmpty()) {
                    for (int i = 0; i < uploadedImages.size(); i++) {
                        EquipmentImage equipmentImage = new EquipmentImage();
                        equipmentImage.setEquipment(savedEquipment);
                        equipmentImage.setImageUrl(uploadedImages.get(i));
                        equipmentImage.setCover(i == 0);
                        equipmentImage.setSortOrder(i);
                        equipmentImageRepository.save(equipmentImage);
                    }
                }
            } catch (Exception e) {
                // Log error but don't fail the entire equipment creation
                System.err.println("Error uploading images: " + e.getMessage());
                e.printStackTrace();
            }
        }

        return ResponseEntity.ok(new MessageResponse("Equipment created successfully!"));
    }

    @CacheEvict(
        cacheNames = "availableEquipments",
        allEntries = true
)
@PutMapping("/{id}")
public ResponseEntity<?> updateEquipment(
        @PathVariable UUID id,
        @RequestBody CreateEquipmentRequest request,
        Authentication authentication) {

    Equipment equipment = equipmentRepository.findById(id)
            .orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Equipment not found."
                    ));

    // Lấy email của tài khoản đang đăng nhập
    String currentEmail = authentication.getName();

    // Chỉ chủ sở hữu mới được cập nhật thiết bị
    if (equipment.getOwner() == null
            || !equipment.getOwner().getEmail().equals(currentEmail)) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You are not allowed to update this equipment."
        );
    }

  if (request.getTitle() == null || request.getTitle().isBlank()) {
    return ResponseEntity.badRequest()
            .body(new MessageResponse("Title is required."));
}

if (request.getPricePerDay() == null) {
    return ResponseEntity.badRequest()
            .body(new MessageResponse("Price per day is required."));
}

if (request.getPricePerDay().signum() <= 0) {
    return ResponseEntity.badRequest()
            .body(new MessageResponse(
                    "Price per day must be greater than zero."
            ));
}

if (request.getDepositAmount() != null
        && request.getDepositAmount().signum() < 0) {
    return ResponseEntity.badRequest()
            .body(new MessageResponse(
                    "Deposit cannot be negative."
            ));
}

equipment.setTitle(request.getTitle().trim());
equipment.setDescription(request.getDescription());
equipment.setPricePerDay(request.getPricePerDay());
equipment.setDepositAmount(request.getDepositAmount());
equipment.setAddress(request.getAddress());

    if (request.getCategoryId() != null) {
        Category category = categoryRepository
                .findById(request.getCategoryId())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Category not found."
                        ));

        equipment.setCategory(category);
    }

    equipmentRepository.save(equipment);

    return ResponseEntity.ok(
            new MessageResponse("Equipment updated successfully!")
    );
}


   @CacheEvict(
        cacheNames = "availableEquipments",
        allEntries = true
)
@PutMapping("/admin/{id}")
public ResponseEntity<?> updateEquipmentForAdmin(
        @PathVariable UUID id,
        @RequestBody CreateEquipmentRequest request,
        Authentication authentication) {

    if (authentication == null
            || authentication.getAuthorities().stream()
                .noneMatch(authority ->
                    authority.getAuthority().equals("ROLE_ADMIN"))) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Admin access required."
        );
    }

    Equipment equipment = equipmentRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Equipment not found."
            ));

    if (request.getTitle() == null || request.getTitle().isBlank()) {
        return ResponseEntity.badRequest()
                .body(new MessageResponse("Title is required."));
    }

    if (request.getPricePerDay() == null
            || request.getPricePerDay().signum() <= 0) {
        return ResponseEntity.badRequest()
                .body(new MessageResponse(
                        "Price per day must be greater than zero."
                ));
    }

    if (request.getDepositAmount() != null
            && request.getDepositAmount().signum() < 0) {
        return ResponseEntity.badRequest()
                .body(new MessageResponse(
                        "Deposit cannot be negative."
                ));
    }

    if (request.getCategoryId() != null) {
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Category not found."
                ));

        equipment.setCategory(category);
    }

    equipment.setTitle(request.getTitle().trim());
    equipment.setDescription(request.getDescription());
    equipment.setPricePerDay(request.getPricePerDay());
    equipment.setDepositAmount(request.getDepositAmount());
    equipment.setAddress(request.getAddress());

    equipmentRepository.save(equipment);

    return ResponseEntity.ok(
            new MessageResponse("Equipment updated successfully!")
    );
}

@CacheEvict(
        cacheNames = "availableEquipments",
        allEntries = true
)
@DeleteMapping("/{id}")
public ResponseEntity<?> deleteEquipment(
        @PathVariable UUID id,
        Authentication authentication) {

    Equipment equipment = equipmentRepository.findById(id)
            .orElseThrow(() ->
                    new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Equipment not found."
                    ));

    // Chỉ chủ sở hữu mới được ngừng cho thuê thiết bị
    String currentEmail = authentication.getName();

    if (equipment.getOwner() == null
            || !equipment.getOwner().getEmail().equals(currentEmail)) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You are not allowed to deactivate this equipment."
        );
    }

    // Không xóa vật lý, giữ lại lịch sử và dữ liệu liên quan
    equipment.setStatus("INACTIVE");
    equipmentRepository.save(equipment);

    return ResponseEntity.ok(
            new MessageResponse(
                    "Equipment deactivated successfully!"
            )
    );
}



    // 5.1. Lấy toàn bộ equipment của user hiện tại
    

@GetMapping("/my-equipment")
public ResponseEntity<ApiResponse<List<EquipmentResponse>>> getMyEquipments(
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {
    if (userDetails == null) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiResponse<>(
                        false,
                        "Authentication required.",
                        null
                ));
    }

    List<EquipmentResponse> equipments =
            equipmentRepository.findByOwnerId(userDetails.getId())
                    .stream()
                    .map(equipmentResponseMapper::mapToResponse)
                    .collect(Collectors.toList());

    return ResponseEntity.ok(
            ApiResponse.success(
                    "Your equipments retrieved successfully.",
                    equipments
            )
    );
}



@ExceptionHandler(ResponseStatusException.class)
public ResponseEntity<MessageResponse> handleResponseStatusException(
        ResponseStatusException ex) {

    HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());

    return ResponseEntity.status(status)
            .body(new MessageResponse(
                    ex.getReason() != null
                            ? ex.getReason()
                            : "Request failed."
            ));
}

@ExceptionHandler(RuntimeException.class)
public ResponseEntity<MessageResponse> handleRuntimeException(
        RuntimeException ex) {

    return ResponseEntity.badRequest()
            .body(new MessageResponse(ex.getMessage()));
}

@ExceptionHandler(Exception.class)
public ResponseEntity<MessageResponse> handleException(Exception ex) {

    return ResponseEntity.badRequest()
            .body(new MessageResponse(
                    ex.getMessage() != null
                            ? ex.getMessage()
                            : "Failed to process request."
            ));
}

    // 6. Lấy danh mục
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }
        @CacheEvict(
        cacheNames = "availableEquipments",
        allEntries = true
)
    // 6.1. Tạo danh mục mới
    @PostMapping("/categories")
    public ResponseEntity<?> createCategory(@RequestBody CategoryRequest request) {
        if (request == null || request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Category name is required."));
        }

        String normalizedName = request.getName().trim();
        if (categoryRepository.findAll().stream().anyMatch(category -> category.getName().equalsIgnoreCase(normalizedName))) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Category already exists."));
        }

        Category category = new Category();
        category.setName(normalizedName);
        category.setDescription(request.getDescription());
        categoryRepository.save(category);

        return ResponseEntity.ok(new MessageResponse("Category created successfully!"));
    }
@CacheEvict(
        cacheNames = "availableEquipments",
        allEntries = true
)
    // 6.2. Cập nhật danh mục
    @PutMapping("/categories/{id}")
    public ResponseEntity<?> updateCategory(@PathVariable UUID id, @RequestBody CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error: Category not found."));

        if (request == null || request.getName() == null || request.getName().isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Category name is required."));
        }

        String normalizedName = request.getName().trim();
        boolean duplicateExists = categoryRepository.findAll().stream()
                .anyMatch(item -> !item.getId().equals(id) && item.getName().equalsIgnoreCase(normalizedName));
        if (duplicateExists) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Category already exists."));
        }

        category.setName(normalizedName);
        category.setDescription(request.getDescription());
        categoryRepository.save(category);

        return ResponseEntity.ok(new MessageResponse("Category updated successfully!"));
    }
@CacheEvict(
        cacheNames = "availableEquipments",
        allEntries = true
)

    // 6.3. Xóa danh mục
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable UUID id) {
        if (!categoryRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Category not found."));
        }

        categoryRepository.deleteById(id);
        return ResponseEntity.ok(new MessageResponse("Category deleted successfully!"));
    }

    
public static class UpdateEquipmentStatusRequest {
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
@CacheEvict(
        cacheNames = "availableEquipments",
        allEntries = true
)
@PatchMapping("/admin/{id}/status")
public ResponseEntity<?> updateEquipmentStatusForAdmin(
        @PathVariable UUID id,
        @RequestBody UpdateEquipmentStatusRequest request,
        Authentication authentication) {

    if (authentication == null
            || authentication.getAuthorities().stream()
                .noneMatch(authority ->
                    authority.getAuthority().equals("ROLE_ADMIN"))) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "Admin access required."
        );
    }

    if (request == null || request.getStatus() == null
            || !List.of("AVAILABLE", "RENTED", "INACTIVE")
                .contains(request.getStatus())) {
        return ResponseEntity.badRequest()
                .body(new MessageResponse("Invalid equipment status."));
    }

    Equipment equipment = equipmentRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Equipment not found."
            ));

    equipment.setStatus(request.getStatus());
    equipmentRepository.save(equipment);

    return ResponseEntity.ok(
            new MessageResponse("Equipment status updated successfully!")
    );
}



}