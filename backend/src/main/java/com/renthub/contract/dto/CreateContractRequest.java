package com.renthub.contract.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateContractRequest {

    private UUID bookingId;
}