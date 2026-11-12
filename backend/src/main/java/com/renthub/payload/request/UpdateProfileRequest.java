package com.renthub.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {
    private String firstName;
    private String lastName;

    @Email(message = "Email format is invalid")
    @Pattern(
        regexp = "^[A-Za-z0-9._%+-]+@gmail\\.com$",
        flags = Pattern.Flag.CASE_INSENSITIVE,
        message = "Only Gmail addresses ending in @gmail.com are allowed"
    )
    private String email;

    private String phoneNumber;
}