package com.tokenapp.service;

import com.tokenapp.dto.NewsAnalysisRequest;
import com.tokenapp.dto.NewsAnalysisResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
public class NewsAnalysisService {

    private static final String PYTHON_API_URL = "http://localhost:8000/api/analyze-news";

    @Autowired
    private RestTemplate restTemplate;

    public NewsAnalysisResponse analyzeNews(String newsText) {
        try {
            NewsAnalysisRequest request = new NewsAnalysisRequest(newsText);

            log.info("Calling Python API for news analysis: {}", newsText.substring(0, Math.min(50, newsText.length())));

            NewsAnalysisResponse response = restTemplate.postForObject(
                PYTHON_API_URL,
                request,
                NewsAnalysisResponse.class
            );

            log.info("Python API response received: {} affected shares",
                response.getAffected_shares() != null ? response.getAffected_shares().size() : 0);

            return response;
        } catch (Exception e) {
            log.error("Error calling Python API", e);
            throw new RuntimeException("News analysis failed: " + e.getMessage());
        }
    }
}

