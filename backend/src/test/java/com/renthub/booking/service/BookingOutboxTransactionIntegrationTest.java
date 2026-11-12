package com.renthub.booking.service;

import com.renthub.booking.entity.Booking;
import com.renthub.booking.enums.BookingStatus;
import com.renthub.booking.repository.BookingRepository;
import com.renthub.equipment.entity.Equipment;
import com.renthub.equipment.repository.EquipmentRepository;
import com.renthub.outbox.entity.OutboxEvent;
import com.renthub.outbox.repository.OutboxEventRepository;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BookingOutboxTransactionIntegrationTest {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    void approveBooking_shouldRollbackBookingAndOutboxTogether() {
        String unique = UUID.randomUUID().toString();

        User owner = createUser("owner-" + unique + "@example.com");
        User renter = createUser("renter-" + unique + "@example.com");

        Equipment equipment = new Equipment();
        equipment.setOwner(owner);
        equipment.setTitle("Outbox rollback test " + unique);
        equipment.setPricePerDay(new BigDecimal("100000"));
        equipment.setStatus("AVAILABLE");
        equipment = equipmentRepository.saveAndFlush(equipment);

        Booking booking = new Booking();
        booking.setEquipment(equipment);
        booking.setRenter(renter);
        booking.setStartDate(LocalDate.now().plusDays(30));
        booking.setEndDate(LocalDate.now().plusDays(32));
        booking.setTotalDays(2);
        booking.setPricePerDay(new BigDecimal("100000"));
        booking.setTotalAmount(new BigDecimal("200000"));
        booking.setDepositAmount(BigDecimal.ZERO);
        booking.setStatus(BookingStatus.PENDING);
        booking = bookingRepository.saveAndFlush(booking);

        UUID bookingId = booking.getId();
        UUID equipmentId = equipment.getId();
        UUID ownerId = owner.getId();
        UUID renterId = renter.getId();

        TransactionTemplate transactionTemplate =
                new TransactionTemplate(transactionManager);

        try {
            assertThat(
                    bookingRepository.findById(bookingId)
                            .orElseThrow()
                            .getStatus()
            ).isEqualTo(BookingStatus.PENDING);

            transactionTemplate.executeWithoutResult(status -> {
                bookingService.approveBooking(bookingId, ownerId);

                assertThat(
                        bookingRepository.findById(bookingId)
                                .orElseThrow()
                                .getStatus()
                ).isEqualTo(BookingStatus.APPROVED);

                assertThat(
                        outboxEventRepository.findAll().stream()
                                .filter(event ->
                                        bookingId.equals(event.getAggregateId())
                                                && "BOOKING_APPROVED".equals(
                                                        event.getEventType()
                                                )
                                )
                ).isNotEmpty();

                status.setRollbackOnly();
            });

            assertThat(
                    bookingRepository.findById(bookingId)
                            .orElseThrow()
                            .getStatus()
            ).isEqualTo(BookingStatus.PENDING);

            assertThat(
                    outboxEventRepository.findAll().stream()
                            .filter(event ->
                                    bookingId.equals(event.getAggregateId())
                                            && "BOOKING_APPROVED".equals(
                                                    event.getEventType()
                                            )
                            )
            ).isEmpty();

        } finally {
            transactionTemplate.executeWithoutResult(status -> {
                outboxEventRepository.findAll().stream()
                        .filter(event ->
                                bookingId.equals(event.getAggregateId())
                        )
                        .map(OutboxEvent::getId)
                        .toList()
                        .forEach(outboxEventRepository::deleteById);

                bookingRepository.deleteById(bookingId);
                equipmentRepository.deleteById(equipmentId);
                userRepository.deleteById(renterId);
                userRepository.deleteById(ownerId);
            });
        }
    }

    private User createUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPassword("test-password");
        user.setFirstName("Outbox");
        user.setLastName("Test");
        user.setStatus("ACTIVE");

        return userRepository.saveAndFlush(user);
    }
}