package com.tokenapp.controller;

import com.tokenapp.dto.NewsAnalysisRequest;
import com.tokenapp.dto.NewsAnalysisResponse;
import com.tokenapp.service.NewsAnalysisService;
import com.tokenapp.service.NewsService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/news")
public class NewsAnalysisController {

    @Autowired
    private NewsAnalysisService newsAnalysisService;

    @Autowired
    private NewsService newsService;

    /**
     * Python'dan tüm haberler al (zaten AI analysis'leri yapılmış)
     * Her haber: title, description, ai_comment (Python'un OpenAI analizi), timestamp
     */
    @GetMapping("/all")
    public ResponseEntity<?> getAllNews() {
        log.info("Get all news request received");

        try {
            List<Map<String, Object>> newsList = newsService.getAllNews();

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("count", newsList.size());
            response.put("items", newsList);

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching news", e);

            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());

            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Manuel olarak bir haberi analiz et (zaten Python'da yapılmışsa bu gerekli değil)
     * Ama test için bırakıyoruz
     */
    @PostMapping("/analyze")
    public ResponseEntity<?> analyzeNews(@Valid @RequestBody NewsAnalysisRequest request) {
        log.info("News analysis request received: {}", request.getText().substring(0, Math.min(50, request.getText().length())));

        try {
            NewsAnalysisResponse response = newsAnalysisService.analyzeNews(request.getText());

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error analyzing news", e);

            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());

            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}

