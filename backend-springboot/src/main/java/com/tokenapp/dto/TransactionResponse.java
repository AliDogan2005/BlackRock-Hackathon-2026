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
public class TransactionResponse {

    private Long id;
    private String type;  // BUY, SELL, DEPOSIT, WITHDRAWAL
    private String shareName;  // null for DEPOSIT/WITHDRAWAL
    private Long tokenAmount;  // null for DEPOSIT/WITHDRAWAL
    private BigDecimal amount;
    private LocalDateTime transactionDate;
    private String description;
    private String status;  // COMPLETED, PENDING, FAILED
}

