package com.tokenapp.controller;

import com.tokenapp.dto.BuyTokenRequest;
import com.tokenapp.dto.CreateShareRequest;
import com.tokenapp.dto.ShareResponse;
import com.tokenapp.dto.UserTokenResponse;
import com.tokenapp.security.JwtTokenProvider;
import com.tokenapp.service.ShareService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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

    // Helper method to get current user ID from JWT token
    private Long getCurrentUserId() {
        String token = getJwtFromRequest();

        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            log.info("Extracted userId from JWT: {}", userId);
            return userId;
        }

        throw new RuntimeException("Invalid or missing JWT token");
    }

    private String getJwtFromRequest() {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

