
package com.renthub.contract.service;

import com.renthub.chat.repository.ConversationParticipantRepository;
import com.renthub.chat.repository.ConversationRepository;
import com.renthub.chat.repository.MessageRepository;
import com.renthub.chat.service.MessageService;
import com.renthub.contract.entity.Contract;
import com.renthub.contract.entity.ContractRevisionRequest;
import com.renthub.contract.entity.ContractVersion;
import com.renthub.contract.enums.ContractRevisionStatus;
import com.renthub.contract.enums.ContractStatus;
import com.renthub.contract.repository.ContractRepository;
import com.renthub.contract.repository.ContractRevisionRequestRepository;
import com.renthub.contract.repository.ContractVersionRepository;
import com.renthub.user.entity.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import com.renthub.booking.entity.Booking;
import com.renthub.booking.enums.BookingStatus;
import com.renthub.chat.dto.MessageResponse;
import com.renthub.chat.entity.Conversation;
import com.renthub.contract.event.ContractCardCreatedEvent;
import com.renthub.equipment.entity.Equipment;
@ExtendWith(MockitoExtension.class)
class ContractReviewServiceTest {

    @Mock
    private ContractRevisionRequestRepository revisionRequestRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ContractVersionRepository contractVersionRepository;

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private ConversationParticipantRepository participantRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private MessageService messageService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ContractReviewService contractReviewService;

    private UUID contractId;
    private UUID ownerId;
    private UUID renterId;

    private User owner;
    private User renter;

    private Contract contract;
    private ContractVersion previousVersion;
    private ContractVersion staleVersion;
    private ContractRevisionRequest revisionRequest;

    private final String originalTerms =
            "Original contract terms - Version 1";

    private final String updatedTerms =
            "Updated contract terms - Version 2";

    private final ZonedDateTime renterSignedAt =
            ZonedDateTime.parse("2026-11-02T20:50:00+07:00");

    private final ZonedDateTime ownerSignedAt =
            ZonedDateTime.parse("2026-11-02T20:55:00+07:00");

    @BeforeEach
    void setUp() {
        contractId = UUID.randomUUID();
        ownerId = UUID.randomUUID();
        renterId = UUID.randomUUID();

        owner = new User();
        owner.setId(ownerId);
        owner.setFirstName("Khắc");
        owner.setLastName("Anh");
        owner.setEmail("owner@example.com");

        renter = new User();
        renter.setId(renterId);
        renter.setFirstName("Minh");
        renter.setLastName("Nguyễn");
        renter.setEmail("renter@example.com");

        contract = new Contract();
        contract.setId(contractId);
        contract.setOwner(owner);
        contract.setRenter(renter);
        contract.setStatus(ContractStatus.REVISION_REQUESTED);
        contract.setCurrentVersion(1);
        contract.setTerms(originalTerms);

        contract.setRenterSignedAt(renterSignedAt);
        contract.setOwnerSignedAt(ownerSignedAt);

        previousVersion = new ContractVersion();
        previousVersion.setId(UUID.randomUUID());
        previousVersion.setContract(contract);
        previousVersion.setVersionNumber(1);
        previousVersion.setCreatedBy(owner);

        previousVersion.setEquipmentTitle("Canon EOS R6");
        previousVersion.setStartDate(
                LocalDate.of(2026, 11, 5)
        );
        previousVersion.setEndDate(
                LocalDate.of(2026, 11, 7)
        );
        previousVersion.setTotalDays(2);

        previousVersion.setPricePerDay(
                new BigDecimal("200000")
        );
        previousVersion.setRentalAmount(
                new BigDecimal("400000")
        );
        previousVersion.setDepositAmount(
                new BigDecimal("100000")
        );
        previousVersion.setTotalAmount(
                new BigDecimal("500000")
        );

        previousVersion.setTerms(originalTerms);
        previousVersion.setRenterSignedAt(renterSignedAt);
        previousVersion.setOwnerSignedAt(ownerSignedAt);

        revisionRequest = new ContractRevisionRequest();
        revisionRequest.setId(UUID.randomUUID());
        revisionRequest.setContract(contract);
        revisionRequest.setContractVersion(previousVersion);
        revisionRequest.setRequestedBy(renter);
        revisionRequest.setReason(
                "Please update the contract terms"
        );
        revisionRequest.setStatus(ContractRevisionStatus.OPEN);

        staleVersion = new ContractVersion();
        staleVersion.setId(UUID.randomUUID());
        staleVersion.setContract(contract);
        staleVersion.setVersionNumber(0);
    }

    private void stubValidRevision() {
        when(contractRepository.findById(contractId))
                .thenReturn(Optional.of(contract));

        when(revisionRequestRepository
                .findFirstByContractIdAndStatusOrderByCreatedAtDesc(
                        contractId,
                        ContractRevisionStatus.OPEN
                ))
                .thenReturn(Optional.of(revisionRequest));

        when(contractVersionRepository
                .findByContractIdAndVersionNumber(contractId, 1))
                .thenReturn(Optional.of(previousVersion));

        when(contractVersionRepository.saveAndFlush(
                any(ContractVersion.class)
        )).thenAnswer(invocation -> invocation.getArgument(0));

        when(contractRepository.saveAndFlush(
                any(Contract.class)
        )).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void shouldCreateVersionTwoWhenOwnerRevisesContract() {
        stubValidRevision();

        Contract result = contractReviewService.reviseContract(
                contractId,
                ownerId,
                updatedTerms
        );

        assertNotNull(result);

        assertEquals(2, result.getCurrentVersion());
        assertEquals(updatedTerms, result.getTerms());

        assertEquals(
                ContractStatus.REVISION_REQUESTED,
                result.getStatus()
        );

        verify(contractVersionRepository)
                .saveAndFlush(any(ContractVersion.class));

        verify(contractRepository)
                .saveAndFlush(contract);
    }

    @Test
    void shouldPreserveOriginalVersionWithoutModification() {
        stubValidRevision();

        String oldTermsBeforeRevision =
                previousVersion.getTerms();

        Integer oldVersionNumber =
                previousVersion.getVersionNumber();

        contractReviewService.reviseContract(
                contractId,
                ownerId,
                updatedTerms
        );

        // Version 1 must remain unchanged.
        assertEquals(
                oldTermsBeforeRevision,
                previousVersion.getTerms()
        );

        assertEquals(
                oldVersionNumber,
                previousVersion.getVersionNumber()
        );

        assertEquals(
                renterSignedAt,
                previousVersion.getRenterSignedAt()
        );

        assertEquals(
                ownerSignedAt,
                previousVersion.getOwnerSignedAt()
        );
    }

    @Test
    void shouldSaveNewTermsInVersionTwoSnapshot() {
        stubValidRevision();

        contractReviewService.reviseContract(
                contractId,
                ownerId,
                "  " + updatedTerms + "  "
        );

        ArgumentCaptor<ContractVersion> captor =
                ArgumentCaptor.forClass(ContractVersion.class);

        verify(contractVersionRepository)
                .saveAndFlush(captor.capture());

        ContractVersion newVersion = captor.getValue();

        assertNotNull(newVersion);

        assertSame(contract, newVersion.getContract());

        assertEquals(2, newVersion.getVersionNumber());

        assertEquals(owner, newVersion.getCreatedBy());

        assertEquals(
                updatedTerms,
                newVersion.getTerms()
        );

        assertEquals(
                previousVersion.getEquipmentTitle(),
                newVersion.getEquipmentTitle()
        );

        assertEquals(
                previousVersion.getStartDate(),
                newVersion.getStartDate()
        );

        assertEquals(
                previousVersion.getEndDate(),
                newVersion.getEndDate()
        );

        assertEquals(
                previousVersion.getTotalDays(),
                newVersion.getTotalDays()
        );

        assertEquals(
                previousVersion.getPricePerDay(),
                newVersion.getPricePerDay()
        );

        assertEquals(
                previousVersion.getRentalAmount(),
                newVersion.getRentalAmount()
        );

        assertEquals(
                previousVersion.getDepositAmount(),
                newVersion.getDepositAmount()
        );

        assertEquals(
                previousVersion.getTotalAmount(),
                newVersion.getTotalAmount()
        );
    }

    @Test
    void shouldClearPreviousSignaturesAfterRevision() {
        stubValidRevision();

        contractReviewService.reviseContract(
                contractId,
                ownerId,
                updatedTerms
        );

        // Current contract must require new signatures.
        assertNull(contract.getRenterSignedAt());
        assertNull(contract.getOwnerSignedAt());

        // Version 1 keeps its original signatures.
        assertEquals(
                renterSignedAt,
                previousVersion.getRenterSignedAt()
        );

        assertEquals(
                ownerSignedAt,
                previousVersion.getOwnerSignedAt()
        );
    }

    @Test
    void shouldRejectUserWhoIsNotContractOwner() {
        UUID anotherUserId = UUID.randomUUID();

        when(contractRepository.findById(contractId))
                .thenReturn(Optional.of(contract));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> contractReviewService.reviseContract(
                        contractId,
                        anotherUserId,
                        updatedTerms
                )
        );

        assertEquals(
                "Only the contract owner can revise this contract",
                exception.getMessage()
        );

        verifyNoInteractions(
                revisionRequestRepository,
                contractVersionRepository
        );

        verify(contractRepository, never())
                .saveAndFlush(any(Contract.class));
    }

    @Test
    void shouldRejectContractNotWaitingForRevision() {
        contract.setStatus(ContractStatus.DRAFT);

        when(contractRepository.findById(contractId))
                .thenReturn(Optional.of(contract));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> contractReviewService.reviseContract(
                        contractId,
                        ownerId,
                        updatedTerms
                )
        );

        assertEquals(
                "Contract is not waiting for revision",
                exception.getMessage()
        );

        verifyNoInteractions(
                revisionRequestRepository,
                contractVersionRepository
        );

        verify(contractRepository, never())
                .saveAndFlush(any(Contract.class));
    }

    @Test
    void shouldRejectBlankOrNullTerms() {
        when(contractRepository.findById(contractId))
                .thenReturn(Optional.of(contract));

        assertThrows(
                IllegalArgumentException.class,
                () -> contractReviewService.reviseContract(
                        contractId,
                        ownerId,
                        null
                )
        );

        assertThrows(
                IllegalArgumentException.class,
                () -> contractReviewService.reviseContract(
                        contractId,
                        ownerId,
                        "   "
                )
        );

        verifyNoInteractions(
                revisionRequestRepository,
                contractVersionRepository
        );

        verify(contractRepository, never())
                .saveAndFlush(any(Contract.class));
    }

    @Test
    void shouldRejectTermsExceedingMaximumLength() {
        stubContractOnly();

        String oversizedTerms = "A".repeat(10001);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> contractReviewService.reviseContract(
                        contractId,
                        ownerId,
                        oversizedTerms
                )
        );

        assertEquals(
                "Contract terms cannot exceed 10000 characters",
                exception.getMessage()
        );

        verifyNoInteractions(
                revisionRequestRepository,
                contractVersionRepository
        );

        verify(contractRepository, never())
                .saveAndFlush(any(Contract.class));
    }

   @Test
void shouldRejectRevisionRequestForDifferentVersion() {
    // Only configure dependencies used before the version mismatch check.
    when(contractRepository.findById(contractId))
            .thenReturn(Optional.of(contract));

    when(revisionRequestRepository
            .findFirstByContractIdAndStatusOrderByCreatedAtDesc(
                    contractId,
                    ContractRevisionStatus.OPEN
            ))
            .thenReturn(Optional.of(revisionRequest));

    when(contractVersionRepository
            .findByContractIdAndVersionNumber(contractId, 1))
            .thenReturn(Optional.of(previousVersion));

    // The open revision request belongs to another version.
    revisionRequest.setContractVersion(staleVersion);

    IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> contractReviewService.reviseContract(
                    contractId,
                    ownerId,
                    updatedTerms
            )
    );

    assertTrue(
            exception.getMessage().contains(
                    "A revised version already exists"
            )
    );

    // No new version or contract update should be persisted.
    verify(contractVersionRepository, never())
            .saveAndFlush(any(ContractVersion.class));

    verify(contractRepository, never())
            .saveAndFlush(any(Contract.class));
}

    @Test
    void shouldRejectWhenNoOpenRevisionRequestExists() {
        stubContractOnly();

        when(revisionRequestRepository
                .findFirstByContractIdAndStatusOrderByCreatedAtDesc(
                        contractId,
                        ContractRevisionStatus.OPEN
                ))
                .thenReturn(Optional.empty());

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> contractReviewService.reviseContract(
                        contractId,
                        ownerId,
                        updatedTerms
                )
        );

        assertEquals(
                "Open revision request was not found",
                exception.getMessage()
        );

        verify(contractVersionRepository, never())
                .saveAndFlush(any(ContractVersion.class));

        verify(contractRepository, never())
                .saveAndFlush(any(Contract.class));
    }

    private void stubContractOnly() {
        when(contractRepository.findById(contractId))
                .thenReturn(Optional.of(contract));
    }

    @Test
void shouldAcceptContractForSigningByRenter() {
    contract.setStatus(ContractStatus.PENDING_REVIEW);

    when(contractRepository.findById(contractId))
            .thenReturn(Optional.of(contract));

    when(contractVersionRepository
            .findByContractIdAndVersionNumber(contractId, 1))
            .thenReturn(Optional.of(previousVersion));

    when(contractVersionRepository.saveAndFlush(
            any(ContractVersion.class)
    )).thenAnswer(invocation -> invocation.getArgument(0));

    when(contractRepository.saveAndFlush(
            any(Contract.class)
    )).thenAnswer(invocation -> invocation.getArgument(0));

    Contract result = contractReviewService.acceptForSigning(
            contractId,
            renterId
    );

    assertNotNull(result);

    assertEquals(
            ContractStatus.PENDING_SIGNATURE,
            result.getStatus()
    );

    assertNotNull(
            previousVersion.getRenterReviewedAt(),
            "Renter review timestamp must be recorded"
    );

    assertEquals(
            renterSignedAt,
            previousVersion.getRenterSignedAt(),
            "Existing signature snapshot must not be modified"
    );

    assertEquals(
            ownerSignedAt,
            previousVersion.getOwnerSignedAt(),
            "Existing signature snapshot must not be modified"
    );

    verify(contractVersionRepository).saveAndFlush(previousVersion);
    verify(contractRepository).saveAndFlush(contract);
}
@Test
void shouldCreateRevisionRequestByRenter() {
    contract.setStatus(ContractStatus.PENDING_REVIEW);

    when(contractRepository.findById(contractId))
            .thenReturn(Optional.of(contract));

    when(contractVersionRepository
            .findByContractIdAndVersionNumber(contractId, 1))
            .thenReturn(Optional.of(previousVersion));

    when(revisionRequestRepository.existsByContractIdAndStatus(
            contractId,
            ContractRevisionStatus.OPEN
    )).thenReturn(false);

    when(revisionRequestRepository.saveAndFlush(
            any(ContractRevisionRequest.class)
    )).thenAnswer(invocation -> invocation.getArgument(0));

    when(contractRepository.saveAndFlush(
            any(Contract.class)
    )).thenAnswer(invocation -> invocation.getArgument(0));

    var result = contractReviewService.requestChanges(
            contractId,
            renterId,
            "  Please clarify the equipment return conditions.  "
    );

    assertNotNull(result);

    assertEquals(
            ContractStatus.REVISION_REQUESTED,
            contract.getStatus()
    );

    ArgumentCaptor<ContractRevisionRequest> captor =
            ArgumentCaptor.forClass(ContractRevisionRequest.class);

    verify(revisionRequestRepository)
            .saveAndFlush(captor.capture());

    ContractRevisionRequest savedRevision = captor.getValue();

    assertEquals(contract, savedRevision.getContract());

    assertEquals(
            previousVersion,
            savedRevision.getContractVersion()
    );

    assertEquals(renter, savedRevision.getRequestedBy());

    assertEquals(
            "Please clarify the equipment return conditions.",
            savedRevision.getReason()
    );

    assertEquals(
            ContractRevisionStatus.OPEN,
            savedRevision.getStatus()
    );

    verify(contractRepository).saveAndFlush(contract);
}


@Test
void shouldRejectDuplicateOpenRevisionRequest() {
    contract.setStatus(ContractStatus.PENDING_REVIEW);

    when(contractRepository.findById(contractId))
            .thenReturn(Optional.of(contract));

    when(contractVersionRepository
            .findByContractIdAndVersionNumber(contractId, 1))
            .thenReturn(Optional.of(previousVersion));

    when(revisionRequestRepository.existsByContractIdAndStatus(
            contractId,
            ContractRevisionStatus.OPEN
    )).thenReturn(true);

    IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> contractReviewService.requestChanges(
                    contractId,
                    renterId,
                    "Please update the terms"
            )
    );

    assertEquals(
            "An open revision request already exists",
            exception.getMessage()
    );

    verify(revisionRequestRepository, never())
            .saveAndFlush(any(ContractRevisionRequest.class));

    verify(contractRepository, never())
            .saveAndFlush(any(Contract.class));
}
@Test
void shouldSendRevisedVersionAndResolveOpenRevisionRequest() {
    // Given: contract has been revised to Version 2.
    contract.setStatus(ContractStatus.REVISION_REQUESTED);
    contract.setCurrentVersion(2);

    // Booking must still be approved.
    Equipment equipment = new Equipment();
    equipment.setId(UUID.randomUUID());

    Booking booking = new Booking();
    booking.setStatus(BookingStatus.APPROVED);
    booking.setEquipment(equipment);

    contract.setBooking(booking);

    // Conversation between owner and renter.
    Conversation conversation = new Conversation();
    UUID conversationId = UUID.randomUUID();
    conversation.setId(conversationId);

    // Version 2 is the version being sent.
    ContractVersion versionTwo = new ContractVersion();
    UUID versionTwoId = UUID.randomUUID();

    versionTwo.setId(versionTwoId);
    versionTwo.setContract(contract);
    versionTwo.setVersionNumber(2);
    versionTwo.setTerms(updatedTerms);

    // The open request belongs to Version 1.
    revisionRequest.setContractVersion(previousVersion);
    revisionRequest.setStatus(ContractRevisionStatus.OPEN);

    MessageResponse message = MessageResponse.builder()
            .id(UUID.randomUUID())
            .build();

    when(contractRepository.findById(contractId))
            .thenReturn(Optional.of(contract));

    when(conversationRepository.findMatchingContractConversation(
            equipment.getId(),
            ownerId,
            renterId
    )).thenReturn(java.util.List.of(conversation));

    when(participantRepository.existsByConversationIdAndUserId(
            conversationId,
            ownerId
    )).thenReturn(true);

    when(participantRepository.existsByConversationIdAndUserId(
            conversationId,
            renterId
    )).thenReturn(true);

    when(contractVersionRepository
            .findByContractIdAndVersionNumber(contractId, 2))
            .thenReturn(Optional.of(versionTwo));

    when(messageRepository.existsContractCard(
            conversationId,
            versionTwoId
    )).thenReturn(false);

    when(messageService.createContractCardMessage(
            conversation,
            owner,
            versionTwo
    )).thenReturn(message);

    when(contractRepository.saveAndFlush(contract))
            .thenReturn(contract);

    when(revisionRequestRepository
            .findFirstByContractIdAndStatusOrderByCreatedAtDesc(
                    contractId,
                    ContractRevisionStatus.OPEN
            )).thenReturn(Optional.of(revisionRequest));

    // When
    MessageResponse result =
            contractReviewService.sendForReview(
                    contractId,
                    ownerId
            );

    // Then: contract enters PENDING_REVIEW.
    assertNotNull(result);

    assertEquals(
            ContractStatus.PENDING_REVIEW,
            contract.getStatus()
    );

    // Revision request must be resolved.
    assertEquals(
            ContractRevisionStatus.RESOLVED,
            revisionRequest.getStatus()
    );

    assertSame(owner, revisionRequest.getResolvedBy());

    // The resolved version must be Version 2, not Version 1.
    assertSame(
            versionTwo,
            revisionRequest.getResolvedVersion()
    );

    assertNotNull(revisionRequest.getResolvedAt());

    verify(revisionRequestRepository)
            .save(revisionRequest);

    verify(contractRepository)
            .saveAndFlush(contract);

    verify(messageService).createContractCardMessage(
            conversation,
            owner,
            versionTwo
    );

    verify(eventPublisher).publishEvent(
            any(ContractCardCreatedEvent.class)
    );
}




}
