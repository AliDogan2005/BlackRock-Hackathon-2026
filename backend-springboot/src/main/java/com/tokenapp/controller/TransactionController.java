package com.tokenapp.controller;

import com.tokenapp.dto.TransactionResponse;
import com.tokenapp.exception.BadRequestException;
import com.tokenapp.security.JwtTokenProvider;
import com.tokenapp.service.TransactionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private HttpServletRequest request;

    @GetMapping("/my-history")
    public ResponseEntity<List<TransactionResponse>> getMyTransactionHistory() {
        log.info("Get user transaction history request");
        Long userId = getCurrentUserId();
        log.info("Fetching transaction history for user: {}", userId);
        List<TransactionResponse> transactions = transactionService.getUserTransactions(userId);
        log.info("Found {} transactions for user {}", transactions.size(), userId);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/my-history/{type}")
    public ResponseEntity<List<TransactionResponse>> getMyTransactionHistoryByType(@PathVariable String type) {
        log.info("Get user transaction history by type: {}", type);
        Long userId = getCurrentUserId();
        List<TransactionResponse> transactions = transactionService.getUserTransactionsByType(userId, type);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TransactionResponse>> getUserTransactionHistory(@PathVariable Long userId) {
        log.info("Get user transaction history for userId: {}", userId);
        List<TransactionResponse> transactions = transactionService.getUserTransactions(userId);
        return ResponseEntity.ok(transactions);
    }

    // Helper method to get current user ID from JWT token
    private Long getCurrentUserId() {
        String token = getJwtFromRequest();

        log.debug("Token from request: {}", token != null ? "Token exists" : "Token is null");

        if (!StringUtils.hasText(token)) {
            log.error("No authorization token found in request");
            throw new BadRequestException("Authorization token is missing");
        }

        if (!jwtTokenProvider.validateToken(token)) {
            log.error("JWT token validation failed");
            throw new BadRequestException("Invalid or expired JWT token");
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        log.info("Extracted userId from JWT: {}", userId);
        return userId;
    }

    private String getJwtFromRequest() {
        String bearerToken = request.getHeader("Authorization");
        log.debug("Authorization header: {}", bearerToken != null ? "Present" : "Missing");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

