package com.tokenapp.repository;

import com.tokenapp.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserIdOrderByTransactionDateDesc(Long userId);
    List<Transaction> findByUserIdAndTypeOrderByTransactionDateDesc(Long userId, Transaction.TransactionType type);

    List<Transaction> findByUserIdAndShareIdOrderByTransactionDateDesc(Long userId, Long shareId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.share.id = :shareId AND t.type = 'BUY'")
    BigDecimal calculateTotalBuyValueForShare(@Param("userId") Long userId, @Param("shareId") Long shareId);

    @Query("SELECT COALESCE(SUM(t.tokenAmount), 0) FROM Transaction t WHERE t.user.id = :userId AND t.share.id = :shareId AND t.type = 'BUY'")
    Long calculateTotalTokensBoughtForShare(@Param("userId") Long userId, @Param("shareId") Long shareId);
}

