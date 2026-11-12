
package com.renthub.contract.service;

import com.renthub.booking.entity.Booking;
import com.renthub.booking.enums.BookingStatus;
import com.renthub.booking.repository.BookingRepository;
import com.renthub.contract.entity.Contract;
import com.renthub.contract.entity.ContractRevisionRequest;
import com.renthub.contract.entity.ContractVersion;
import com.renthub.contract.enums.ContractRevisionStatus;
import com.renthub.contract.enums.ContractStatus;
import com.renthub.contract.repository.ContractRepository;
import com.renthub.contract.repository.ContractRevisionRequestRepository;
import com.renthub.contract.repository.ContractVersionRepository;
import com.renthub.equipment.entity.Equipment;
import com.renthub.equipment.repository.EquipmentRepository;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ContractRevisionTransactionIntegrationTest {

    @Autowired
    private ContractService contractService;

    @Autowired
    private ContractReviewService contractReviewService;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private ContractVersionRepository contractVersionRepository;

    @Autowired
    private ContractRevisionRequestRepository revisionRequestRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private static final String UPDATED_TERMS =
            "Updated integration test contract terms - Version 2";

    @Test
    void reviseContract_shouldPersistNewVersionAndPreserveOldSnapshot() {
        TestFixture fixture = createFixture();

        try {
            // Execute real transactional revision service.
            contractReviewService.reviseContract(
                    fixture.contractId(),
                    fixture.ownerId(),
                    "  " + UPDATED_TERMS + "  "
            );

            // Verify current contract from PostgreSQL.
            Contract currentContract =
                    contractRepository.findById(fixture.contractId())
                            .orElseThrow();

            assertThat(currentContract.getCurrentVersion()).isEqualTo(2);

            assertThat(currentContract.getTerms())
                    .isEqualTo(UPDATED_TERMS);

            assertThat(currentContract.getStatus())
                    .isEqualTo(ContractStatus.REVISION_REQUESTED);

            // Current contract signatures must be cleared.
            assertThat(currentContract.getRenterSignedAt()).isNull();
            assertThat(currentContract.getOwnerSignedAt()).isNull();

            // Verify both immutable snapshots.
            var versions =
                    contractVersionRepository
                            .findByContractIdOrderByVersionNumberDesc(
                                    fixture.contractId()
                            );

            assertThat(versions).hasSize(2);

            ContractVersion versionTwo = versions.get(0);
            ContractVersion versionOne = versions.get(1);

            assertThat(versionOne.getVersionNumber()).isEqualTo(1);
            assertThat(versionTwo.getVersionNumber()).isEqualTo(2);

            // Version 1 must remain unchanged.
            assertThat(versionOne.getTerms())
                    .isEqualTo(fixture.originalTerms());

            assertThat(versionOne.getRenterSignedAt())
                    .isEqualTo(fixture.renterSignedAt());

            assertThat(versionOne.getOwnerSignedAt())
                    .isEqualTo(fixture.ownerSignedAt());

            // Version 2 must contain the revised terms.
            assertThat(versionTwo.getTerms())
                    .isEqualTo(UPDATED_TERMS);

            assertThat(versionTwo.getEquipmentTitle())
                    .isEqualTo(versionOne.getEquipmentTitle());

            assertThat(versionTwo.getStartDate())
                    .isEqualTo(versionOne.getStartDate());

            assertThat(versionTwo.getEndDate())
                    .isEqualTo(versionOne.getEndDate());

            assertThat(versionTwo.getPricePerDay())
                    .isEqualByComparingTo(versionOne.getPricePerDay());

            assertThat(versionTwo.getRentalAmount())
                    .isEqualByComparingTo(versionOne.getRentalAmount());

            assertThat(versionTwo.getDepositAmount())
                    .isEqualByComparingTo(versionOne.getDepositAmount());

            assertThat(versionTwo.getTotalAmount())
                    .isEqualByComparingTo(versionOne.getTotalAmount());

            // Revision request stays OPEN until the revised
            // version is successfully sent to the renter.
            ContractRevisionRequest revision =
                    revisionRequestRepository.findById(
                            fixture.revisionRequestId()
                    ).orElseThrow();

            assertThat(revision.getStatus())
                    .isEqualTo(ContractRevisionStatus.OPEN);

            assertThat(revision.getContractVersion().getId())
                    .isEqualTo(fixture.versionOneId());

        } finally {
            cleanup(fixture);
        }
    }

    @Test
    void reviseContract_shouldRollbackContractAndVersionTogether() {
        TestFixture fixture = createFixture();

        TransactionTemplate transactionTemplate =
                new TransactionTemplate(transactionManager);

        try {
            // Confirm initial state.
            Contract before =
                    contractRepository.findById(fixture.contractId())
                            .orElseThrow();

            assertThat(before.getCurrentVersion()).isEqualTo(1);

            assertThat(before.getTerms())
                    .isEqualTo(fixture.originalTerms());

            transactionTemplate.executeWithoutResult(status -> {

                contractReviewService.reviseContract(
                        fixture.contractId(),
                        fixture.ownerId(),
                        UPDATED_TERMS
                );

                // Version 2 must exist inside this transaction.
                assertThat(
                        contractVersionRepository
                                .findByContractIdOrderByVersionNumberDesc(
                                        fixture.contractId()
                                )
                ).hasSize(2);

                Contract updated =
                        contractRepository.findById(
                                fixture.contractId()
                        ).orElseThrow();

                assertThat(updated.getCurrentVersion()).isEqualTo(2);

                // Simulate a failure after revision writes.
                status.setRollbackOnly();
            });

            // Re-query PostgreSQL after transaction rollback.
            Contract after =
                    contractRepository.findById(fixture.contractId())
                            .orElseThrow();

            assertThat(after.getCurrentVersion()).isEqualTo(1);

            assertThat(after.getTerms())
                    .isEqualTo(fixture.originalTerms());

            assertThat(after.getStatus())
                    .isEqualTo(ContractStatus.REVISION_REQUESTED);

            assertThat(after.getRenterSignedAt())
                    .isEqualTo(fixture.renterSignedAt());

            assertThat(after.getOwnerSignedAt())
                    .isEqualTo(fixture.ownerSignedAt());

            // Version 2 must no longer exist.
            assertThat(
                    contractVersionRepository
                            .findByContractIdOrderByVersionNumberDesc(
                                    fixture.contractId()
                            )
            ).hasSize(1);

            // Original revision request remains OPEN.
            ContractRevisionRequest revision =
                    revisionRequestRepository.findById(
                            fixture.revisionRequestId()
                    ).orElseThrow();

            assertThat(revision.getStatus())
                    .isEqualTo(ContractRevisionStatus.OPEN);

        } finally {
            cleanup(fixture);
        }
    }

    private TestFixture createFixture() {
        String unique = UUID.randomUUID().toString();

        User owner = createUser(
                "revision-owner-" + unique + "@example.com"
        );

        User renter = createUser(
                "revision-renter-" + unique + "@example.com"
        );

        Equipment equipment = new Equipment();
        equipment.setOwner(owner);
        equipment.setTitle("Revision Integration Canon EOS R6");
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
        booking.setDepositAmount(new BigDecimal("50000"));

        booking.setStatus(BookingStatus.APPROVED);

        booking = bookingRepository.saveAndFlush(booking);

        Contract contract = contractService.createContract(
                booking.getId(),
                owner.getId()
        );

        ContractVersion versionOne =
                contractVersionRepository
                        .findByContractIdAndVersionNumber(
                                contract.getId(),
                                1
                        )
                        .orElseThrow();

        ZonedDateTime renterSignedAt =
                ZonedDateTime.now().minusHours(2);

        ZonedDateTime ownerSignedAt =
                ZonedDateTime.now().minusHours(1);

        // Simulate a previously signed Version 1.
        versionOne.setRenterSignedAt(renterSignedAt);
        versionOne.setOwnerSignedAt(ownerSignedAt);

        contractVersionRepository.saveAndFlush(versionOne);

        contract.setStatus(ContractStatus.REVISION_REQUESTED);
        contract.setRenterSignedAt(renterSignedAt);
        contract.setOwnerSignedAt(ownerSignedAt);

        contractRepository.saveAndFlush(contract);

        ContractRevisionRequest revision =
                new ContractRevisionRequest();

        revision.setContract(contract);
        revision.setContractVersion(versionOne);
        revision.setRequestedBy(renter);
        revision.setReason("Please revise the return conditions");
        revision.setStatus(ContractRevisionStatus.OPEN);

        revision = revisionRequestRepository.saveAndFlush(revision);

        return new TestFixture(
                booking.getId(),
                equipment.getId(),
                owner.getId(),
                renter.getId(),
                contract.getId(),
                versionOne.getId(),
                revision.getId(),
                versionOne.getTerms(),
                renterSignedAt,
                ownerSignedAt
        );
    }

    private User createUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPassword("integration-test-password");
        user.setFirstName("Contract");
        user.setLastName("RevisionTest");
        user.setStatus("ACTIVE");

        return userRepository.saveAndFlush(user);
    }

    private void cleanup(TestFixture fixture) {
        TransactionTemplate cleanupTransaction =
                new TransactionTemplate(transactionManager);

        cleanupTransaction.executeWithoutResult(status -> {

            revisionRequestRepository.deleteById(
                    fixture.revisionRequestId()
            );

            contractVersionRepository
                    .findByContractIdOrderByVersionNumberDesc(
                            fixture.contractId()
                    )
                    .forEach(version ->
                            contractVersionRepository.deleteById(
                                    version.getId()
                            )
                    );

            contractRepository.deleteById(fixture.contractId());

            bookingRepository.deleteById(fixture.bookingId());

            equipmentRepository.deleteById(fixture.equipmentId());

            userRepository.deleteById(fixture.renterId());

            userRepository.deleteById(fixture.ownerId());
        });
    }

    private record TestFixture(
            UUID bookingId,
            UUID equipmentId,
            UUID ownerId,
            UUID renterId,
            UUID contractId,
            UUID versionOneId,
            UUID revisionRequestId,
            String originalTerms,
            ZonedDateTime renterSignedAt,
            ZonedDateTime ownerSignedAt
    ) {
    }
}
