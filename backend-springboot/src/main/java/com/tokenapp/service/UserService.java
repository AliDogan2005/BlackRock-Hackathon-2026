package com.tokenapp.service;

import com.tokenapp.dto.UserTokenResponse;
import com.tokenapp.entity.User;
import com.tokenapp.exception.ResourceNotFoundException;
import com.tokenapp.repository.UserRepository;
import com.tokenapp.repository.UserTokenRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserTokenRepository userTokenRepository;

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    @Transactional
    public User updateUser(Long userId, User updatedUser) {
        log.info("Updating user with id: {}", userId);

        User user = getUserById(userId);

        if (updatedUser.getFirstName() != null) {
            user.setFirstName(updatedUser.getFirstName());
        }
        if (updatedUser.getLastName() != null) {
            user.setLastName(updatedUser.getLastName());
        }
        User savedUser = userRepository.save(user);
        log.info("User updated successfully with id: {}", userId);

        return savedUser;
    }

    public List<UserTokenResponse> getUserPortfolio(Long userId) {
        log.info("Fetching portfolio for user: {}", userId);

        User user = getUserById(userId);

        return userTokenRepository.findByUserId(userId)
                .stream()
                .map(userToken -> UserTokenResponse.builder()
                        .id(userToken.getId())
                        .userId(userToken.getUser().getId())
                        .shareId(userToken.getShare().getId())
                        .shareName(userToken.getShare().getName())
                        .tokenAmount(userToken.getTokenAmount())
                        .ownershipPercentage(userToken.getOwnershipPercentage())
                        .currentValue(userToken.getShare().getCurrentValue())
                        .purchasedAt(userToken.getPurchasedAt())
                        .build())
                .collect(Collectors.toList());
    }
}

