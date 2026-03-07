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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
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

    private static final DateTimeFormatter HISTORY_DATE_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

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

    public List<AssetHistoryPointResponse> getHistoricalTokenData(String regionId) {
        Share share = resolveShareForHistory(regionId)
                .orElseThrow(() -> new ResourceNotFoundException("No active share found for region: " + regionId));

        return buildHistorySeries(share);
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

    @Transactional
    public void addFavorite(Long userId, Long shareId) {
        log.info("Adding share {} to favorites for user {}", shareId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Share share = shareRepository.findById(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Share not found with id: " + shareId));

        if (user.getFavoriteShares() == null) {
            user.setFavoriteShares(new java.util.HashSet<>());
        }

        // Idempotent add: if already favorited, do not fail.
        boolean added = user.getFavoriteShares().add(share);
        if (!added) {
            log.info("Share {} is already in favorites for user {}", shareId, userId);
            return;
        }

        userRepository.save(user);
        log.info("Share {} added to favorites for user {}", shareId, userId);
    }

    @Transactional
    public void removeFavorite(Long userId, Long shareId) {
        log.info("Removing share {} from favorites for user {}", shareId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Share share = shareRepository.findById(shareId)
                .orElseThrow(() -> new ResourceNotFoundException("Share not found with id: " + shareId));

        if (user.getFavoriteShares() == null) {
            log.info("Favorites list is empty for user {}, nothing to remove", userId);
            return;
        }

        // Check if share is in favorites by comparing IDs instead of using contains()
        boolean found = user.getFavoriteShares().removeIf(s -> s.getId().equals(shareId));

        if (!found) {
            log.info("Share {} was not in favorites for user {}", shareId, userId);
            return;
        }

        userRepository.save(user);
        log.info("Share {} removed from favorites for user {}", shareId, userId);
    }

    @Transactional(readOnly = true)
    public List<ShareResponse> getUserFavoriteShares(Long userId) {
        log.info("Fetching favorite shares for user {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        java.util.Set<Share> favorites = user.getFavoriteShares() == null
            ? java.util.Collections.emptySet()
            : user.getFavoriteShares();

        return favorites.stream()
                .map(this::convertToShareResponse)
                .collect(Collectors.toList());
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

    @Transactional
    public java.util.Map<String, Object> syncSharesFromPricesData(java.util.Map<String, Object> pricesData) {
        log.info("Syncing shares from prices data");

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        int synced = 0;
        int created = 0;

        if (pricesData == null || pricesData.isEmpty()) {
            log.warn("No prices data provided for sync");
            result.put("synced", 0);
            result.put("created", 0);
            result.put("message", "No data to sync");
            return result;
        }

        for (java.util.Map.Entry<String, Object> entry : pricesData.entrySet()) {
            String shareName = entry.getKey();
            Object priceData = entry.getValue();

            if (priceData instanceof java.util.Map) {
                java.util.Map<String, Object> priceMap = (java.util.Map<String, Object>) priceData;

                try {
                    BigDecimal price = new BigDecimal(priceMap.getOrDefault("price", "0").toString());

                    Share existingShare = shareRepository.findByName(shareName).orElse(null);

                    if (existingShare != null) {
                        // Update existing share
                        existingShare.setCurrentValue(price);
                        shareRepository.save(existingShare);
                        synced++;
                        log.info("Updated share: {} with price: {}", shareName, price);
                    } else {
                        // Create new share (only if it doesn't exist)
                        Share newShare = Share.builder()
                                .name(shareName)
                                .description("Auto-synced from prices data")
                                .totalTokens(1000L)
                                .currentValue(price)
                                .isActive(true)
                                .build();
                        shareRepository.save(newShare);
                        created++;
                        log.info("Created new share: {} with price: {}", shareName, price);
                    }
                } catch (Exception e) {
                    log.error("Error processing share {}: {}", shareName, e.getMessage());
                }
            }
        }

        result.put("synced", synced);
        result.put("created", created);
        result.put("message", "Successfully synced " + synced + " shares and created " + created + " new shares");
        return result;
    }
}

