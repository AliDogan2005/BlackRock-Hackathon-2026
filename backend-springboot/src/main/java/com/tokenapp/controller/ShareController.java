package com.tokenapp.controller;

import com.tokenapp.dto.BuyTokenRequest;
import com.tokenapp.dto.ShareResponse;
import com.tokenapp.dto.UserTokenResponse;
import com.tokenapp.exception.BadRequestException;
import com.tokenapp.security.JwtTokenProvider;
import com.tokenapp.service.ShareService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/shares")
public class ShareController {

    @Autowired
    private ShareService shareService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private HttpServletRequest request;

    @GetMapping
    public ResponseEntity<List<ShareResponse>> getAllShares() {
        log.info("Get all shares request");
        List<ShareResponse> shares = shareService.getAllActiveShares();
        return ResponseEntity.ok(shares);
    }

    @GetMapping("/{shareId}")
    public ResponseEntity<ShareResponse> getShareById(@PathVariable Long shareId) {
        log.info("Get share request for id: {}", shareId);
        ShareResponse share = shareService.getShareById(shareId);
        return ResponseEntity.ok(share);
    }

    @PostMapping("/{shareId}/buy")
    public ResponseEntity<Map<String, Object>> buyTokens(
            @PathVariable Long shareId,
            @Valid @RequestBody BuyTokenRequest buyTokenRequest) {
        log.info("Buy token request for share: {}", shareId);

        // Get current user ID from JWT token
        Long userId = getCurrentUserId();

        UserTokenResponse userToken = shareService.buyTokens(userId, buyTokenRequest);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Tokens purchased successfully");
        response.put("data", userToken);

        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/user/my-tokens")
    public ResponseEntity<List<UserTokenResponse>> getUserTokens() {
        log.info("Get user tokens request");
        Long userId = getCurrentUserId();
        List<UserTokenResponse> userTokens = shareService.getUserTokens(userId);
        return ResponseEntity.ok(userTokens);
    }

    @DeleteMapping("/tokens/{userTokenId}/sell")
    public ResponseEntity<Map<String, String>> sellTokens(
            @PathVariable Long userTokenId,
            @RequestParam Long tokenAmount) {
        log.info("Sell token request for token id: {}", userTokenId);

        Long userId = getCurrentUserId();
        shareService.sellTokens(userId, userTokenId, tokenAmount);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Tokens sold successfully");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{shareId}/favorite")
    public ResponseEntity<Map<String, String>> addShareToFavorites(@PathVariable Long shareId) {
        log.info("Add share {} to favorites", shareId);
        Long userId = getCurrentUserId();
        shareService.addFavorite(userId, shareId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Share added to favorites successfully");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{shareId}/favorite")
    public ResponseEntity<Map<String, String>> removeShareFromFavorites(@PathVariable Long shareId) {
        log.info("Remove share {} from favorites", shareId);
        Long userId = getCurrentUserId();
        shareService.removeFavorite(userId, shareId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Share removed from favorites successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/favorites")
    public ResponseEntity<List<ShareResponse>> getUserFavoriteShares() {
        log.info("Get user favorite shares");
        Long userId = getCurrentUserId();
        List<ShareResponse> favoriteShares = shareService.getUserFavoriteShares(userId);
        return ResponseEntity.ok(favoriteShares);
    }

    // ...existing code...
    private Long getCurrentUserId() {
        String token = getJwtFromRequest();

        if (!StringUtils.hasText(token)) {
            throw new BadRequestException("Authorization token is missing");
        }

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            log.info("Extracted userId from JWT: {}", userId);
            return userId;
        }

        throw new BadRequestException("Invalid or expired JWT token");
    }


    /**
     * Initialize or sync shares from prices data
     * POST /api/shares/sync/from-prices
     * Body: prices_output.json content
     */
    @PostMapping("/sync/from-prices")
    public ResponseEntity<Map<String, Object>> syncSharesFromPrices(
            @RequestBody Map<String, Object> pricesData) {
        log.info("Syncing shares from prices data");

        try {
            Map<String, Object> result = shareService.syncSharesFromPricesData(pricesData);

            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("data", result);

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error syncing shares from prices: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("status", "error");
            error.put("message", e.getMessage());
            return ResponseEntity.status(500).body((Map<String, Object>)(Object)error);
        }
    }

    private String getJwtFromRequest() {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

