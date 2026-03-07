package com.tokenapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AffectedShare {
    private String symbol;
    private String impact;
    private Double score;
}

