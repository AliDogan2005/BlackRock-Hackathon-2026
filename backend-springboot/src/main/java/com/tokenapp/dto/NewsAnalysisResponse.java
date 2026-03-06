package com.tokenapp.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsAnalysisResponse {
    private String status;
    private String text;
    private String ai_comment;
    private List<AffectedShare> affected_shares;
    private String timestamp;
}

