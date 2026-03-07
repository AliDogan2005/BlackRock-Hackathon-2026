package com.tokenapp.service;

import com.tokenapp.dto.BuyTokenRequest;
import com.tokenapp.dto.CreateShareRequest;
import com.tokenapp.dto.ShareResponse;
import com.tokenapp.dto.UserTokenResponse;
import com.tokenapp.entity.Share;
import com.tokenapp.entity.Transaction;
import com.tokenapp.entity.User;
import com.tokenapp.entity.UserToken;
import com.tokenapp.entity.UserWallet;
import com.tokenapp.exception.BadRequestException;
import com.tokenapp.exception.DuplicateResourceException;
import com.tokenapp.exception.ResourceNotFoundException;
import com.tokenapp.repository.ShareRepository;
import com.tokenapp.repository.UserRepository;
import com.tokenapp.repository.UserTokenRepository;
import com.tokenapp.repository.UserWalletRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ShareService {

    @Autowired
    private ShareRepository shareRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserTokenRepository userTokenRepository;

    @Autowired
    private UserWalletRepository userWalletRepository;

    @Autowired
    private TransactionService transactionService;

    @Transactional
    public ShareResponse createShare(CreateShareRequest createShareRequest) {
        log.info("Creating new share: {}", createShareRequest.getName());

        if (shareRepository.existsByName(createShareRequest.getName())) {
            throw new DuplicateResourceException("Share with name already exists: " + createShareRequest.getName());
        }

        Share share = Share.builder()
                .name(createShareRequest.getName())
                .description(createShareRequest.getDescription())
                .totalTokens(createShareRequest.getTotalTokens())
                .currentValue(createShareRequest.getCurrentValue())
                .imageUrl(createShareRequest.getImageUrl())
                .isActive(true)
                .build();

        Share savedShare = shareRepository.save(share);
        log.info("Share created successfully with id: {}", savedShare.getId());

        return convertToShareResponse(savedShare);
    }

    public List<ShareResponse> getAllActiveShares() {
        log.info("Fetching all active shares");
        return shareRepository.findByIsActiveTrue()
                .stream()
                .map(this::convertToShareResponse)
                .collect(Collectors.toList());
    }

    public ShareResponse getShareById(Long shareId) {
        Share share = shareRepository.findById(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Share not found with id: " + shareId));
        return convertToShareResponse(share);
    }

    @Transactional
    public UserTokenResponse buyTokens(Long userId, BuyTokenRequest buyTokenRequest) {
        log.info("User {} attempting to buy {} tokens of share {}", userId, buyTokenRequest.getTokenAmount(), buyTokenRequest.getShareId());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Share share = shareRepository.findById(buyTokenRequest.getShareId())
                .orElseThrow(() -> new ResourceNotFoundException("Share not found with id: " + buyTokenRequest.getShareId()));

        if (!share.getIsActive()) {
            throw new BadRequestException("Share is not active");
        }

        if (buyTokenRequest.getTokenAmount() <= 0) {
            throw new BadRequestException("Token amount must be greater than 0");
        }

        // Calculate required amount
        BigDecimal requiredAmount = share.getCurrentValue()
                .multiply(BigDecimal.valueOf(buyTokenRequest.getTokenAmount()));

        // Get user wallet and check balance
        UserWallet wallet = userWalletRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found for user id: " + userId));

        if (wallet.getBalance().compareTo(requiredAmount) < 0) {
            throw new BadRequestException("Insufficient balance in wallet. Required: $" + requiredAmount +
                    ", Available: $" + wallet.getBalance());
        }

        // Deduct amount from wallet
        wallet.setBalance(wallet.getBalance().subtract(requiredAmount));
        userWalletRepository.save(wallet);
        log.info("Deducted ${} from user {} wallet", requiredAmount, userId);

        // Check if user already owns tokens of this share
        UserToken existingUserToken = userTokenRepository.findByUserIdAndShareId(userId, buyTokenRequest.getShareId()).orElse(null);

        UserToken userToken;
        if (existingUserToken != null) {
            // Add to existing tokens
            existingUserToken.setTokenAmount(existingUserToken.getTokenAmount() + buyTokenRequest.getTokenAmount());
            userToken = userTokenRepository.save(existingUserToken);
        } else {
            // Create new user token
            userToken = UserToken.builder()
                    .user(user)
                    .share(share)
                    .tokenAmount(buyTokenRequest.getTokenAmount())
                    .build();
            userToken = userTokenRepository.save(userToken);
        }

        // Calculate ownership percentage
        Long totalTokensForShare = userTokenRepository.countByShareId(share.getId());
        double ownershipPercentage = (userToken.getTokenAmount().doubleValue() / share.getTotalTokens()) * 100;
        userToken.setOwnershipPercentage(ownershipPercentage);
        userTokenRepository.save(userToken);

        // Record transaction
        transactionService.recordTokenTransaction(
                userId,
                Transaction.TransactionType.BUY,
                share.getId(),
                share.getName(),
                buyTokenRequest.getTokenAmount(),
                requiredAmount
        );

        log.info("User {} successfully bought {} tokens of share {} for ${}", userId, buyTokenRequest.getTokenAmount(), buyTokenRequest.getShareId(), requiredAmount);

        return convertToUserTokenResponse(userToken, share);
    }

    public List<UserTokenResponse> getUserTokens(Long userId) {
        log.info("Fetching tokens for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        return userTokenRepository.findByUserId(userId)
                .stream()
                .map(userToken -> convertToUserTokenResponse(userToken, userToken.getShare()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void sellTokens(Long userId, Long userTokenId, Long tokenAmountToSell) {
        log.info("User {} attempting to sell {} tokens", userId, tokenAmountToSell);

        UserToken userToken = userTokenRepository.findById(userTokenId)
                .orElseThrow(() -> new ResourceNotFoundException("User token not found with id: " + userTokenId));

        if (!userToken.getUser().getId().equals(userId)) {
            throw new BadRequestException("User does not own this token");
        }

        if (tokenAmountToSell <= 0) {
            throw new BadRequestException("Token amount must be greater than 0");
        }

        if (userToken.getTokenAmount() < tokenAmountToSell) {
            throw new BadRequestException("Insufficient tokens to sell");
        }

        // Calculate sale amount
        Share share = userToken.getShare();
        BigDecimal saleAmount = share.getCurrentValue()
                .multiply(BigDecimal.valueOf(tokenAmountToSell));

        // Record transaction BEFORE modifying token amount
        transactionService.recordTokenTransaction(
                userId,
                Transaction.TransactionType.SELL,
                share.getId(),
                share.getName(),
                tokenAmountToSell,
                saleAmount
        );

        // Reduce token amount
        userToken.setTokenAmount(userToken.getTokenAmount() - tokenAmountToSell);

        if (userToken.getTokenAmount() == 0) {
            // Delete user token if no tokens left
            userTokenRepository.delete(userToken);
            log.info("User token deleted as balance is 0");
        } else {
            // Update ownership percentage
            double ownershipPercentage = (userToken.getTokenAmount().doubleValue() / userToken.getShare().getTotalTokens()) * 100;
            userToken.setOwnershipPercentage(ownershipPercentage);
            userTokenRepository.save(userToken);
        }

        log.info("User {} successfully sold {} tokens for ${}", userId, tokenAmountToSell, saleAmount);
    }

    @Transactional
    public void updateShareValue(Long shareId, BigDecimal newValue) {
        log.info("Updating share {} value to {}", shareId, newValue);

        Share share = shareRepository.findById(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Share not found with id: " + shareId));

        share.setCurrentValue(newValue);
        shareRepository.save(share);
        log.info("Share {} value updated successfully", shareId);
    }

    // Helper methods
    private ShareResponse convertToShareResponse(Share share) {
        Long totalOwnedTokens = userTokenRepository.countByShareId(share.getId());
        Long availableTokens = share.getTotalTokens() - totalOwnedTokens;
        double totalOwnershipPercentage = (totalOwnedTokens.doubleValue() / share.getTotalTokens()) * 100;

        return ShareResponse.builder()
                .id(share.getId())
                .name(share.getName())
                .description(share.getDescription())
                .totalTokens(share.getTotalTokens())
                .currentValue(share.getCurrentValue())
                .imageUrl(share.getImageUrl())
                .isActive(share.getIsActive())
                .availableTokens(availableTokens)
                .totalOwnershipPercentage(totalOwnershipPercentage)
                .build();
    }

    private UserTokenResponse convertToUserTokenResponse(UserToken userToken, Share share) {
        return UserTokenResponse.builder()
                .id(userToken.getId())
                .userId(userToken.getUser().getId())
                .shareId(share.getId())
                .shareName(share.getName())
                .tokenAmount(userToken.getTokenAmount())
                .ownershipPercentage(userToken.getOwnershipPercentage())
                .currentValue(share.getCurrentValue())
                .purchasedAt(userToken.getPurchasedAt())
                .build();
    }
}

