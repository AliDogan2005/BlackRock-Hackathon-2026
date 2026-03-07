package com.tokenapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateShareRequest {

    @NotBlank(message = "Share name is required")
    private String name;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Total tokens is required")
    @Positive(message = "Total tokens must be positive")
    private Long totalTokens;

    @NotNull(message = "Current value is required")
    @Positive(message = "Current value must be positive")
    private BigDecimal currentValue;

    private String imageUrl;
}

