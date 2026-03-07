package com.tokenapp.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Slf4j
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@tokenapp.com}")
    private String senderEmail;

    @Value("${app.name:TokenApp}")
    private String appName;

    /**
     * Token purchase confirmation email
     */
    public void sendTokenPurchaseConfirmation(String userEmail, String userName,
                                               String regionName, String shareName,
                                               Long tokenAmount, BigDecimal totalCost) {
        try {
            String subject = "Token Purchase Confirmed - " + appName;
            String body = String.format(
                    "Hello %s,\n\n" +
                    "Your token purchase has been completed successfully.\n\n" +
                    "Transaction Details:\n" +
                    "- Region: %s\n" +
                    "- Share: %s\n" +
                    "- Token Amount: %d\n" +
                    "- Total Amount: %.2f USD\n\n" +
                    "Your new tokens are now visible in your account.\n\n" +
                    "Happy investing,\n%s Team",
                    userName, regionName, shareName, tokenAmount, totalCost, appName
            );

            sendEmail(userEmail, subject, body);
            log.info("Purchase confirmation email sent to: {}", userEmail);
        } catch (Exception e) {
            log.warn("Failed to send purchase confirmation email to: {}", userEmail, e);
        }
    }

    /**
     * Token sale confirmation email
     */
    public void sendTokenSaleConfirmation(String userEmail, String userName,
                                          String regionName, String shareName,
                                          Long tokenAmount, BigDecimal refundAmount) {
        try {
            String subject = "Token Sale Confirmed - " + appName;
            String body = String.format(
                    "Hello %s,\n\n" +
                    "Your token sale has been completed successfully.\n\n" +
                    "Transaction Details:\n" +
                    "- Region: %s\n" +
                    "- Share: %s\n" +
                    "- Token Amount: %d\n" +
                    "- Refund Amount: %.2f USD\n\n" +
                    "The funds have been credited to your wallet.\n\n" +
                    "Thank you,\n%s Team",
                    userName, regionName, shareName, tokenAmount, refundAmount, appName
            );

            sendEmail(userEmail, subject, body);
            log.info("Sale confirmation email sent to: {}", userEmail);
        } catch (Exception e) {
            log.warn("Failed to send sale confirmation email to: {}", userEmail, e);
        }
    }

    /**
     * Deposit confirmation email
     */
    public void sendDepositConfirmation(String userEmail, String userName, BigDecimal amount) {
        try {
            String subject = "Deposit Confirmed - " + appName;
            String body = String.format(
                    "Hello %s,\n\n" +
                    "Your deposit has been successfully completed.\n\n" +
                    "Deposited Amount: %.2f USD\n\n" +
                    "You can now start purchasing tokens.\n\n" +
                    "Thank you,\n%s Team",
                    userName, amount, appName
            );

            sendEmail(userEmail, subject, body);
            log.info("Deposit confirmation email sent to: {}", userEmail);
        } catch (Exception e) {
            log.warn("Failed to send deposit confirmation email to: {}", userEmail, e);
        }
    }

    /**
     * Registration welcome email
     */
    public void sendRegistrationWelcomeEmail(String userEmail, String userName) {
        try {
            String subject = "Welcome to " + appName + "!";
            String body = String.format(
                    "Hello %s,\n\n" +
                    "Welcome to %s!\n\n" +
                    "Your account has been successfully created.\n" +
                    "You can now invest in regional shares and tokens.\n\n" +
                    "Getting Started:\n" +
                    "1. Deposit funds to your wallet\n" +
                    "2. Browse and purchase tokens for your desired region\n" +
                    "3. Track your investments\n\n" +
                    "If you have any questions, please contact our support team.\n\n" +
                    "Best regards,\n%s Team",
                    userName, appName, appName
            );

            sendEmail(userEmail, subject, body);
            log.info("Welcome email sent to: {}", userEmail);
        } catch (Exception e) {
            log.warn("Failed to send welcome email to: {}", userEmail, e);
        }
    }

    /**
     * Genel mail gönderimi
     */
    private void sendEmail(String to, String subject, String body) {
        try {
            if (mailSender == null) {
                log.info("[EMAIL SIMULATION] To: {}, Subject: {}", to, subject);
                log.info("[EMAIL BODY] {}", body);
                return;
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            log.warn("Error sending email to: {}, Error: {}", to, e.getMessage());
        }
    }
}

