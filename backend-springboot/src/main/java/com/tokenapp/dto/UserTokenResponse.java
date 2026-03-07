package com.tokenapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTokenResponse {
    private Long id;
    private Long userId;
    private Long shareId;
    private String shareName;
    private Long tokenAmount;
    private Double ownershipPercentage;
    private BigDecimal currentValue;
    private LocalDateTime purchasedAt;
}

