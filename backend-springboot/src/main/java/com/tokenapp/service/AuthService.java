package com.tokenapp.service;

import com.tokenapp.dto.AuthResponse;
import com.tokenapp.dto.LoginRequest;
import com.tokenapp.dto.RegisterRequest;
import com.tokenapp.entity.User;
import com.tokenapp.exception.BadRequestException;
import com.tokenapp.exception.DuplicateResourceException;
import com.tokenapp.exception.ResourceNotFoundException;
import com.tokenapp.repository.UserRepository;
import com.tokenapp.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest registerRequest) {
        log.info("Attempting to register user with username: {}", registerRequest.getUsername());

        // Validate password confirmation
        if (!registerRequest.getPassword().equals(registerRequest.getPasswordConfirm())) {
            throw new BadRequestException("Passwords do not match");
        }

        // Check if username already exists
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new DuplicateResourceException("Username already exists: " + registerRequest.getUsername());
        }

        // Check if email already exists
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + registerRequest.getEmail());
        }

        // Create new user
        User user = User.builder()
                .username(registerRequest.getUsername())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .firstName(registerRequest.getFirstName())
                .lastName(registerRequest.getLastName())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with id: {}", savedUser.getId());

        // Send welcome email
        try {
            String fullName = (registerRequest.getFirstName() != null ? registerRequest.getFirstName() : "")
                    + (registerRequest.getLastName() != null ? " " + registerRequest.getLastName() : "");
            emailService.sendRegistrationWelcomeEmail(
                    savedUser.getEmail(),
                    fullName.trim().isEmpty() ? savedUser.getUsername() : fullName.trim()
            );
            log.info("Welcome email sent to: {}", savedUser.getEmail());
        } catch (Exception e) {
            log.warn("Could not send welcome email to: {}", savedUser.getEmail(), e);
        }

        // Generate JWT token
        String token = tokenProvider.generateToken(savedUser.getId(), savedUser.getUsername());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .message("User registered successfully")
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest loginRequest) {
        log.info("Attempting to login user: {}", loginRequest.getUsernameOrEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsernameOrEmail(),
                            loginRequest.getPassword()
                    )
            );

            User user = userRepository.findByUsernameOrEmail(
                    loginRequest.getUsernameOrEmail(),
                    loginRequest.getUsernameOrEmail()
            ).orElseThrow(() -> new ResourceNotFoundException("User not found"));

            String token = tokenProvider.generateToken(user.getId(), user.getUsername());
            log.info("User logged in successfully: {}", user.getUsername());

            return AuthResponse.builder()
                    .token(token)
                    .tokenType("Bearer")
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .message("Login successful")
                    .build();

        } catch (AuthenticationException ex) {
            log.error("Authentication failed for user: {}", loginRequest.getUsernameOrEmail());
            throw new BadRequestException("Invalid username or password");
        }
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
}

