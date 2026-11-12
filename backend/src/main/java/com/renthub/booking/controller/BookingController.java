package com.renthub.booking.controller;

import com.renthub.booking.dto.BookingResponse;
import com.renthub.booking.dto.CreateBookingRequest;
import com.renthub.booking.service.BookingService;
import com.renthub.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.renthub.booking.dto.RejectBookingRequest;
import com.renthub.booking.dto.AvailabilityResponse;
import com.renthub.booking.dto.UnavailableDatesResponse;
import java.time.LocalDate;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @RequestBody CreateBookingRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        BookingResponse response =
                bookingService.createBooking(
                        request,
                        userDetails.getId()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        List<BookingResponse> bookings =
                bookingService.getMyBookings(
                        userDetails.getId()
                );

        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/owner")
public ResponseEntity<List<BookingResponse>> getOwnerBookings(
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    List<BookingResponse> bookings =
            bookingService.getOwnerBookings(
                    userDetails.getId()
            );

    return ResponseEntity.ok(bookings);
}
@PutMapping("/{bookingId}/approve")
public ResponseEntity<BookingResponse> approveBooking(
        @PathVariable UUID bookingId,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    BookingResponse response =
            bookingService.approveBooking(
                    bookingId,
                    userDetails.getId()
            );

    return ResponseEntity.ok(response);
}
@PutMapping("/{bookingId}/reject")
public ResponseEntity<BookingResponse> rejectBooking(
        @PathVariable UUID bookingId,
        @RequestBody RejectBookingRequest request,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    BookingResponse response =
            bookingService.rejectBooking(
                    bookingId,
                    userDetails.getId(),
                    request
            );

    return ResponseEntity.ok(response);
}
@PutMapping("/{bookingId}/cancel")
public ResponseEntity<BookingResponse> cancelBooking(
        @PathVariable UUID bookingId,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    BookingResponse response =
            bookingService.cancelBooking(
                    bookingId,
                    userDetails.getId()
            );

    return ResponseEntity.ok(response);
}
@PutMapping("/{bookingId}/start")
public ResponseEntity<BookingResponse> startBooking(
        @PathVariable UUID bookingId,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    BookingResponse response =
            bookingService.startBooking(
                    bookingId,
                    userDetails.getId()
            );

    return ResponseEntity.ok(response);
}
@PutMapping("/{bookingId}/complete")
public ResponseEntity<BookingResponse> completeBooking(
        @PathVariable UUID bookingId,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    BookingResponse response =
            bookingService.completeBooking(
                    bookingId,
                    userDetails.getId()
            );

    return ResponseEntity.ok(response);
}

@GetMapping("/availability")
public ResponseEntity<AvailabilityResponse> checkAvailability(
        @RequestParam UUID equipmentId,
        @RequestParam LocalDate startDate,
        @RequestParam LocalDate endDate
) {

    boolean available =
            bookingService.checkAvailability(
                    equipmentId,
                    startDate,
                    endDate
            );

    return ResponseEntity.ok(
            new AvailabilityResponse(available)
    );
}

@GetMapping("/unavailable-dates")
public ResponseEntity<UnavailableDatesResponse> getUnavailableDates(
        @RequestParam UUID equipmentId
) {
    List<LocalDate> dates =
            bookingService.getUnavailableDates(equipmentId);

    return ResponseEntity.ok(
            new UnavailableDatesResponse(dates)
    );
}

@GetMapping("/admin/all")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<BookingResponse>> getAllBookingsForAdmin() {
    return ResponseEntity.ok(
            bookingService.getAllBookingsForAdmin()
    );
}


}