package com.renthub.contract.repository;

import com.renthub.contract.entity.ContractVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContractVersionRepository
        extends JpaRepository<ContractVersion, UUID> {

    Optional<ContractVersion> findByContractIdAndVersionNumber(
            UUID contractId,
            Integer versionNumber
    );

    Optional<ContractVersion> findByIdAndContractId(
            UUID id,
            UUID contractId
    );

    List<ContractVersion> findByContractIdOrderByVersionNumberDesc(
            UUID contractId
    );
}