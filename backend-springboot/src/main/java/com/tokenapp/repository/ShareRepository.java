package com.tokenapp.repository;

import com.tokenapp.entity.Share;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShareRepository extends JpaRepository<Share, Long> {
    List<Share> findByIsActiveTrue();
    boolean existsByName(String name);
}

