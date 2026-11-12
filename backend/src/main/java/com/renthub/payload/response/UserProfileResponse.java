package com.renthub.payload.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class UserProfileResponse {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String status;
    private Set<String> roles;
}