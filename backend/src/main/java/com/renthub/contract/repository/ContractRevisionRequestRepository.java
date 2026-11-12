package com.renthub.contract.repository;

import com.renthub.contract.entity.ContractRevisionRequest;
import com.renthub.contract.enums.ContractRevisionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface ContractRevisionRequestRepository
        extends JpaRepository<ContractRevisionRequest, UUID> {

    boolean existsByContractIdAndStatus(
            UUID contractId,
            ContractRevisionStatus status
    );

    List<ContractRevisionRequest> findByContractIdOrderByCreatedAtDesc(
            UUID contractId
    );

    Optional<ContractRevisionRequest>
findFirstByContractIdAndStatusOrderByCreatedAtDesc(
        UUID contractId,
        ContractRevisionStatus status
);

}