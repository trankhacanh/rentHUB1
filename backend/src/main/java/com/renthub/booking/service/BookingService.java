package com.renthub.booking.service;

import com.renthub.booking.dto.BookingResponse;
import com.renthub.booking.dto.CreateBookingRequest;
import com.renthub.booking.entity.Booking;
import com.renthub.booking.enums.BookingStatus;
import com.renthub.booking.repository.BookingRepository;
import com.renthub.equipment.entity.Equipment;
import com.renthub.equipment.repository.EquipmentRepository;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.renthub.booking.dto.RejectBookingRequest;

import com.renthub.notification.dto.BookingNotificationEvent;
import com.renthub.outbox.service.OutboxEventService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;
import com.renthub.equipment.entity.EquipmentImage;
import com.renthub.equipment.repository.EquipmentImageRepository;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;
  
        private final EquipmentImageRepository equipmentImageRepository;
        private final OutboxEventService outboxEventService;

    @Transactional
    public BookingResponse createBooking(
            CreateBookingRequest request,
            UUID renterId
    ) {

        // 1. Kiểm tra request
        if (request.getEquipmentId() == null) {
            throw new IllegalArgumentException("Equipment ID is required");
        }

        if (request.getStartDate() == null) {
            throw new IllegalArgumentException("Start date is required");
        }

        if (request.getEndDate() == null) {
            throw new IllegalArgumentException("End date is required");
        }

        // 2. Kiểm tra ngày thuê
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();

        if (!endDate.isAfter(startDate)) {
            throw new IllegalArgumentException(
                    "End date must be after start date"
            );
        }

        if (startDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Start date cannot be in the past"
            );
        }

        // 3. Lấy renter hiện tại
        User renter = userRepository.findById(renterId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Renter not found")
                );

        // 4. Lấy equipment
        Equipment equipment = equipmentRepository
        .findByIdForUpdate(request.getEquipmentId())
        .orElseThrow(() ->
                new IllegalArgumentException("Equipment not found")
        );

        // 5. Không cho owner tự thuê equipment của chính mình
        if (equipment.getOwner().getId().equals(renterId)) {
            throw new IllegalArgumentException(
                    "You cannot book your own equipment"
            );
        }

        // 6. Kiểm tra equipment có thể cho thuê
        if (equipment.getStatus() == null ||
                !"AVAILABLE".equalsIgnoreCase(equipment.getStatus())) {

            throw new IllegalArgumentException(
                    "Equipment is not available for booking"
            );
        }

        // 7. Kiểm tra booking bị trùng
        List<BookingStatus> blockingStatuses = List.of(
                BookingStatus.PENDING,
                BookingStatus.APPROVED,
                BookingStatus.IN_PROGRESS
        );

        List<Booking> conflicts =
                bookingRepository.findConflictingBookings(
                        equipment.getId(),
                        startDate,
                        endDate,
                        blockingStatuses
                );

        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException(
                    "Equipment is already booked for the selected dates"
            );
        }

        // 8. Tính số ngày thuê
        int totalDays = (int) ChronoUnit.DAYS.between(
                startDate,
                endDate
        );

       
 // 9. Lấy và kiểm tra giá thuê từ equipment
BigDecimal pricePerDay = equipment.getPricePerDay();

if (pricePerDay == null ||
        pricePerDay.compareTo(BigDecimal.ZERO) <= 0) {
    throw new IllegalArgumentException(
            "Equipment price must be greater than zero"
    );
}

// 10. Lấy và kiểm tra tiền cọc
BigDecimal depositAmount = equipment.getDepositAmount();

if (depositAmount != null &&
        depositAmount.compareTo(BigDecimal.ZERO) < 0) {
    throw new IllegalArgumentException(
            "Equipment deposit amount cannot be negative"
    );
}

// 11. Tính tổng tiền thuê, chưa bao gồm tiền cọc
BigDecimal totalAmount = pricePerDay.multiply(
        BigDecimal.valueOf(totalDays)
);

        // 11. Tạo booking
        Booking booking = new Booking();

        booking.setEquipment(equipment);
        booking.setRenter(renter);

        booking.setStartDate(startDate);
        booking.setEndDate(endDate);

        booking.setTotalDays(totalDays);

        // Snapshot giá tại thời điểm booking
        booking.setPricePerDay(pricePerDay);
        booking.setTotalAmount(totalAmount);

        // Lưu tiền cọc đã được kiểm tra
        booking.setDepositAmount(depositAmount);

        booking.setStatus(BookingStatus.PENDING);

        booking.setRenterNote(
                request.getRenterNote()
        );

        // 12. Lưu database và flush ngay
        Booking savedBooking =
                bookingRepository.saveAndFlush(booking);

        // 13. Trả response
        return toResponse(savedBooking);
    }

    // =========================================================
    // Lấy danh sách booking của người thuê hiện tại
    // =========================================================

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(UUID renterId) {

        List<Booking> bookings =
                bookingRepository.findByRenterIdOrderByCreatedAtDesc(
                        renterId
                );

        return bookings.stream()
                .map(this::toResponse)
                .toList();
    }
    @Transactional(readOnly = true)
public List<BookingResponse> getOwnerBookings(UUID ownerId) {

    List<Booking> bookings =
            bookingRepository.findByEquipmentOwnerIdOrderByCreatedAtDesc(
                    ownerId
            );

    return bookings.stream()
            .map(this::toResponse)
            .toList();
}
@Transactional
public BookingResponse approveBooking(
        UUID bookingId,
        UUID ownerId
) {

    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() ->
                new IllegalArgumentException("Booking not found")
        );

Equipment equipment = equipmentRepository
        .findByIdForUpdate(booking.getEquipment().getId())
        .orElseThrow(() ->
                new IllegalArgumentException("Equipment not found")
        );

    booking = bookingRepository.findByIdForUpdate(bookingId)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

    // 2. Kiểm tra người đang thao tác có phải Owner của equipment không
    if (!booking.getEquipment().getOwner().getId().equals(ownerId)) {
        throw new IllegalArgumentException(
                "You are not the owner of this equipment"
        );
    }

    // 3. Chỉ PENDING mới được approve
    if (booking.getStatus() != BookingStatus.PENDING) {
        throw new IllegalArgumentException(
                "Only PENDING bookings can be approved"
        );
    }

    // 4. Kiểm tra lại ngày thuê có bị trùng không
    List<BookingStatus> blockingStatuses = List.of(
            BookingStatus.PENDING,
            BookingStatus.APPROVED,
            BookingStatus.IN_PROGRESS
    );

    List<Booking> conflicts =
            bookingRepository.findConflictingBookings(
                    booking.getEquipment().getId(),
                    booking.getStartDate(),
                    booking.getEndDate(),
                    blockingStatuses
            );

    // Loại chính booking hiện tại khỏi danh sách conflict
    boolean hasConflict = conflicts.stream()
            .anyMatch(conflict ->
                    !conflict.getId().equals(bookingId)
            );

    if (hasConflict) {
        throw new IllegalArgumentException(
                "Equipment is already booked for the selected dates"
        );
    }

    // 5. APPROVE
    booking.setStatus(BookingStatus.APPROVED);

   // 6. Lưu database
Booking savedBooking =
        bookingRepository.saveAndFlush(booking);


// 7. Ghi sự kiện notification vào Outbox
outboxEventService.recordEvent(
        "BOOKING",
        booking.getId(),
        "BOOKING_APPROVED",
        new BookingNotificationEvent(
                booking.getRenter().getId(),
                "BOOKING_APPROVED",
                "Booking đã được chấp nhận",
                "Yêu cầu thuê thiết bị \"" +
                        booking.getEquipment().getTitle() +
                        "\" của bạn đã được chủ thiết bị chấp nhận.",
                booking.getId(),
                "BOOKING"
        )
);

// 8. Trả response
return toResponse(savedBooking);
}

@Transactional
public BookingResponse rejectBooking(
        UUID bookingId,
        UUID ownerId,
        RejectBookingRequest request
) {

    // 1. Tìm booking
    Booking booking = bookingRepository.findByIdForUpdate(bookingId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Booking not found")
            );

    // 2. Kiểm tra người thao tác có phải Owner của equipment không
    if (!booking.getEquipment().getOwner().getId().equals(ownerId)) {
        throw new IllegalArgumentException(
                "You are not the owner of this equipment"
        );
    }

    // 3. Chỉ PENDING mới được reject
    if (booking.getStatus() != BookingStatus.PENDING) {
        throw new IllegalArgumentException(
                "Only PENDING bookings can be rejected"
        );
    }

    // 4. Kiểm tra lý do từ chối
    if (request == null ||
            request.getRejectionReason() == null ||
            request.getRejectionReason().isBlank()) {

        throw new IllegalArgumentException(
                "Rejection reason is required"
        );
    }

    // 5. Chuyển trạng thái sang REJECTED
    booking.setStatus(BookingStatus.REJECTED);

    // 6. Lưu lý do từ chối
    booking.setRejectionReason(
            request.getRejectionReason().trim()
    );

   // 7. Lưu database
Booking savedBooking =
        bookingRepository.saveAndFlush(booking);

// 8. Ghi sự kiện notification vào Outbox
outboxEventService.recordEvent(
        "BOOKING",
        booking.getId(),
        "BOOKING_REJECTED",
        new BookingNotificationEvent(
                booking.getRenter().getId(),
                "BOOKING_REJECTED",
                "Booking đã bị từ chối",
                "Yêu cầu thuê thiết bị \"" +
                        booking.getEquipment().getTitle() +
                        "\" của bạn đã bị từ chối. Lý do: " +
                        booking.getRejectionReason(),
                booking.getId(),
                "BOOKING"
        )
);

// 9. Trả response
return toResponse(savedBooking);
}

@Transactional
public BookingResponse cancelBooking(
        UUID bookingId,
        UUID renterId
) {

    // 1. Tìm booking
    Booking booking = bookingRepository.findByIdForUpdate(bookingId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Booking not found")
            );

    // 2. Kiểm tra người đang thao tác có phải Renter của booking không
    if (!booking.getRenter().getId().equals(renterId)) {
        throw new IllegalArgumentException(
                "You are not the renter of this booking"
        );
    }

    // 3. Chỉ PENDING hoặc APPROVED mới được cancel
    if (booking.getStatus() != BookingStatus.PENDING &&
            booking.getStatus() != BookingStatus.APPROVED) {

        throw new IllegalArgumentException(
                "Only PENDING or APPROVED bookings can be cancelled"
        );
    }

    // 4. Chuyển trạng thái
    booking.setStatus(BookingStatus.CANCELLED);

    // 5. Lưu database
    Booking savedBooking =
            bookingRepository.saveAndFlush(booking);

// 6. Ghi sự kiện notification vào Outbox
outboxEventService.recordEvent(
        "BOOKING",
        booking.getId(),
        "BOOKING_CANCELLED",
        new BookingNotificationEvent(
                booking.getEquipment().getOwner().getId(),
                "BOOKING_CANCELLED",
                "Booking đã bị hủy",
                "Yêu cầu thuê thiết bị \"" +
                        booking.getEquipment().getTitle() +
                        "\" đã bị người thuê hủy.",
                booking.getId(),
                "BOOKING"
        )
);

    // 7. Trả response
    return toResponse(savedBooking);
}

@Transactional
public BookingResponse startBooking(
        UUID bookingId,
        UUID ownerId
) {

    Booking booking = bookingRepository.findByIdForUpdate(bookingId)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Booking not found"
                    )
            );

    if (!booking.getEquipment()
            .getOwner()
            .getId()
            .equals(ownerId)) {

        throw new IllegalArgumentException(
                "You are not the owner of this booking"
        );
    }

    if (booking.getStatus() != BookingStatus.APPROVED) {
        throw new IllegalArgumentException(
                "Only APPROVED bookings can be started"
        );
    }

    booking.setStatus(
            BookingStatus.IN_PROGRESS
    );

    Booking savedBooking =
            bookingRepository.saveAndFlush(booking);
// Ghi sự kiện notification vào Outbox
outboxEventService.recordEvent(
        "BOOKING",
        booking.getId(),
        "BOOKING_IN_PROGRESS",
        new BookingNotificationEvent(
                booking.getRenter().getId(),
                "BOOKING_IN_PROGRESS",
                "Booking đang được thực hiện",
                "Yêu cầu thuê thiết bị \"" +
                        booking.getEquipment().getTitle() +
                        "\" của bạn đã bắt đầu.",
                booking.getId(),
                "BOOKING"
        )
);

    return toResponse(savedBooking);
}
@Transactional
public BookingResponse completeBooking(
        UUID bookingId,
        UUID ownerId
) {

    Booking booking = bookingRepository.findByIdForUpdate(bookingId)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Booking not found"
                    )
            );

    if (!booking.getEquipment()
            .getOwner()
            .getId()
            .equals(ownerId)) {

        throw new IllegalArgumentException(
                "You are not the owner of this booking"
        );
    }

    if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
        throw new IllegalArgumentException(
                "Only IN_PROGRESS bookings can be completed"
        );
    }

    booking.setStatus(
            BookingStatus.COMPLETED
    );

    Booking savedBooking =
            bookingRepository.saveAndFlush(booking);

    // Ghi sự kiện notification vào Outbox
outboxEventService.recordEvent(
        "BOOKING",
        booking.getId(),
        "BOOKING_COMPLETED",
        new BookingNotificationEvent(
                booking.getRenter().getId(),
                "BOOKING_COMPLETED",
                "Booking đã hoàn thành",
                "Yêu cầu thuê thiết bị \"" +
                        booking.getEquipment().getTitle() +
                        "\" của bạn đã hoàn thành.",
                booking.getId(),
                "BOOKING"
        )
);

    return toResponse(savedBooking);
}

@Transactional(readOnly = true)
public boolean checkAvailability(
        UUID equipmentId,
        LocalDate startDate,
        LocalDate endDate
) {

    // 1. Kiểm tra equipmentId
    if (equipmentId == null) {
        throw new IllegalArgumentException(
                "Equipment ID is required"
        );
    }

    // 2. Kiểm tra ngày
    if (startDate == null) {
        throw new IllegalArgumentException(
                "Start date is required"
        );
    }

    if (endDate == null) {
        throw new IllegalArgumentException(
                "End date is required"
        );
    }

    // 3. Kiểm tra khoảng ngày
    if (!endDate.isAfter(startDate)) {
        throw new IllegalArgumentException(
                "End date must be after start date"
        );
    }

    // 4. Không cho kiểm tra ngày trong quá khứ
    if (startDate.isBefore(LocalDate.now())) {
        throw new IllegalArgumentException(
                "Start date cannot be in the past"
        );
    }

    // 5. Kiểm tra equipment có tồn tại
    Equipment equipment = equipmentRepository
            .findById(equipmentId)
            .orElseThrow(() ->
                    new IllegalArgumentException(
                            "Equipment not found"
                    )
            );

    // 6. Kiểm tra equipment có AVAILABLE không
    if (equipment.getStatus() == null ||
            !"AVAILABLE".equalsIgnoreCase(
                    equipment.getStatus()
            )) {

        return false;
    }

    // 7. Những booking đang chiếm lịch
    List<BookingStatus> blockingStatuses = List.of(
            BookingStatus.PENDING,
            BookingStatus.APPROVED,
            BookingStatus.IN_PROGRESS
    );

    // 8. Tìm booking bị trùng
    List<Booking> conflicts =
            bookingRepository.findConflictingBookings(
                    equipmentId,
                    startDate,
                    endDate,
                    blockingStatuses
            );

    // 9. Không có conflict = còn trống
    return conflicts.isEmpty();
}


    // =========================================================
    // Convert Booking Entity → BookingResponse
    // =========================================================

    private BookingResponse toResponse(Booking booking) {

        BookingResponse response =
                new BookingResponse();

        response.setId(booking.getId());

        response.setEquipmentId(
                booking.getEquipment().getId()
        );

        response.setEquipmentTitle(
                booking.getEquipment().getTitle()
        );

        
        List<EquipmentImage> images =
                equipmentImageRepository.findByEquipmentIdOrderBySortOrderAsc(
                        booking.getEquipment().getId()
                );

        EquipmentImage selectedImage = images.stream()
                .filter(EquipmentImage::isCover)
                .findFirst()
                .orElse(images.isEmpty() ? null : images.get(0));

        response.setEquipmentImageUrl(
                selectedImage != null ? selectedImage.getImageUrl() : null
        );


        response.setRenterId(
                booking.getRenter().getId()
        );

        String renterName =
                ((booking.getRenter().getFirstName() != null
                        ? booking.getRenter().getFirstName()
                        : "")
                        + " "
                        + (booking.getRenter().getLastName() != null
                        ? booking.getRenter().getLastName()
                        : ""))
                        .trim();

        response.setRenterName(renterName);

        response.setStartDate(
                booking.getStartDate()
        );

        response.setEndDate(
                booking.getEndDate()
        );

        response.setTotalDays(
                booking.getTotalDays()
        );

        response.setPricePerDay(
                booking.getPricePerDay()
        );

        response.setTotalAmount(
                booking.getTotalAmount()
        );

        response.setDepositAmount(
                booking.getDepositAmount()
        );

        response.setStatus(
                booking.getStatus()
        );

        response.setRenterNote(
                booking.getRenterNote()
        );

        response.setRejectionReason(
                booking.getRejectionReason()
        );

        response.setCreatedAt(
                booking.getCreatedAt()
        );

        response.setUpdatedAt(
                booking.getUpdatedAt()
        );

        return response;
    }

    @Transactional(readOnly = true)
public List<LocalDate> getUnavailableDates(UUID equipmentId) {

    if (equipmentId == null) {
        throw new IllegalArgumentException("Equipment ID is required");
    }

    // Các trạng thái đang chiếm lịch
    List<BookingStatus> blockingStatuses = List.of(
            BookingStatus.PENDING,
            BookingStatus.APPROVED,
            BookingStatus.IN_PROGRESS
    );

    List<Booking> bookings =
        bookingRepository.findByEquipmentIdAndStatusInOrderByStartDateAsc(
                equipmentId,
                blockingStatuses
        );

    List<LocalDate> unavailableDates = new ArrayList<>();

    for (Booking booking : bookings) {

        // if (!blockingStatuses.contains(booking.getStatus())) {
        //     continue;
        // }

        LocalDate currentDate = booking.getStartDate();

        while (currentDate.isBefore(booking.getEndDate())) {
            unavailableDates.add(currentDate);          
            currentDate = currentDate.plusDays(1);
        }
    }

    return unavailableDates.stream()
            .distinct()
            .sorted()
            .toList();
}

@Transactional(readOnly = true)
public List<BookingResponse> getAllBookingsForAdmin() {
    return bookingRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(this::toResponse)
            .toList();
}

}
