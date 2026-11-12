
package com.renthub.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {

    @NotBlank(message = "Email is required.")
    @Email(message = "Email format is invalid.")
    private String email;

    @NotBlank(message = "Password is required.")
    @Size(min = 8, max = 100,
            message = "Password must be between 8 and 100 characters.")
    private String password;

    @NotBlank(message = "First name is required.")
    @Size(max = 100, message = "First name must not exceed 100 characters.")
    private String firstName;

    @NotBlank(message = "Last name is required.")
    @Size(max = 100, message = "Last name must not exceed 100 characters.")
    private String lastName;

    @NotBlank(message = "Phone number is required.")
    @Pattern(
            regexp = "^[0-9]{10,11}$",
            message = "Phone number must contain 10 or 11 digits."
    )
    private String phoneNumber;
}
