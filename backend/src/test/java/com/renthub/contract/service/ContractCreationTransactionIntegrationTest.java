
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
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class ContractCreationTransactionIntegrationTest {

    @Autowired
    private ContractService contractService;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private ContractVersionRepository contractVersionRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @Test
    void createContract_shouldPersistContractAndVersionSnapshot() {
        TestFixture fixture = createFixture();

        try {
            // Execute the real transactional service.
            Contract result = contractService.createContract(
                    fixture.bookingId(),
                    fixture.ownerId()
            );

            assertThat(result.getId()).isNotNull();

            // Verify persisted contract from PostgreSQL.
            Contract persistedContract =
                    contractRepository.findByBookingId(
                            fixture.bookingId()
                    ).orElseThrow();

            assertThat(persistedContract.getStatus())
                    .isEqualTo(ContractStatus.DRAFT);

            assertThat(persistedContract.getCurrentVersion())
                    .isEqualTo(1);

            assertThat(persistedContract.getEquipmentTitle())
                    .isEqualTo("Integration Test Canon EOS R6");

            assertThat(persistedContract.getTotalAmount())
                    .isEqualByComparingTo("250000");

            String persistedTerms = persistedContract.getTerms();

            assertThat(persistedTerms)
                    .contains("Integration Test Canon EOS R6");

            // Verify all eight default terms.
            for (int i = 1; i <= 8; i++) {
                assertThat(persistedTerms)
                        .contains("ĐIỀU " + i + ".");
            }

            // Verify Version 1 was persisted.
            var versions =
                    contractVersionRepository
                            .findByContractIdOrderByVersionNumberDesc(
                                    persistedContract.getId()
                            );

            assertThat(versions).hasSize(1);

            ContractVersion version = versions.get(0);

            assertThat(version.getVersionNumber()).isEqualTo(1);

            assertThat(version.getCreatedBy().getId())
                    .isEqualTo(fixture.ownerId());

            assertThat(version.getEquipmentTitle())
                    .isEqualTo(persistedContract.getEquipmentTitle());

            assertThat(version.getTerms())
                    .isEqualTo(persistedTerms);

            assertThat(version.getStartDate())
                    .isEqualTo(persistedContract.getStartDate());

            assertThat(version.getEndDate())
                    .isEqualTo(persistedContract.getEndDate());

            assertThat(version.getPricePerDay())
                    .isEqualByComparingTo("100000");

            assertThat(version.getRentalAmount())
                    .isEqualByComparingTo("200000");

            assertThat(version.getDepositAmount())
                    .isEqualByComparingTo("50000");

            assertThat(version.getTotalAmount())
                    .isEqualByComparingTo("250000");

        } finally {
            cleanup(fixture);
        }
    }

    @Test
    void createContract_shouldRollbackContractAndVersionTogether() {
        TestFixture fixture = createFixture();

        AtomicReference<UUID> createdContractId =
                new AtomicReference<>();

        TransactionTemplate transactionTemplate =
                new TransactionTemplate(transactionManager);

        try {
            // Initially, no contract exists.
            assertThat(
                    contractRepository.findByBookingId(
                            fixture.bookingId()
                    )
            ).isEmpty();

            transactionTemplate.executeWithoutResult(status -> {

                Contract contract = contractService.createContract(
                        fixture.bookingId(),
                        fixture.ownerId()
                );

                createdContractId.set(contract.getId());

                // Both records must exist inside this transaction.
                assertThat(
                        contractRepository.findByBookingId(
                                fixture.bookingId()
                        )
                ).isPresent();

                assertThat(
                        contractVersionRepository
                                .findByContractIdOrderByVersionNumberDesc(
                                        contract.getId()
                                )
                ).hasSize(1);

                // Simulate a failure after both records were written.
                status.setRollbackOnly();
            });

            UUID contractId = createdContractId.get();

            assertThat(contractId).isNotNull();

            // After rollback, Contract must not exist.
            assertThat(
                    contractRepository.findByBookingId(
                            fixture.bookingId()
                    )
            ).isEmpty();

            // Version 1 must also have been rolled back.
            assertThat(
                    contractVersionRepository
                            .findByContractIdOrderByVersionNumberDesc(
                                    contractId
                            )
            ).isEmpty();

            // Original booking must remain unchanged.
            assertThat(
                    bookingRepository.findById(fixture.bookingId())
            ).isPresent();

            assertThat(
                    bookingRepository.findById(fixture.bookingId())
                            .orElseThrow()
                            .getStatus()
            ).isEqualTo(BookingStatus.APPROVED);

        } finally {
            cleanup(fixture);
        }
    }

    private TestFixture createFixture() {
        String unique = UUID.randomUUID().toString();

        User owner = createUser(
                "contract-owner-" + unique + "@example.com"
        );

        User renter = createUser(
                "contract-renter-" + unique + "@example.com"
        );

        Equipment equipment = new Equipment();
        equipment.setOwner(owner);
        equipment.setTitle("Integration Test Canon EOS R6");
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

        return new TestFixture(
                booking.getId(),
                equipment.getId(),
                owner.getId(),
                renter.getId()
        );
    }

    private User createUser(String email) {
        User user = new User();
        user.setEmail(email);
        user.setPassword("integration-test-password");
        user.setFirstName("Contract");
        user.setLastName("IntegrationTest");
        user.setStatus("ACTIVE");

        return userRepository.saveAndFlush(user);
    }

    private void cleanup(TestFixture fixture) {
        TransactionTemplate cleanupTransaction =
                new TransactionTemplate(transactionManager);

        cleanupTransaction.executeWithoutResult(status -> {

            contractRepository.findByBookingId(
                    fixture.bookingId()
            ).ifPresent(contract -> {

                contractVersionRepository
                        .findByContractIdOrderByVersionNumberDesc(
                                contract.getId()
                        )
                        .forEach(version ->
                                contractVersionRepository.deleteById(
                                        version.getId()
                                )
                        );

                contractRepository.deleteById(contract.getId());
            });

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
            UUID renterId
    ) {
    }
}
