package com.renthub.contract.repository;

import com.renthub.contract.entity.ContractDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ContractDocumentRepository
        extends JpaRepository<ContractDocument, UUID> {

    Optional<ContractDocument> findByContractVersionId(
            UUID contractVersionId
    );

    Optional<ContractDocument> findByEventId(UUID eventId);

    boolean existsByContractVersionId(UUID contractVersionId);
}