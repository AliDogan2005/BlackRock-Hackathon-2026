package com.tokenapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewsItem {
    private String title;
    private String description;
    private String ai_comment;
    private String timestamp;
}

