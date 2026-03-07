package com.tokenapp.service;

import com.tokenapp.entity.User;
import com.tokenapp.entity.UserWallet;
import com.tokenapp.entity.Transaction;
import com.tokenapp.dto.WalletBalanceResponse;
import com.tokenapp.dto.DepositRequest;
import com.tokenapp.repository.UserRepository;
import com.tokenapp.repository.UserWalletRepository;
import com.tokenapp.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Slf4j
@Service
public class WalletService {

    @Autowired
    private UserWalletRepository userWalletRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionService transactionService;

    /**
     * Kullanıcı bakiyesini getir
     */
    public WalletBalanceResponse getBalance(Long userId) {
        log.info("Fetching wallet balance for user: {}", userId);

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserWallet wallet = userWalletRepository.findByUserId(userId)
            .orElseGet(() -> createWalletForUser(user));

        return new WalletBalanceResponse(
            userId,
            wallet.getBalance(),
            "USD"
        );
    }

    /**
     * Bakiyeye para ekle (Deposit)
     * MOCK payment: Direkt bakiye eklenir
     * REAL payment: Payment gateway'e yönlendirilir
     */
    @Transactional
    public WalletBalanceResponse deposit(Long userId, DepositRequest request) {
        log.info("Deposit request for user {}: {} USD via {}",
            userId, request.getAmount(), request.getPaymentMethod());

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserWallet wallet = userWalletRepository.findByUserId(userId)
            .orElseGet(() -> createWalletForUser(user));

        // Mock payment: Direkt ekle
        if ("MOCK".equalsIgnoreCase(request.getPaymentMethod())) {
            wallet.addBalance(request.getAmount());
            userWalletRepository.save(wallet);

            transactionService.recordTransaction(
                userId,
                Transaction.TransactionType.DEPOSIT,
                null,
                0L,
                request.getAmount(),
                "Deposited funds into wallet"
            );

            log.info("Deposit successful. New balance: {} USD", wallet.getBalance());

            return new WalletBalanceResponse(
                userId,
                wallet.getBalance(),
                "USD"
            );
        }

        // Real payment: Stripe/PayPal vs.
        // TODO: Implement real payment gateway
        throw new RuntimeException("Payment method not implemented yet: " + request.getPaymentMethod());
    }

    /**
     * Bakiyeden para çıkar (Token satın alırken kullanılacak)
     */
    @Transactional
    public void deductBalance(Long userId, BigDecimal amount) {
        log.info("Deducting {} USD from user {}", amount, userId);

        UserWallet wallet = userWalletRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User wallet not found"));

        wallet.deductBalance(amount);
        userWalletRepository.save(wallet);
    }

    /**
     * Bakiyeye para ekle (sistem tarafından)
     */
    @Transactional
    public void addBalance(Long userId, BigDecimal amount) {
        log.info("Adding {} USD to user {}", amount, userId);

        UserWallet wallet = userWalletRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User wallet not found"));

        wallet.addBalance(amount);
        userWalletRepository.save(wallet);
    }

    /**
     * Yeterli bakiye var mı kontrol et
     */
    public boolean hasBalance(Long userId, BigDecimal amount) {
        UserWallet wallet = userWalletRepository.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User wallet not found"));

        return wallet.hasBalance(amount);
    }

    /**
     * Yeni kullanıcı için wallet oluştur
     */
    private UserWallet createWalletForUser(User user) {
        log.info("Creating wallet for user: {}", user.getId());

        UserWallet wallet = UserWallet.builder()
            .user(user)
            .balance(BigDecimal.ZERO)
            .build();

        return userWalletRepository.save(wallet);
    }
}

