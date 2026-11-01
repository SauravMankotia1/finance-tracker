package com.financetracker.repository;

import com.financetracker.model.Transaction;
import com.financetracker.model.TransactionType;
import com.financetracker.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByIdAndUser(Long id, User user);

    List<Transaction> findTop10ByUserOrderByDateDescCreatedAtDesc(User user);

    List<Transaction> findByUserAndDateBetweenOrderByDateDesc(User user, LocalDate startDate, LocalDate endDate);

    List<Transaction> findByUserOrderByDateDesc(User user);

    @Query("SELECT t FROM Transaction t WHERE t.user = :user " +
           "AND (:type IS NULL OR t.type = :type) " +
           "AND (:category IS NULL OR :category = '' OR LOWER(t.category) = LOWER(:category)) " +
           "AND (:startDate IS NULL OR t.date >= :startDate) " +
           "AND (:endDate IS NULL OR t.date <= :endDate) " +
           "AND (:keyword IS NULL OR :keyword = '' OR LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(t.notes) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Transaction> findFiltered(
            @Param("user") User user,
            @Param("type") TransactionType type,
            @Param("category") String category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("keyword") String keyword,
            Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user = :user AND t.type = :type")
    BigDecimal sumByUserAndType(@Param("user") User user, @Param("type") TransactionType type);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user = :user AND t.type = :type AND t.date BETWEEN :startDate AND :endDate")
    BigDecimal sumByUserAndTypeAndDateBetween(
            @Param("user") User user,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user = :user AND t.type = :type AND LOWER(t.category) = LOWER(:category) AND t.date BETWEEN :startDate AND :endDate")
    BigDecimal sumByUserAndTypeAndCategoryAndDateBetween(
            @Param("user") User user,
            @Param("type") TransactionType type,
            @Param("category") String category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    @Query("SELECT t.category, SUM(t.amount) FROM Transaction t WHERE t.user = :user AND t.type = :type AND t.date BETWEEN :startDate AND :endDate GROUP BY t.category ORDER BY SUM(t.amount) DESC")
    List<Object[]> findCategoryTotals(
            @Param("user") User user,
            @Param("type") TransactionType type,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    void deleteAllByUser(User user);
}
