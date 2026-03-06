package com.tokenapp.controller;

import com.tokenapp.dto.UserTokenResponse;
import com.tokenapp.entity.User;
import com.tokenapp.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/{userId}")
    public ResponseEntity<User> getUserById(@PathVariable Long userId) {
        log.info("Get user request for id: {}", userId);
        User user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<User> updateUser(@PathVariable Long userId, @RequestBody User updatedUser) {
        log.info("Update user request for id: {}", userId);
        User user = userService.updateUser(userId, updatedUser);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{userId}/portfolio")
    public ResponseEntity<List<UserTokenResponse>> getUserPortfolio(@PathVariable Long userId) {
        log.info("Get user portfolio request for user id: {}", userId);
        List<UserTokenResponse> portfolio = userService.getUserPortfolio(userId);
        return ResponseEntity.ok(portfolio);
    }
}

