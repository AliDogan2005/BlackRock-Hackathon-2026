package com.tokenapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WalletBalanceResponse {
    private Long userId;
    private BigDecimal balance;
    private String currency;  // "USD"
}

