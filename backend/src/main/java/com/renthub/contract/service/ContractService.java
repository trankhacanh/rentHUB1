package com.renthub.contract.service;

import com.renthub.booking.entity.Booking;
import com.renthub.booking.enums.BookingStatus;
import com.renthub.booking.repository.BookingRepository;
import com.renthub.contract.entity.Contract;
import com.renthub.contract.entity.ContractVersion;
import com.renthub.contract.enums.ContractStatus;
import com.renthub.contract.repository.ContractRepository;
import com.renthub.contract.repository.ContractVersionRepository;
import com.renthub.user.entity.User;
import com.renthub.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.renthub.contract.event.ContractSignedEvent;
import com.renthub.outbox.service.OutboxEventService;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final ContractVersionRepository contractVersionRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
private final OutboxEventService outboxEventService;
    /**
     * Owner creates a draft contract from an approved booking.
     * The initial contract content is saved as version 1.
     */
    @Transactional
    public Contract createContract(UUID bookingId, UUID userId) {

        if (bookingId == null) {
            throw new IllegalArgumentException("Booking ID is required");
        }

        User owner = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Booking not found")
                );

        // Only the equipment owner can create the contract.
        if (!booking.getEquipment().getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "You are not the owner of this booking"
            );
        }

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalArgumentException(
                    "Only APPROVED bookings can create a contract"
            );
        }

        if (contractRepository.existsByBookingId(bookingId)) {
            throw new IllegalArgumentException(
                    "Contract already exists for this booking"
            );
        }

        Contract contract = new Contract();

        contract.setBooking(booking);
        contract.setRenter(booking.getRenter());
        contract.setOwner(booking.getEquipment().getOwner());

        contract.setEquipmentTitle(booking.getEquipment().getTitle());

        contract.setStartDate(booking.getStartDate());
        contract.setEndDate(booking.getEndDate());
        contract.setTotalDays(booking.getTotalDays());

        contract.setPricePerDay(booking.getPricePerDay());
        contract.setRentalAmount(booking.getTotalAmount());
        contract.setDepositAmount(booking.getDepositAmount());

        if (booking.getDepositAmount() != null) {
            contract.setTotalAmount(
                    booking.getTotalAmount()
                            .add(booking.getDepositAmount())
            );
        } else {
            contract.setTotalAmount(booking.getTotalAmount());
        }

        contract.setStatus(ContractStatus.DRAFT);
        contract.setCurrentVersion(1);

       contract.setTerms(buildDefaultTerms(contract));

        Contract savedContract =
                contractRepository.saveAndFlush(contract);

        // Create immutable snapshot for version 1.
        ContractVersion initialVersion =
                createVersionSnapshot(savedContract, owner, 1);

        contractVersionRepository.saveAndFlush(initialVersion);

        return savedContract;
    }

    /**
     * Renter signs the current contract version.
     * Signing is only allowed after the contract has entered
     * the PENDING_SIGNATURE state.
     */
    @Transactional
    public Contract signByRenter(UUID contractId, UUID userId) {

        Contract contract = findContract(contractId);

        if (!contract.getRenter().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "You are not the renter of this contract"
            );
        }

        if (contract.getStatus() != ContractStatus.PENDING_SIGNATURE) {
            throw new IllegalArgumentException(
                    "Contract is not ready for signing"
            );
        }

        ContractVersion version = getCurrentVersion(contract);

        if (version.getRenterSignedAt() != null) {
            throw new IllegalArgumentException(
                    "Renter has already signed this contract version"
            );
        }

        ZonedDateTime signedAt = ZonedDateTime.now();

// Snapshot renter identity at signing time
User renter = contract.getRenter();

version.setRenterFirstName(renter.getFirstName());
version.setRenterLastName(renter.getLastName());
version.setRenterEmail(renter.getEmail());

version.setRenterSignedAt(signedAt);
contract.setRenterSignedAt(signedAt);

        updateSignatureStatus(contract, version);

        contractVersionRepository.save(version);

        return contractRepository.saveAndFlush(contract);
    }

    /**
     * Owner signs the current contract version.
     * Owner can only sign after the renter has signed.
     */
    @Transactional
    public Contract signByOwner(UUID contractId, UUID userId) {

        Contract contract = findContract(contractId);

        if (!contract.getOwner().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "You are not the owner of this contract"
            );
        }

        if (contract.getStatus() != ContractStatus.PENDING_SIGNATURE) {
            throw new IllegalArgumentException(
                    "Contract is not ready for signing"
            );
        }

        ContractVersion version = getCurrentVersion(contract);



        if (version.getOwnerSignedAt() != null) {
            throw new IllegalArgumentException(
                    "Owner has already signed this contract version"
            );
        }

        ZonedDateTime signedAt = ZonedDateTime.now();

// Snapshot owner identity at signing time
User owner = contract.getOwner();

version.setOwnerFirstName(owner.getFirstName());
version.setOwnerLastName(owner.getLastName());
version.setOwnerEmail(owner.getEmail());

version.setOwnerSignedAt(signedAt);
contract.setOwnerSignedAt(signedAt);

        updateSignatureStatus(contract, version);

        contractVersionRepository.save(version);

        return contractRepository.saveAndFlush(contract);
    }

    @Transactional
    public Contract activateContract(UUID contractId, UUID userId) {

        Contract contract = findContract(contractId);

        validateParticipant(contract, userId);

        if (contract.getStatus() != ContractStatus.SIGNED) {
            throw new IllegalArgumentException(
                    "Only SIGNED contracts can be activated"
            );
        }

        contract.setStatus(ContractStatus.ACTIVE);

        return contractRepository.saveAndFlush(contract);
    }

    @Transactional
    public Contract completeContract(UUID contractId, UUID userId) {

        Contract contract = findContract(contractId);

        validateParticipant(contract, userId);

        if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new IllegalArgumentException(
                    "Only ACTIVE contracts can be completed"
            );
        }

        contract.setStatus(ContractStatus.COMPLETED);

        return contractRepository.saveAndFlush(contract);
    }

    @Transactional
    public Contract cancelContract(UUID contractId, UUID userId) {

        Contract contract = findContract(contractId);

        validateParticipant(contract, userId);

        if (contract.getStatus() == ContractStatus.COMPLETED
                || contract.getStatus() == ContractStatus.CANCELLED) {

            throw new IllegalArgumentException(
                    "Contract cannot be cancelled in its current status"
            );
        }

        contract.setStatus(ContractStatus.CANCELLED);

        return contractRepository.saveAndFlush(contract);
    }

    @Transactional(readOnly = true)
    public Contract getContractById(UUID contractId, UUID userId) {

        Contract contract = findContract(contractId);

        validateParticipant(contract, userId);

        return contract;
    }

    @Transactional(readOnly = true)
    public List<Contract> getMyContracts(UUID userId) {

        List<Contract> renterContracts =
                contractRepository.findByRenterIdOrderByCreatedAtDesc(userId);

        List<Contract> ownerContracts =
                contractRepository.findByOwnerIdOrderByCreatedAtDesc(userId);

        return Stream.concat(
                        renterContracts.stream(),
                        ownerContracts.stream()
                )
                .distinct()
                .toList();
    }

    /**
     * Creates a snapshot of the current contract content.
     */
    private ContractVersion createVersionSnapshot(
            Contract contract,
            User createdBy,
            Integer versionNumber
    ) {

        ContractVersion version = new ContractVersion();

        version.setContract(contract);
        version.setVersionNumber(versionNumber);
        version.setCreatedBy(createdBy);

        version.setEquipmentTitle(contract.getEquipmentTitle());

        version.setStartDate(contract.getStartDate());
        version.setEndDate(contract.getEndDate());
        version.setTotalDays(contract.getTotalDays());

        version.setPricePerDay(contract.getPricePerDay());
        version.setRentalAmount(contract.getRentalAmount());
        version.setDepositAmount(contract.getDepositAmount());
        version.setTotalAmount(contract.getTotalAmount());

        version.setTerms(contract.getTerms());

        return version;
    }

    private ContractVersion getCurrentVersion(Contract contract) {

        return contractVersionRepository
                .findByContractIdAndVersionNumber(
                        contract.getId(),
                        contract.getCurrentVersion()
                )
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Current contract version was not found"
                        )
                );
    }

private void updateSignatureStatus(
        Contract contract,
        ContractVersion version
) {
    boolean renterSigned = version.getRenterSignedAt() != null;
    boolean ownerSigned = version.getOwnerSignedAt() != null;

    if (renterSigned && ownerSigned) {

        boolean newlySigned =
                contract.getStatus() != ContractStatus.SIGNED;

        contract.setStatus(ContractStatus.SIGNED);

        // Only publish once when the contract first becomes SIGNED.
        if (newlySigned) {
            outboxEventService.recordEvent(
                    "CONTRACT",
                    contract.getId(),
                    "CONTRACT_SIGNED",
                    new ContractSignedEvent(
                            contract.getId(),
                            version.getId(),
                            version.getVersionNumber()
                    )
            );
        }

    } else {
        contract.setStatus(ContractStatus.PENDING_SIGNATURE);
    }
}

    private void validateParticipant(Contract contract, UUID userId) {

        boolean isRenter =
                contract.getRenter().getId().equals(userId);

        boolean isOwner =
                contract.getOwner().getId().equals(userId);

        if (!isRenter && !isOwner) {
            throw new IllegalArgumentException(
                    "You are not a participant of this contract"
            );
        }
    }

    private Contract findContract(UUID contractId) {

        if (contractId == null) {
            throw new IllegalArgumentException(
                    "Contract ID is required"
            );
        }

        return contractRepository.findById(contractId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Contract not found")
                );
    }


    private String buildDefaultTerms(Contract contract) {
    return """
            ĐIỀU 1. ĐỐI TƯỢNG VÀ PHẠM VI THUÊ

            1.1. Bên cho thuê đồng ý cho Bên thuê thuê thiết bị: %s.

            1.2. Thông tin về thiết bị, thời hạn thuê, đơn giá,
            tiền thuê, tiền đặt cọc và tổng giá trị hợp đồng
            được thể hiện tại các mục tương ứng của hợp đồng này.

            1.3. Hai bên xác nhận đã thống nhất đối tượng và
            phạm vi thuê trước khi thực hiện hợp đồng.

            ĐIỀU 2. THỜI HẠN VÀ BÀN GIAO THIẾT BỊ

            2.1. Thời hạn thuê được xác định theo ngày bắt đầu,
            ngày kết thúc và tổng số ngày tại mục I của hợp đồng.

            2.2. Hai bên thống nhất thời gian, địa điểm và
            phương thức bàn giao thiết bị thông qua RentHub
            hoặc phương thức liên lạc được hai bên xác nhận.

            2.3. Khi nhận thiết bị, Bên thuê có trách nhiệm
            kiểm tra tình trạng, phụ kiện và các thành phần
            đi kèm. Những vấn đề phát hiện tại thời điểm nhận
            cần được thông báo và ghi nhận với Bên cho thuê.

            ĐIỀU 3. GIÁ THUÊ, THANH TOÁN VÀ TIỀN ĐẶT CỌC

            3.1. Giá thuê, tiền thuê, tiền đặt cọc và tổng số
            tiền được xác định tại mục II của hợp đồng.

            3.2. Hai bên thực hiện nghĩa vụ thanh toán theo
            phương thức và tiến độ đã thống nhất trên RentHub.

            3.3. Khoản tiền đặt cọc (nếu có) được xử lý theo
            thỏa thuận giữa hai bên và các điều kiện được
            ghi nhận trong hợp đồng.

            ĐIỀU 4. TRÁCH NHIỆM CỦA BÊN THUÊ

            4.1. Sử dụng thiết bị đúng mục đích và hướng dẫn
            vận hành, bảo quản thiết bị trong suốt thời gian thuê.

            4.2. Không tự ý sửa chữa, thay đổi kết cấu hoặc
            chuyển giao thiết bị cho bên thứ ba khi chưa có
            sự đồng ý của Bên cho thuê.

            4.3. Thông báo kịp thời cho Bên cho thuê khi thiết bị
            gặp sự cố, hư hỏng hoặc có nguy cơ thất lạc.

            4.4. Hoàn trả thiết bị cùng các phụ kiện đi kèm
            theo thời hạn và phương thức đã thống nhất.

            ĐIỀU 5. TRÁCH NHIỆM CỦA BÊN CHO THUÊ

            5.1. Bàn giao đúng thiết bị đã thỏa thuận và cung cấp
            thông tin cần thiết để Bên thuê sử dụng thiết bị.

            5.2. Thông báo cho Bên thuê về tình trạng thiết bị,
            các lỗi hoặc hạn chế đã biết trước khi bàn giao.

            5.3. Phối hợp giải quyết các vấn đề phát sinh
            liên quan đến thiết bị trong thời gian thuê.

            5.4. Thực hiện nghĩa vụ liên quan đến tiền đặt cọc
            và các nghĩa vụ khác theo thỏa thuận của hai bên.

            ĐIỀU 6. BẢO QUẢN, HƯ HỎNG VÀ HOÀN TRẢ

            6.1. Bên thuê có trách nhiệm bảo quản thiết bị
            và sử dụng theo đúng mục đích đã thống nhất.

            6.2. Khi hoàn trả, hai bên cùng kiểm tra tình trạng
            thiết bị và các phụ kiện đi kèm.

            6.3. Khi xảy ra hư hỏng, mất mát hoặc tranh chấp
            về tình trạng thiết bị, hai bên cần ghi nhận hiện trạng,
            bằng chứng và cùng xác định trách nhiệm.

            6.4. Việc bồi thường hoặc xử lý tiền đặt cọc (nếu có)
            phải căn cứ vào thiệt hại thực tế và thỏa thuận
            được hai bên xác nhận.

            ĐIỀU 7. THAY ĐỔI HỢP ĐỒNG VÀ XỬ LÝ VI PHẠM

            7.1. Mọi thay đổi về thời hạn thuê, giá trị hợp đồng
            hoặc điều khoản phải được hai bên thống nhất.

            7.2. Việc thay đổi nội dung hợp đồng được thực hiện
            thông qua quy trình cập nhật phiên bản trên RentHub.

            7.3. Khi một bên không thực hiện đúng nghĩa vụ,
            hai bên có trách nhiệm thông báo và phối hợp
            giải quyết trên tinh thần thiện chí.

            ĐIỀU 8. GIẢI QUYẾT TRANH CHẤP VÀ XÁC NHẬN

            8.1. Các tranh chấp phát sinh được ưu tiên giải quyết
            thông qua thương lượng và thống nhất giữa hai bên.

            8.2. Trường hợp không thể tự giải quyết, tranh chấp
            được xử lý theo quy định pháp luật hiện hành.

            8.3. Hai bên xác nhận đã đọc, hiểu và đồng ý với
            nội dung của phiên bản hợp đồng được cung cấp
            trên RentHub trước khi thực hiện xác nhận điện tử.
            """.formatted(contract.getEquipmentTitle());
}



}