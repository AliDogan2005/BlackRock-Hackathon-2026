package com.tokenapp.service;

import com.tokenapp.dto.NewsItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class NewsService {

    // Python'dan news.json'ı al (zaten AI analysis içine dahil)
    private static final String PYTHON_NEWS_API = "http://localhost:8000/api/news";

    @Autowired
    private RestTemplate restTemplate;

    /**
     * Python'dan tüm haberleri al
     * Her haberde zaten ai_comment (Python'un OpenAI ile yaptığı analiz) var!
     */
    public List<Map<String, Object>> getAllNews() {
        try {
            log.info("Fetching news from Python API: {}", PYTHON_NEWS_API);

            // Python API'den response al
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                PYTHON_NEWS_API,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("items")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> items = (List<Map<String, Object>>) responseBody.get("items");
                log.info("Successfully fetched {} news items from Python (with AI analysis)", items.size());

                // Her item'de var:
                // - title
                // - description
                // - ai_comment (Python'un OpenAI ile yaptığı analiz!) ← BU ÖNEMLI
                // - timestamp

                return items;
            }

            log.warn("No items found in Python response");
            return List.of();

        } catch (Exception e) {
            log.error("Error fetching news from Python API", e);
            throw new RuntimeException("Failed to fetch news: " + e.getMessage());
        }
    }
}

