package com.tokenapp.repository;

import com.tokenapp.entity.UserToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    List<UserToken> findByUserId(Long userId);
    List<UserToken> findByShareId(Long shareId);
    Optional<UserToken> findByUserIdAndShareId(Long userId, Long shareId);
    Long countByShareId(Long shareId);
}

