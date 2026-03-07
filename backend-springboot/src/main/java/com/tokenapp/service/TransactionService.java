package com.tokenapp.service;

import com.tokenapp.dto.TransactionResponse;
import com.tokenapp.entity.Share;
import com.tokenapp.entity.Transaction;
import com.tokenapp.entity.User;
import com.tokenapp.exception.ResourceNotFoundException;
import com.tokenapp.repository.ShareRepository;
import com.tokenapp.repository.TransactionRepository;
import com.tokenapp.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShareRepository shareRepository;

    @Transactional
    public void recordTransaction(Long userId, Transaction.TransactionType type, String shareName,
                                 Long tokenAmount, BigDecimal amount, String description) {
        log.info("Recording transaction for user {}: {} - {}", userId, type, description);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Transaction transaction = Transaction.builder()
                .user(user)
                .type(type)
                .tokenAmount(tokenAmount)
                .amount(amount)
                .description(description)
                .status(Transaction.TransactionStatus.COMPLETED)
                .build();

        transactionRepository.save(transaction);
        log.info("Transaction recorded successfully");
    }

    @Transactional
    public void recordTokenTransaction(Long userId, Transaction.TransactionType type, Long shareId,
                                      String shareName, Long tokenAmount, BigDecimal amount) {
        String description = type == Transaction.TransactionType.BUY
            ? "Bought " + tokenAmount + " tokens of " + shareName
            : "Sold " + tokenAmount + " tokens of " + shareName;

        // Fetch the Share entity if shareId is provided
        Share share = null;
        if (shareId != null) {
            share = shareRepository.findById(shareId)
                    .orElseThrow(() -> new ResourceNotFoundException("Share not found with id: " + shareId));
        }

        // Record transaction with Share relationship
        recordTransactionWithShare(userId, type, tokenAmount, amount, description, share);
    }

    @Transactional
    private void recordTransactionWithShare(Long userId, Transaction.TransactionType type,
                                           Long tokenAmount, BigDecimal amount, String description, Share share) {
        log.info("Recording transaction for user {}: {} - {}", userId, type, description);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Transaction transaction = Transaction.builder()
                .user(user)
                .type(type)
                .share(share)  // Link the Share entity
                .tokenAmount(tokenAmount)
                .amount(amount)
                .description(description)
                .status(Transaction.TransactionStatus.COMPLETED)
                .build();

        transactionRepository.save(transaction);
        log.info("Transaction recorded successfully for user {} with share {}", userId, share != null ? share.getId() : "NONE");
    }

    public List<TransactionResponse> getUserTransactions(Long userId) {
        log.info("Fetching transactions for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return transactionRepository.findByUserIdOrderByTransactionDateDesc(userId)
                .stream()
                .map(this::convertToTransactionResponse)
                .collect(Collectors.toList());
    }

    public List<TransactionResponse> getUserTransactionsByType(Long userId, String type) {
        log.info("Fetching {} transactions for user: {}", type, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        try {
            Transaction.TransactionType transactionType = Transaction.TransactionType.valueOf(type.toUpperCase());
            return transactionRepository.findByUserIdAndTypeOrderByTransactionDateDesc(userId, transactionType)
                    .stream()
                    .map(this::convertToTransactionResponse)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid transaction type: " + type);
        }
    }

    private TransactionResponse convertToTransactionResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .type(transaction.getType().toString())
                .shareName(transaction.getShare() != null ? transaction.getShare().getName() : null)
                .tokenAmount(transaction.getTokenAmount())
                .amount(transaction.getAmount())
                .transactionDate(transaction.getTransactionDate())
                .description(transaction.getDescription())
                .status(transaction.getStatus().toString())
                .build();
    }
}

