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
public class AssetHistoryPointResponse {
    private String date;
    private BigDecimal price;
    private Integer riskScore;
    private Boolean hasNews;
    private String headline;
}
