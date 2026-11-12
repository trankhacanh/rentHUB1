
package com.renthub.contract.service;

import com.renthub.booking.entity.Booking;
import com.renthub.booking.enums.BookingStatus;
import com.renthub.booking.repository.BookingRepository;
import com.renthub.contract.entity.Contract;
import com.renthub.contract.entity.ContractVersion;
import com.renthub.contract.enums.ContractStatus;
import com.renthub.contract.repository.ContractRepository;
import com.renthub.contract.repository.ContractVersionRepository;
import com.renthub.equipment.entity.Equipment;
import com.renthub.outbox.service.OutboxEventService;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ContractServiceTest {

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ContractVersionRepository contractVersionRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OutboxEventService outboxEventService;

    @InjectMocks
    private ContractService contractService;

    private UUID bookingId;
    private UUID ownerId;
    private UUID renterId;

    private User owner;
    private User renter;

    private Equipment equipment;
    private Booking booking;

    @BeforeEach
    void setUp() {
        bookingId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
        renterId = UUID.randomUUID();

        owner = new User();
        owner.setId(ownerId);
        owner.setEmail("owner@example.com");
        owner.setFirstName("Khắc");
        owner.setLastName("Anh");

        renter = new User();
        renter.setId(renterId);
        renter.setEmail("renter@example.com");
        renter.setFirstName("Minh");
        renter.setLastName("Nguyễn");

        equipment = new Equipment();
        equipment.setId(UUID.randomUUID());
        equipment.setOwner(owner);
        equipment.setTitle("Canon EOS R6");
        equipment.setPricePerDay(new BigDecimal("200000"));

        booking = new Booking();
        booking.setId(bookingId);
        booking.setEquipment(equipment);
        booking.setRenter(renter);

        booking.setStartDate(LocalDate.of(2026, 11, 5));
        booking.setEndDate(LocalDate.of(2026, 11, 7));
        booking.setTotalDays(2);

        booking.setPricePerDay(new BigDecimal("200000"));
        booking.setTotalAmount(new BigDecimal("400000"));
        booking.setDepositAmount(new BigDecimal("100000"));

        booking.setStatus(BookingStatus.APPROVED);
    }

    private void stubValidCreation() {
        when(userRepository.findById(ownerId))
                .thenReturn(Optional.of(owner));

        when(bookingRepository.findById(bookingId))
                .thenReturn(Optional.of(booking));

        when(contractRepository.existsByBookingId(bookingId))
                .thenReturn(false);

        when(contractRepository.saveAndFlush(any(Contract.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        when(contractVersionRepository.saveAndFlush(
                any(ContractVersion.class)
        )).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void shouldCreateContractFromApprovedBooking() {
        stubValidCreation();

        Contract result = contractService.createContract(
                bookingId,
                ownerId
        );

        assertNotNull(result);

        assertEquals(bookingId, result.getBooking().getId());
        assertEquals(ownerId, result.getOwner().getId());
        assertEquals(renterId, result.getRenter().getId());

        assertEquals("Canon EOS R6", result.getEquipmentTitle());

        assertEquals(
                new BigDecimal("200000"),
                result.getPricePerDay()
        );

        assertEquals(
                new BigDecimal("400000"),
                result.getRentalAmount()
        );

        assertEquals(
                new BigDecimal("100000"),
                result.getDepositAmount()
        );

        assertEquals(
                new BigDecimal("500000"),
                result.getTotalAmount()
        );

        assertEquals(ContractStatus.DRAFT, result.getStatus());
        assertEquals(1, result.getCurrentVersion());

        verify(contractRepository).saveAndFlush(any(Contract.class));
        verify(contractVersionRepository)
                .saveAndFlush(any(ContractVersion.class));
    }

    @Test
    void shouldGenerateDefaultTermsWithAllEightSections() {
        stubValidCreation();

        Contract result = contractService.createContract(
                bookingId,
                ownerId
        );

        String terms = result.getTerms();

        assertNotNull(terms);

        assertTrue(terms.contains("Canon EOS R6"));

        for (int i = 1; i <= 8; i++) {
            assertTrue(
                    terms.contains("ĐIỀU " + i + "."),
                    "Default terms must contain section " + i
            );
        }

        assertTrue(terms.contains("ĐỐI TƯỢNG VÀ PHẠM VI THUÊ"));
        assertTrue(terms.contains("BÀN GIAO THIẾT BỊ"));
        assertTrue(terms.contains("THANH TOÁN"));
        assertTrue(terms.contains("TRÁCH NHIỆM CỦA BÊN THUÊ"));
        assertTrue(terms.contains("TRÁCH NHIỆM CỦA BÊN CHO THUÊ"));
        assertTrue(terms.contains("HƯ HỎNG VÀ HOÀN TRẢ"));
        assertTrue(terms.contains("VI PHẠM"));
        assertTrue(terms.contains("GIẢI QUYẾT TRANH CHẤP"));
    }

    @Test
    void shouldSaveInitialVersionWithSameTermsAsContract() {
        stubValidCreation();

        Contract result = contractService.createContract(
                bookingId,
                ownerId
        );

        ArgumentCaptor<ContractVersion> captor =
                ArgumentCaptor.forClass(ContractVersion.class);

        verify(contractVersionRepository)
                .saveAndFlush(captor.capture());

        ContractVersion snapshot = captor.getValue();

        assertNotNull(snapshot);

        assertSame(result, snapshot.getContract());

        assertEquals(1, snapshot.getVersionNumber());

        assertEquals(owner, snapshot.getCreatedBy());

        assertEquals(
                result.getEquipmentTitle(),
                snapshot.getEquipmentTitle()
        );

        assertEquals(
                result.getStartDate(),
                snapshot.getStartDate()
        );

        assertEquals(
                result.getEndDate(),
                snapshot.getEndDate()
        );

        assertEquals(
                result.getPricePerDay(),
                snapshot.getPricePerDay()
        );

        assertEquals(
                result.getRentalAmount(),
                snapshot.getRentalAmount()
        );

        assertEquals(
                result.getDepositAmount(),
                snapshot.getDepositAmount()
        );

        assertEquals(
                result.getTotalAmount(),
                snapshot.getTotalAmount()
        );

        assertEquals(
                result.getTerms(),
                snapshot.getTerms()
        );
    }

    @Test
    void shouldRejectBookingThatIsNotApproved() {
        booking.setStatus(BookingStatus.PENDING);

        when(userRepository.findById(ownerId))
                .thenReturn(Optional.of(owner));

        when(bookingRepository.findById(bookingId))
                .thenReturn(Optional.of(booking));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> contractService.createContract(bookingId, ownerId)
        );

        assertEquals(
                "Only APPROVED bookings can create a contract",
                exception.getMessage()
        );

        verify(contractRepository, never()).existsByBookingId(any());
        verify(contractRepository, never()).saveAndFlush(any(Contract.class));
        verify(contractVersionRepository, never())
                .saveAndFlush(any(ContractVersion.class));
    }

    @Test
    void shouldRejectUserWhoIsNotBookingOwner() {
        User anotherOwner = new User();
        anotherOwner.setId(UUID.randomUUID());

        equipment.setOwner(anotherOwner);

        when(userRepository.findById(ownerId))
                .thenReturn(Optional.of(owner));

        when(bookingRepository.findById(bookingId))
                .thenReturn(Optional.of(booking));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> contractService.createContract(bookingId, ownerId)
        );

        assertEquals(
                "You are not the owner of this booking",
                exception.getMessage()
        );

        verifyNoInteractions(contractRepository);
        verifyNoInteractions(contractVersionRepository);
    }

    @Test
    void shouldRejectDuplicateContractForSameBooking() {
        when(userRepository.findById(ownerId))
                .thenReturn(Optional.of(owner));

        when(bookingRepository.findById(bookingId))
                .thenReturn(Optional.of(booking));

        when(contractRepository.existsByBookingId(bookingId))
                .thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> contractService.createContract(bookingId, ownerId)
        );

        assertEquals(
                "Contract already exists for this booking",
                exception.getMessage()
        );

        verify(contractRepository, never()).saveAndFlush(any(Contract.class));

        verify(contractVersionRepository, never())
                .saveAndFlush(any(ContractVersion.class));
    }

    @Test
    void shouldRejectNullBookingId() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> contractService.createContract(null, ownerId)
        );

        assertEquals(
                "Booking ID is required",
                exception.getMessage()
        );

        verifyNoInteractions(
                userRepository,
                bookingRepository,
                contractRepository,
                contractVersionRepository,
                outboxEventService
        );
    }
}
