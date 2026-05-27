package com.example.outletmanagement.payload.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class DivisionRequest {
    @NotBlank(message = "Division name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Division name must contain only letters and spaces")
    private String name;
}
