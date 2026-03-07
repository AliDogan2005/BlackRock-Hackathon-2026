package com.tokenapp.controller;

import com.tokenapp.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/email")
public class EmailController {

    @Autowired
    private EmailService emailService;

    /**
     * Send token purchase confirmation email
     */
    @PostMapping("/send-purchase-confirmation")
    public ResponseEntity<Map<String, String>> sendPurchaseConfirmation(
            @RequestParam String userEmail,
            @RequestParam String userName,
            @RequestParam String regionName,
            @RequestParam String shareName,
            @RequestParam Long tokenAmount,
            @RequestParam BigDecimal totalCost) {

        log.info("Sending purchase confirmation email to: {}", userEmail);

        try {
            emailService.sendTokenPurchaseConfirmation(
                    userEmail, userName, regionName, shareName, tokenAmount, totalCost
            );

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Purchase confirmation email sent to " + userEmail);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error sending purchase confirmation email: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Send token sale confirmation email
     */
    @PostMapping("/send-sale-confirmation")
    public ResponseEntity<Map<String, String>> sendSaleConfirmation(
            @RequestParam String userEmail,
            @RequestParam String userName,
            @RequestParam String regionName,
            @RequestParam String shareName,
            @RequestParam Long tokenAmount,
            @RequestParam BigDecimal refundAmount) {

        log.info("Sending sale confirmation email to: {}", userEmail);

        try {
            emailService.sendTokenSaleConfirmation(
                    userEmail, userName, regionName, shareName, tokenAmount, refundAmount
            );

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Sale confirmation email sent to " + userEmail);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error sending sale confirmation email: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Send deposit confirmation email
     */
    @PostMapping("/send-deposit-confirmation")
    public ResponseEntity<Map<String, String>> sendDepositConfirmation(
            @RequestParam String userEmail,
            @RequestParam String userName,
            @RequestParam BigDecimal amount) {

        log.info("Sending deposit confirmation email to: {}", userEmail);

        try {
            emailService.sendDepositConfirmation(userEmail, userName, amount);

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Deposit confirmation email sent to " + userEmail);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error sending deposit confirmation email: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Send registration welcome email
     */
    @PostMapping("/send-welcome")
    public ResponseEntity<Map<String, String>> sendWelcomeEmail(
            @RequestParam String userEmail,
            @RequestParam String userName) {

        log.info("Sending welcome email to: {}", userEmail);

        try {
            emailService.sendRegistrationWelcomeEmail(userEmail, userName);

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Welcome email sent to " + userEmail);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error sending welcome email: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Test email endpoint
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testEmail() {
        log.info("Testing email service");

        try {
            // Test the email service by sending to yourself or a test email
            String testEmail = "test@example.com";
            String testName = "Test User";

            emailService.sendRegistrationWelcomeEmail(testEmail, testName);

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Test email sent to " + testEmail);
            response.put("note", "Check console logs or email inbox for test message");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in test email: {}", e.getMessage());
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}

