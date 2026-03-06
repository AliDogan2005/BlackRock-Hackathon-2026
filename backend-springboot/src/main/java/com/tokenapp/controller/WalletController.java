package com.tokenapp.controller;

import com.tokenapp.dto.WalletBalanceResponse;
import com.tokenapp.dto.DepositRequest;
import com.tokenapp.service.WalletService;
import com.tokenapp.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/wallet")
public class WalletController {

    @Autowired
    private WalletService walletService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private HttpServletRequest request;

    /**
     * Bakiye göster
     * GET /api/wallet/balance
     */
    @GetMapping("/balance")
    public ResponseEntity<?> getBalance() {
        log.info("Get wallet balance request");

        try {
            Long userId = getCurrentUserId();
            WalletBalanceResponse balance = walletService.getBalance(userId);

            return new ResponseEntity<>(balance, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error fetching wallet balance", e);

            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());

            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Para yükle (Deposit)
     * POST /api/wallet/deposit
     * Body: {"amount": 100.00, "paymentMethod": "MOCK"}
     */
    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@Valid @RequestBody DepositRequest depositRequest) {
        log.info("Deposit request: {} USD via {}", depositRequest.getAmount(), depositRequest.getPaymentMethod());

        try {
            Long userId = getCurrentUserId();

            // Default payment method
            if (depositRequest.getPaymentMethod() == null) {
                depositRequest.setPaymentMethod("MOCK");
            }

            WalletBalanceResponse result = walletService.deposit(userId, depositRequest);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Deposit successful");
            response.put("data", result);

            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error processing deposit", e);

            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());

            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * JWT token'dan user ID'yi çıkar
     */
    private Long getCurrentUserId() {
        String token = getJwtFromRequest();

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            return jwtTokenProvider.getUserIdFromToken(token);
        }

        throw new RuntimeException("Invalid or missing JWT token");
    }

    /**
     * Authorization header'dan JWT al
     */
    private String getJwtFromRequest() {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

