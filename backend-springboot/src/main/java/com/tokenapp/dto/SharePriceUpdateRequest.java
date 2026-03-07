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
public class SharePriceUpdateRequest {

    private String neighborhood;
    private String city;
    private String state;
    private BigDecimal currentPrice;
    private BigDecimal previousPrice;
    private Double localNewsScore;
    private Double recentMomentumScore;
    private Double confidenceScore;
    private String priceAction; // "increase", "decrease", "stable"
    private BigDecimal estimatedAvgHomePrice;
    private List<String> signals;
}

