package com.tokenapp.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/regions")
public class RegionController {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${python.api.url:http://localhost:8000}")
    private String pythonApiUrl;

    /**
     * Get Chicago neighborhoods from Python API
     */
    @GetMapping("/chicago/neighborhoods")
    public ResponseEntity<Map<String, Object>> getChicagoNeighborhoods() {
        log.info("Fetching Chicago neighborhoods from Python API");

        try {
            String pythonEndpoint = pythonApiUrl + "/api/chicago-neighborhoods";
            log.info("Calling Python API: {}", pythonEndpoint);

            ResponseEntity<Map> response = restTemplate.getForEntity(pythonEndpoint, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> data = response.getBody();
                log.info("Successfully fetched Chicago neighborhoods: {} neighborhoods, {} areas",
                        data.get("total_neighborhoods"),
                        data.get("total_areas"));
                return ResponseEntity.ok(data);
            }

            log.warn("Python API returned non-2xx status: {}", response.getStatusCode());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to fetch neighborhoods");
            return ResponseEntity.status(response.getStatusCode()).body(errorResponse);

        } catch (Exception e) {
            log.error("Error fetching Chicago neighborhoods: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Get Chicago news with impact analysis from Python API
     */
    @GetMapping("/chicago/news")
    public ResponseEntity<Map<String, Object>> getChicagoNews(
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String riskLevel) {
        log.info("Fetching Chicago news from Python API - topic: {}, riskLevel: {}", topic, riskLevel);

        try {
            String pythonEndpoint = pythonApiUrl + "/api/chicago-news";

            // Build URL with query parameters if provided
            if (topic != null || riskLevel != null) {
                StringBuilder urlBuilder = new StringBuilder(pythonEndpoint).append("?");
                if (topic != null) {
                    urlBuilder.append("topic=").append(topic);
                }
                if (riskLevel != null) {
                    if (topic != null) urlBuilder.append("&");
                    urlBuilder.append("risk_level=").append(riskLevel);
                }
                pythonEndpoint = urlBuilder.toString();
            }

            log.info("Calling Python API: {}", pythonEndpoint);

            ResponseEntity<Map> response = restTemplate.getForEntity(pythonEndpoint, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> data = response.getBody();
                log.info("Successfully fetched Chicago news: {} total items, {} filtered",
                        data.get("total_items"),
                        data.get("filtered_items"));
                return ResponseEntity.ok(data);
            }

            log.warn("Python API returned non-2xx status: {}", response.getStatusCode());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to fetch news");
            return ResponseEntity.status(response.getStatusCode()).body(errorResponse);

        } catch (Exception e) {
            log.error("Error fetching Chicago news: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Get Chicago news by specific neighborhood
     */
    @GetMapping("/chicago/news/neighborhood/{neighborhood}")
    public ResponseEntity<Map<String, Object>> getChicagoNewsByNeighborhood(
            @PathVariable String neighborhood) {
        log.info("Fetching Chicago news for neighborhood: {}", neighborhood);

        try {
            String pythonEndpoint = pythonApiUrl + "/api/chicago-news";
            ResponseEntity<Map> response = restTemplate.getForEntity(pythonEndpoint, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> data = response.getBody();

                // Filter items by neighborhood
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> allItems =
                    (java.util.List<Map<String, Object>>) data.get("items");

                java.util.List<Map<String, Object>> filteredItems = new java.util.ArrayList<>();
                if (allItems != null) {
                    for (Map<String, Object> item : allItems) {
                        @SuppressWarnings("unchecked")
                        java.util.List<String> neighborhoods =
                            (java.util.List<String>) item.get("expected_growth_neighborhoods");
                        if (neighborhoods != null && neighborhoods.contains(neighborhood)) {
                            filteredItems.add(item);
                        }
                    }
                }

                Map<String, Object> result = new HashMap<>();
                result.put("status", "success");
                result.put("neighborhood", neighborhood);
                result.put("total_items", filteredItems.size());
                result.put("items", filteredItems);
                return ResponseEntity.ok(result);
            }

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "Failed to fetch news");
            return ResponseEntity.status(response.getStatusCode()).body(errorResponse);

        } catch (Exception e) {
            log.error("Error fetching Chicago news for neighborhood: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    /**
     * Health check for Python API connection
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        log.info("Health check for Python API connection");
        try {
            String pythonNewsEndpoint = pythonApiUrl + "/api/news";
            restTemplate.getForEntity(pythonNewsEndpoint, Map.class);

            Map<String, String> response = new HashMap<>();
            response.put("status", "ok");
            response.put("python_api", "connected");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("Python API unreachable: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("python_api", "disconnected");
            response.put("error", e.getMessage());
            return ResponseEntity.status(503).body(response);
        }
    }
}
