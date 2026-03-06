package com.tokenapp.repository;

import com.tokenapp.entity.UserWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserWalletRepository extends JpaRepository<UserWallet, Long> {

    /**
     * Kullanıcı ID'sine göre wallet bul
     */
    Optional<UserWallet> findByUserId(Long userId);
}

