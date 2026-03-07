package com.tokenapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioProfitLossResponse {
    private BigDecimal totalProfitLoss;        // Total profit/loss across all tokens
    private Double totalProfitLossPercentage;  // Overall return percentage
    private List<ProfitLossResponse> profitLossByShare;  // Breakdown by each share
}


