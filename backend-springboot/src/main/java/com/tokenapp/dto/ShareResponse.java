package com.tokenapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShareResponse {
    private Long id;
    private String name;
    private String description;
    private Long totalTokens;
    private BigDecimal currentValue;
    private String imageUrl;
    private Boolean isActive;
    private Long availableTokens;
    private Double totalOwnershipPercentage;
}

