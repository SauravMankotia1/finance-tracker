package com.financetracker.repository;

import com.financetracker.model.Budget;
import com.financetracker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    List<Budget> findByUserAndMonthAndYear(User user, int month, int year);

    Optional<Budget> findByIdAndUser(Long id, User user);

    Optional<Budget> findByUserAndCategoryNameIgnoreCaseAndMonthAndYear(User user, String categoryName, int month, int year);

    boolean existsByUserAndCategoryNameIgnoreCaseAndMonthAndYear(User user, String categoryName, int month, int year);

    void deleteAllByUser(User user);
}
