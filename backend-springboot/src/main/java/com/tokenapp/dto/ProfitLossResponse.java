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
public class ProfitLossResponse {
    private Long shareId;
    private String shareName;
    private BigDecimal profitLoss;         // Current value - Total spent (can be negative)
    private Double profitLossPercentage;   // (Profit/Loss) / Total spent * 100
}


