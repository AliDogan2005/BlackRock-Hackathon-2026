package com.tokenapp.repository;

import com.tokenapp.entity.Share;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShareRepository extends JpaRepository<Share, Long> {
    List<Share> findByIsActiveTrue();
    boolean existsByName(String name);
    Optional<Share> findByName(String name);
    Optional<Share> findFirstByNameIgnoreCaseAndIsActiveTrue(String name);
    Optional<Share> findFirstByNameContainingIgnoreCaseAndIsActiveTrue(String namePart);
}
