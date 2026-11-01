package com.financetracker.service;

import com.financetracker.dto.BudgetRequest;
import com.financetracker.dto.BudgetResponse;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.model.Budget;
import com.financetracker.model.TransactionType;
import com.financetracker.model.User;
import com.financetracker.repository.BudgetRepository;
import com.financetracker.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final TransactionRepository transactionRepository;

    public BudgetService(BudgetRepository budgetRepository, TransactionRepository transactionRepository) {
        this.budgetRepository = budgetRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public BudgetResponse createOrUpdateBudget(BudgetRequest request, User user) {
        Optional<Budget> existingOpt = budgetRepository.findByUserAndCategoryNameIgnoreCaseAndMonthAndYear(
                user, request.getCategoryName().trim(), request.getMonth(), request.getYear()
        );

        Budget budget;
        if (existingOpt.isPresent()) {
            budget = existingOpt.get();
            budget.setMonthlyLimit(request.getMonthlyLimit());
            budget.setAlertThreshold(request.getAlertThreshold());
        } else {
            budget = new Budget(
                    user,
                    request.getCategoryName().trim(),
                    request.getMonthlyLimit(),
                    request.getMonth(),
                    request.getYear(),
                    request.getAlertThreshold()
            );
        }

        Budget saved = budgetRepository.save(budget);
        return mapToResponse(saved, user);
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> getBudgetsForMonth(int month, int year, User user) {
        List<Budget> budgets = budgetRepository.findByUserAndMonthAndYear(user, month, year);
        return budgets.stream()
                .map(b -> mapToResponse(b, user))
                .toList();
    }

    @Transactional
    public void deleteBudget(Long id, User user) {
        Budget budget = budgetRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found or access denied"));
        budgetRepository.delete(budget);
    }

    private BudgetResponse mapToResponse(Budget budget, User user) {
        YearMonth ym = YearMonth.of(budget.getYear(), budget.getMonth());
        LocalDate startDate = ym.atDay(1);
        LocalDate endDate = ym.atEndOfMonth();

        BigDecimal actualSpent = transactionRepository.sumByUserAndTypeAndCategoryAndDateBetween(
                user,
                TransactionType.EXPENSE,
                budget.getCategoryName(),
                startDate,
                endDate
        );

        if (actualSpent == null) {
            actualSpent = BigDecimal.ZERO;
        }

        BigDecimal remaining = budget.getMonthlyLimit().subtract(actualSpent);
        double percentage = 0.0;
        if (budget.getMonthlyLimit().compareTo(BigDecimal.ZERO) > 0) {
            percentage = actualSpent.multiply(BigDecimal.valueOf(100))
                    .divide(budget.getMonthlyLimit(), 2, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        boolean isExceeded = actualSpent.compareTo(budget.getMonthlyLimit()) > 0;
        boolean isWarning = percentage >= budget.getAlertThreshold();

        return new BudgetResponse(
                budget.getId(),
                budget.getCategoryName(),
                budget.getMonthlyLimit(),
                actualSpent,
                remaining,
                percentage,
                isExceeded,
                isWarning,
                budget.getMonth(),
                budget.getYear(),
                budget.getAlertThreshold()
        );
    }
}
