package com.renthub.contract.service;

import com.renthub.booking.enums.BookingStatus;
import com.renthub.chat.dto.MessageResponse;
import com.renthub.chat.entity.Conversation;
import com.renthub.chat.repository.ConversationParticipantRepository;
import com.renthub.chat.repository.ConversationRepository;
import com.renthub.chat.repository.MessageRepository;
import com.renthub.chat.service.MessageService;
import com.renthub.contract.entity.Contract;
import com.renthub.contract.entity.ContractVersion;
import com.renthub.contract.enums.ContractStatus;
import com.renthub.contract.event.ContractCardCreatedEvent;
import com.renthub.contract.repository.ContractRepository;
import com.renthub.contract.repository.ContractVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.renthub.contract.dto.ContractRevisionRequestResponse;
import com.renthub.contract.entity.ContractRevisionRequest;
import com.renthub.contract.enums.ContractRevisionStatus;
import com.renthub.contract.repository.ContractRevisionRequestRepository;
import com.renthub.contract.dto.ReviseContractRequest;

import com.renthub.contract.dto.ContractVersionResponse;
import java.time.ZonedDateTime;


import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContractReviewService {
    private final ContractRevisionRequestRepository revisionRequestRepository;
    private final ContractRepository contractRepository;
    private final ContractVersionRepository contractVersionRepository;

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;

    private final MessageService messageService;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Owner sends the current contract version to renter for review.
     */
    @Transactional
    public MessageResponse sendForReview(
            UUID contractId,
            UUID ownerId
    ) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Contract not found")
                );

        // 1. Only contract owner can send it.
        if (!contract.getOwner().getId().equals(ownerId)) {
            throw new IllegalArgumentException(
                    "Only the contract owner can send it for review"
            );
        }

        // 2. Validate current contract state.
        if (contract.getStatus() != ContractStatus.DRAFT
                && contract.getStatus()
                != ContractStatus.REVISION_REQUESTED) {

            throw new IllegalArgumentException(
                    "Contract cannot be sent for review in its current status"
            );
        }

        // 3. Booking must still be approved.
        if (contract.getBooking().getStatus() != BookingStatus.APPROVED) {
            throw new IllegalArgumentException(
                    "Booking must be APPROVED before sending the contract"
            );
        }

        UUID equipmentId =
                contract.getBooking().getEquipment().getId();

        UUID renterId = contract.getRenter().getId();

        // 4. Find the conversation containing both participants
        // and matching the booking equipment.
        List<Conversation> conversations =
                conversationRepository.findMatchingContractConversation(
                        equipmentId,
                        ownerId,
                        renterId
                );

        if (conversations.isEmpty()) {
            throw new IllegalArgumentException(
                    "No matching conversation found between owner and renter"
            );
        }

        if (conversations.size() > 1) {
            throw new IllegalStateException(
                    "Multiple conversations match this contract. "
                            + "Cannot determine the correct conversation."
            );
        }

        Conversation conversation = conversations.get(0);

        // 5. Additional participant authorization check.
        boolean ownerIsParticipant =
                participantRepository
                        .existsByConversationIdAndUserId(
                                conversation.getId(),
                                ownerId
                        );

        boolean renterIsParticipant =
                participantRepository
                        .existsByConversationIdAndUserId(
                                conversation.getId(),
                                renterId
                        );

        if (!ownerIsParticipant || !renterIsParticipant) {
            throw new IllegalArgumentException(
                    "Both owner and renter must belong to the conversation"
            );
        }

        // 6. Load current immutable contract version.
        ContractVersion version =
                contractVersionRepository
                        .findByContractIdAndVersionNumber(
                                contract.getId(),
                                contract.getCurrentVersion()
                        )
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "Current contract version was not found"
                                )
                        );

        // 7. Prevent duplicate card delivery for the same version.
        if (messageRepository.existsContractCard(
                conversation.getId(),
                version.getId()
        )) {
            throw new IllegalArgumentException(
                    "This contract version has already been sent"
            );
        }

        // 8. Update contract state in the same transaction.
        contract.setStatus(ContractStatus.PENDING_REVIEW);
        contractRepository.saveAndFlush(contract);

        // 9. Persist typed message.
        MessageResponse message =
                messageService.createContractCardMessage(
                        conversation,
                        contract.getOwner(),
                        version
                );
                // Resolve the open revision request when the revised version
// is successfully sent to renter.
revisionRequestRepository
        .findFirstByContractIdAndStatusOrderByCreatedAtDesc(
                contract.getId(),
                ContractRevisionStatus.OPEN
        )
        .ifPresent(revision -> {
            revision.setStatus(ContractRevisionStatus.RESOLVED);
            revision.setResolvedBy(contract.getOwner());
            revision.setResolvedVersion(version);
            revision.setResolvedAt(ZonedDateTime.now());

            revisionRequestRepository.save(revision);
        });


        // 10. Notify clients only after successful transaction commit.
        eventPublisher.publishEvent(
                new ContractCardCreatedEvent(
                        conversation.getId(),
                        renterId,
                        message
                )
        );

        return message;
    }

    @Transactional
public Contract acceptForSigning(
        UUID contractId,
        UUID renterId
) {

    Contract contract = contractRepository.findById(contractId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Contract not found")
            );

    if (!contract.getRenter().getId().equals(renterId)) {
        throw new IllegalArgumentException(
                "Only the renter can accept this contract"
        );
    }

    if (contract.getStatus() != ContractStatus.PENDING_REVIEW) {
        throw new IllegalArgumentException(
                "Contract is not waiting for renter review"
        );
    }

    ContractVersion version =
            contractVersionRepository
                    .findByContractIdAndVersionNumber(
                            contractId,
                            contract.getCurrentVersion()
                    )
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Current contract version was not found"
                            )
                    );

    if (version.getRenterReviewedAt() != null) {
        throw new IllegalArgumentException(
                "This contract version has already been reviewed"
        );
    }

    version.setRenterReviewedAt(ZonedDateTime.now());

    contractVersionRepository.saveAndFlush(version);

    contract.setStatus(ContractStatus.PENDING_SIGNATURE);

    return contractRepository.saveAndFlush(contract);
}
@Transactional
public ContractRevisionRequestResponse requestChanges(
        UUID contractId,
        UUID renterId,
        String reason
) {

    Contract contract = contractRepository.findById(contractId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Contract not found")
            );

    if (!contract.getRenter().getId().equals(renterId)) {
        throw new IllegalArgumentException(
                "Only the renter can request contract changes"
        );
    }

    if (contract.getStatus() != ContractStatus.PENDING_REVIEW) {
        throw new IllegalArgumentException(
                "Contract is not waiting for renter review"
        );
    }

    if (reason == null || reason.isBlank()) {
        throw new IllegalArgumentException(
                "Revision reason is required"
        );
    }

    String normalizedReason = reason.trim();

    if (normalizedReason.length() > 2000) {
        throw new IllegalArgumentException(
                "Revision reason cannot exceed 2000 characters"
        );
    }

    ContractVersion version =
            contractVersionRepository
                    .findByContractIdAndVersionNumber(
                            contractId,
                            contract.getCurrentVersion()
                    )
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Current contract version was not found"
                            )
                    );

    if (revisionRequestRepository.existsByContractIdAndStatus(
            contractId,
            ContractRevisionStatus.OPEN
    )) {
        throw new IllegalArgumentException(
                "An open revision request already exists"
        );
    }

    ContractRevisionRequest revision =
            new ContractRevisionRequest();

    revision.setContract(contract);
    revision.setContractVersion(version);
    revision.setRequestedBy(contract.getRenter());
    revision.setReason(normalizedReason);
    revision.setStatus(ContractRevisionStatus.OPEN);

    ContractRevisionRequest savedRevision =
            revisionRequestRepository.saveAndFlush(revision);

    contract.setStatus(ContractStatus.REVISION_REQUESTED);

    contractRepository.saveAndFlush(contract);

    return toRevisionResponse(savedRevision);
}


@Transactional(readOnly = true)
public List<ContractRevisionRequestResponse> getRevisionRequests(
        UUID contractId,
        UUID userId
) {

    Contract contract = contractRepository.findById(contractId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Contract not found")
            );

    boolean isRenter =
            contract.getRenter().getId().equals(userId);

    boolean isOwner =
            contract.getOwner().getId().equals(userId);

    if (!isRenter && !isOwner) {
        throw new IllegalArgumentException(
                "You are not a participant of this contract"
        );
    }

    return revisionRequestRepository
            .findByContractIdOrderByCreatedAtDesc(contractId)
            .stream()
            .map(this::toRevisionResponse)
            .toList();
}

private ContractRevisionRequestResponse toRevisionResponse(
        ContractRevisionRequest revision
) {

    return new ContractRevisionRequestResponse(
            revision.getId(),
            revision.getContract().getId(),
            revision.getContractVersion().getId(),
            revision.getRequestedBy().getId(),
            revision.getReason(),
            revision.getStatus(),
            revision.getCreatedAt()
    );
}

@Transactional
public Contract reviseContract(
        UUID contractId,
        UUID ownerId,
        String terms
) {

    Contract contract = contractRepository.findById(contractId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Contract not found")
            );

    // Only owner can revise the contract.
    if (!contract.getOwner().getId().equals(ownerId)) {
        throw new IllegalArgumentException(
                "Only the contract owner can revise this contract"
        );
    }

    if (contract.getStatus() != ContractStatus.REVISION_REQUESTED) {
        throw new IllegalArgumentException(
                "Contract is not waiting for revision"
        );
    }

    if (terms == null || terms.isBlank()) {
        throw new IllegalArgumentException(
                "Contract terms are required"
        );
    }

    String normalizedTerms = terms.trim();

    if (normalizedTerms.length() > 10000) {
        throw new IllegalArgumentException(
                "Contract terms cannot exceed 10000 characters"
        );
    }

    // Find the open revision request.
    ContractRevisionRequest revision =
            revisionRequestRepository
                    .findFirstByContractIdAndStatusOrderByCreatedAtDesc(
                            contractId,
                            ContractRevisionStatus.OPEN
                    )
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Open revision request was not found"
                            )
                    );

    // Load the version that renter requested changes to.
    ContractVersion previousVersion =
            contractVersionRepository
                    .findByContractIdAndVersionNumber(
                            contractId,
                            contract.getCurrentVersion()
                    )
                    .orElseThrow(() ->
                            new IllegalStateException(
                                    "Current contract version was not found"
                            )
                    );

    // Prevent accidentally creating multiple versions
    // for the same unresolved revision request.
    if (!revision.getContractVersion().getId()
            .equals(previousVersion.getId())) {

        throw new IllegalArgumentException(
                "A revised version already exists. "
                        + "Please send the current version for review."
        );
    }

    // Create a new immutable snapshot.
    int nextVersionNumber = contract.getCurrentVersion() + 1;

    ContractVersion newVersion = new ContractVersion();

    newVersion.setContract(contract);
    newVersion.setVersionNumber(nextVersionNumber);
    newVersion.setCreatedBy(contract.getOwner());

    newVersion.setEquipmentTitle(previousVersion.getEquipmentTitle());
    newVersion.setStartDate(previousVersion.getStartDate());
    newVersion.setEndDate(previousVersion.getEndDate());
    newVersion.setTotalDays(previousVersion.getTotalDays());

    newVersion.setPricePerDay(previousVersion.getPricePerDay());
    newVersion.setRentalAmount(previousVersion.getRentalAmount());
    newVersion.setDepositAmount(previousVersion.getDepositAmount());
    newVersion.setTotalAmount(previousVersion.getTotalAmount());

    newVersion.setTerms(normalizedTerms);

    contractVersionRepository.saveAndFlush(newVersion);

    // Update current contract data.
    contract.setTerms(normalizedTerms);
    contract.setCurrentVersion(nextVersionNumber);

    // Clear current signature fields.
    contract.setRenterSignedAt(null);
    contract.setOwnerSignedAt(null);

    // Keep REVISION_REQUESTED until owner sends the new version.
    contractRepository.saveAndFlush(contract);

    return contract;
}

@Transactional(readOnly = true)
public ContractVersionResponse getContractVersion(
        UUID contractId,
        Integer versionNumber,
        UUID userId
) {

    Contract contract = contractRepository.findById(contractId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Contract not found")
            );

    // Both renter and owner can view contract versions.
    boolean isRenter =
            contract.getRenter().getId().equals(userId);

    boolean isOwner =
            contract.getOwner().getId().equals(userId);

    if (!isRenter && !isOwner) {
        throw new IllegalArgumentException(
                "You are not a participant of this contract"
        );
    }

    if (versionNumber == null || versionNumber < 1) {
        throw new IllegalArgumentException(
                "Invalid contract version number"
        );
    }

    ContractVersion version =
            contractVersionRepository
                    .findByContractIdAndVersionNumber(
                            contractId,
                            versionNumber
                    )
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Contract version not found"
                            )
                    );

    return new ContractVersionResponse(
            version.getId(),
            contract.getId(),
            version.getVersionNumber(),

            version.getCreatedBy() != null
                    ? version.getCreatedBy().getId()
                    : null,

            version.getEquipmentTitle(),

            version.getStartDate(),
            version.getEndDate(),
            version.getTotalDays(),

            version.getPricePerDay(),
            version.getRentalAmount(),
            version.getDepositAmount(),
            version.getTotalAmount(),

            version.getTerms(),

            version.getRenterReviewedAt(),
            version.getRenterSignedAt(),
            version.getOwnerSignedAt(),
            version.getCreatedAt(),

            contract.getCurrentVersion(),
            version.getVersionNumber().equals(
                    contract.getCurrentVersion()
            ),
            contract.getStatus()
    );
}


}