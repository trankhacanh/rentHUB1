package com.renthub.contract.controller;
import com.renthub.chat.dto.MessageResponse;
import com.renthub.contract.dto.ContractResponse;
import com.renthub.contract.dto.CreateContractRequest;
import com.renthub.contract.entity.Contract;
import com.renthub.contract.service.ContractService;
import com.renthub.security.services.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.renthub.contract.service.ContractReviewService;
import java.util.List;
import java.util.UUID;
import com.renthub.contract.dto.RequestContractChangesRequest;
import com.renthub.contract.dto.ContractRevisionRequestResponse;
import com.renthub.contract.dto.ReviseContractRequest;

import com.renthub.contract.dto.ContractVersionResponse;

import com.renthub.contract.dto.ContractDocumentStatusResponse;
import com.renthub.contract.service.ContractPdfAccessService;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.nio.charset.StandardCharsets;
@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {
        private final ContractReviewService contractReviewService;
    private final ContractService contractService;
        private final ContractPdfAccessService contractPdfAccessService;
    @PostMapping
    public ResponseEntity<ContractResponse> createContract(
            @RequestBody CreateContractRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        Contract contract =
                contractService.createContract(
                        request.getBookingId(),
                        userDetails.getId()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(contract));
    }

    @GetMapping("/{contractId}")
    public ResponseEntity<ContractResponse> getContractById(
            @PathVariable UUID contractId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        Contract contract =
                contractService.getContractById(
                        contractId,
                        userDetails.getId()
                );

        return ResponseEntity.ok(
                toResponse(contract)
        );
    }

    @GetMapping("/my")
    public ResponseEntity<List<ContractResponse>> getMyContracts(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        List<ContractResponse> contracts =
                contractService
                        .getMyContracts(userDetails.getId())
                        .stream()
                        .map(this::toResponse)
                        .toList();

        return ResponseEntity.ok(contracts);
    }

    @PutMapping("/{contractId}/sign/renter")
    public ResponseEntity<ContractResponse> signByRenter(
            @PathVariable UUID contractId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        Contract contract =
                contractService.signByRenter(
                        contractId,
                        userDetails.getId()
                );

        return ResponseEntity.ok(
                toResponse(contract)
        );
    }

    @PutMapping("/{contractId}/sign/owner")
    public ResponseEntity<ContractResponse> signByOwner(
            @PathVariable UUID contractId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        Contract contract =
                contractService.signByOwner(
                        contractId,
                        userDetails.getId()
                );

        return ResponseEntity.ok(
                toResponse(contract)
        );
    }

    @PutMapping("/{contractId}/activate")
    public ResponseEntity<ContractResponse> activateContract(
            @PathVariable UUID contractId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        Contract contract =
                contractService.activateContract(
                        contractId,
                        userDetails.getId()
                );

        return ResponseEntity.ok(
                toResponse(contract)
        );
    }

    @PutMapping("/{contractId}/complete")
    public ResponseEntity<ContractResponse> completeContract(
            @PathVariable UUID contractId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        Contract contract =
                contractService.completeContract(
                        contractId,
                        userDetails.getId()
                );

        return ResponseEntity.ok(
                toResponse(contract)
        );
    }

    @PutMapping("/{contractId}/cancel")
    public ResponseEntity<ContractResponse> cancelContract(
            @PathVariable UUID contractId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {

        Contract contract =
                contractService.cancelContract(
                        contractId,
                        userDetails.getId()
                );

        return ResponseEntity.ok(
                toResponse(contract)
        );
    }

    private ContractResponse toResponse(
            Contract contract
    ) {

        ContractResponse response =
                new ContractResponse();

        response.setId(contract.getId());

        response.setBookingId(
                contract.getBooking().getId()
        );

        response.setRenterId(
                contract.getRenter().getId()
        );

        response.setOwnerId(
                contract.getOwner().getId()
        );

        response.setEquipmentTitle(
                contract.getEquipmentTitle()
        );

        response.setStartDate(
                contract.getStartDate()
        );

        response.setEndDate(
                contract.getEndDate()
        );

        response.setTotalDays(
                contract.getTotalDays()
        );

        response.setPricePerDay(
                contract.getPricePerDay()
        );

        response.setRentalAmount(
                contract.getRentalAmount()
        );

        response.setDepositAmount(
                contract.getDepositAmount()
        );

        response.setTotalAmount(
                contract.getTotalAmount()
        );

        response.setStatus(
                contract.getStatus()
        );

        response.setRenterSignedAt(
                contract.getRenterSignedAt()
        );

        response.setOwnerSignedAt(
                contract.getOwnerSignedAt()
        );

        response.setTerms(
                contract.getTerms()
        );

        response.setCreatedAt(
                contract.getCreatedAt()
        );

        response.setUpdatedAt(
                contract.getUpdatedAt()
        );
        // Current contract version
        response.setCurrentVersion(
                contract.getCurrentVersion()
        );

        return response;
    }

    @PostMapping("/{contractId}/send-for-review")
public ResponseEntity<MessageResponse> sendForReview(
        @PathVariable UUID contractId,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    MessageResponse message =
            contractReviewService.sendForReview(
                    contractId,
                    userDetails.getId()
            );

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(message);
}
@PutMapping("/{contractId}/accept-review")
public ResponseEntity<ContractResponse> acceptForSigning(
        @PathVariable UUID contractId,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    Contract contract = contractReviewService.acceptForSigning(
            contractId,
            userDetails.getId()
    );

    return ResponseEntity.ok(toResponse(contract));
}

@PostMapping("/{contractId}/request-changes")
public ResponseEntity<ContractRevisionRequestResponse> requestChanges(
        @PathVariable UUID contractId,
        @RequestBody RequestContractChangesRequest request,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    ContractRevisionRequestResponse response =
            contractReviewService.requestChanges(
                    contractId,
                    userDetails.getId(),
                    request.getReason()
            );

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response);
}

@GetMapping("/{contractId}/revision-requests")
public ResponseEntity<List<ContractRevisionRequestResponse>>
getRevisionRequests(
        @PathVariable UUID contractId,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    return ResponseEntity.ok(
            contractReviewService.getRevisionRequests(
                    contractId,
                    userDetails.getId()
            )
    );
}
@PutMapping("/{contractId}/revise")
public ResponseEntity<ContractResponse> reviseContract(
        @PathVariable UUID contractId,
        @RequestBody ReviseContractRequest request,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    Contract contract = contractReviewService.reviseContract(
            contractId,
            userDetails.getId(),
            request.getTerms()
    );

    return ResponseEntity.ok(toResponse(contract));
}

@GetMapping("/{contractId}/versions/{versionNumber}")
public ResponseEntity<ContractVersionResponse> getContractVersion(
        @PathVariable UUID contractId,
        @PathVariable Integer versionNumber,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {

    ContractVersionResponse response =
            contractReviewService.getContractVersion(
                    contractId,
                    versionNumber,
                    userDetails.getId()
            );

    return ResponseEntity.ok(response);
}

@GetMapping("/{contractId}/versions/{versionNumber}/document")
public ResponseEntity<ContractDocumentStatusResponse> getDocumentStatus(
        @PathVariable UUID contractId,
        @PathVariable Integer versionNumber,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {
    ContractDocumentStatusResponse response =
            contractPdfAccessService.getDocumentStatus(
                    contractId,
                    versionNumber,
                    userDetails.getId()
            );

    return ResponseEntity.ok(response);
}

@GetMapping(
        "/{contractId}/versions/{versionNumber}/document/download"
)
public ResponseEntity<?> downloadContractPdf(
        @PathVariable UUID contractId,
        @PathVariable Integer versionNumber,
        @AuthenticationPrincipal UserDetailsImpl userDetails
) {
    ContractPdfAccessService.DownloadResult result =
            contractPdfAccessService.download(
                    contractId,
                    versionNumber,
                    userDetails.getId()
            );

    if (result.content() == null) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(result.status());
    }

    HttpHeaders headers = new HttpHeaders();

    headers.setContentType(MediaType.APPLICATION_PDF);

    headers.setContentLength(result.content().length);

    headers.setContentDisposition(
            ContentDisposition.attachment()
                    .filename(
                            result.status().fileName(),
                            StandardCharsets.UTF_8
                    )
                    .build()
    );

    return new ResponseEntity<>(
            result.content(),
            headers,
            HttpStatus.OK
    );
}





}