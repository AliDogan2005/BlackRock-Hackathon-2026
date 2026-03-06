package com.tokenapp.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BuyTokenRequest {

    @NotNull(message = "Share ID is required")
    private Long shareId;

    @NotNull(message = "Token amount is required")
    @Positive(message = "Token amount must be positive")
    private Long tokenAmount;
}

