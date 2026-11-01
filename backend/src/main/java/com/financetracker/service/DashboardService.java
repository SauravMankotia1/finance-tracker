package com.financetracker.service;

import com.financetracker.dto.CategoryBreakdownDTO;
import com.financetracker.dto.DashboardSummaryResponse;
import com.financetracker.dto.MonthlyTrendDTO;
import com.financetracker.dto.TransactionResponse;
import com.financetracker.model.Budget;
import com.financetracker.model.Transaction;
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
import java.time.format.TextStyle;
import java.util.*;

@Service
public class DashboardService {

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;

    private static final String[] PALETTE = {
            "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
            "#06B6D4", "#EC4899", "#6366F1", "#14B8A6", "#F97316"
    };

    public DashboardService(TransactionRepository transactionRepository, BudgetRepository budgetRepository) {
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary(User user) {
        DashboardSummaryResponse response = new DashboardSummaryResponse();
        response.setCurrency(user.getCurrency());

        LocalDate now = LocalDate.now();
        YearMonth currentYm = YearMonth.of(now.getYear(), now.getMonthValue());
        YearMonth prevYm = currentYm.minusMonths(1);

        // 1. All-time Totals
        BigDecimal totalIncome = transactionRepository.sumByUserAndType(user, TransactionType.INCOME);
        BigDecimal totalExpenses = transactionRepository.sumByUserAndType(user, TransactionType.EXPENSE);
        if (totalIncome == null) totalIncome = BigDecimal.ZERO;
        if (totalExpenses == null) totalExpenses = BigDecimal.ZERO;

        BigDecimal totalBalance = totalIncome.subtract(totalExpenses);
        BigDecimal totalSavings = totalBalance;
        double overallSavingsRate = 0.0;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            overallSavingsRate = totalSavings.multiply(BigDecimal.valueOf(100))
                    .divide(totalIncome, 1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        response.setTotalIncome(totalIncome);
        response.setTotalExpenses(totalExpenses);
        response.setTotalBalance(totalBalance);
        response.setTotalSavings(totalSavings);
        response.setSavingsRate(overallSavingsRate);

        // 2. Current Month Totals
        BigDecimal curMonthIncome = transactionRepository.sumByUserAndTypeAndDateBetween(
                user, TransactionType.INCOME, currentYm.atDay(1), currentYm.atEndOfMonth());
        BigDecimal curMonthExpenses = transactionRepository.sumByUserAndTypeAndDateBetween(
                user, TransactionType.EXPENSE, currentYm.atDay(1), currentYm.atEndOfMonth());
        if (curMonthIncome == null) curMonthIncome = BigDecimal.ZERO;
        if (curMonthExpenses == null) curMonthExpenses = BigDecimal.ZERO;

        BigDecimal curMonthSavings = curMonthIncome.subtract(curMonthExpenses);
        double curMonthSavingsRate = 0.0;
        if (curMonthIncome.compareTo(BigDecimal.ZERO) > 0) {
            curMonthSavingsRate = curMonthSavings.multiply(BigDecimal.valueOf(100))
                    .divide(curMonthIncome, 1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        response.setMonthlyIncome(curMonthIncome);
        response.setMonthlyExpenses(curMonthExpenses);
        response.setMonthlySavings(curMonthSavings);
        response.setMonthlySavingsRate(curMonthSavingsRate);

        // 3. Previous Month Totals & MoM Growth
        BigDecimal prevMonthIncome = transactionRepository.sumByUserAndTypeAndDateBetween(
                user, TransactionType.INCOME, prevYm.atDay(1), prevYm.atEndOfMonth());
        BigDecimal prevMonthExpenses = transactionRepository.sumByUserAndTypeAndDateBetween(
                user, TransactionType.EXPENSE, prevYm.atDay(1), prevYm.atEndOfMonth());
        if (prevMonthIncome == null) prevMonthIncome = BigDecimal.ZERO;
        if (prevMonthExpenses == null) prevMonthExpenses = BigDecimal.ZERO;

        response.setPreviousMonthIncome(prevMonthIncome);
        response.setPreviousMonthExpenses(prevMonthExpenses);

        if (prevMonthIncome.compareTo(BigDecimal.ZERO) > 0) {
            double incGrowth = curMonthIncome.subtract(prevMonthIncome)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(prevMonthIncome, 1, RoundingMode.HALF_UP)
                    .doubleValue();
            response.setIncomeGrowth(incGrowth);
        }

        if (prevMonthExpenses.compareTo(BigDecimal.ZERO) > 0) {
            double expGrowth = curMonthExpenses.subtract(prevMonthExpenses)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(prevMonthExpenses, 1, RoundingMode.HALF_UP)
                    .doubleValue();
            response.setExpenseGrowth(expGrowth);
        }

        // 4. Budget Aggregates
        List<Budget> budgets = budgetRepository.findByUserAndMonthAndYear(user, now.getMonthValue(), now.getYear());
        BigDecimal totalBudget = BigDecimal.ZERO;
        BigDecimal totalBudgetSpent = BigDecimal.ZERO;

        for (Budget b : budgets) {
            totalBudget = totalBudget.add(b.getMonthlyLimit());
            BigDecimal spent = transactionRepository.sumByUserAndTypeAndCategoryAndDateBetween(
                    user, TransactionType.EXPENSE, b.getCategoryName(), currentYm.atDay(1), currentYm.atEndOfMonth());
            if (spent != null) {
                totalBudgetSpent = totalBudgetSpent.add(spent);
            }
        }
        response.setTotalBudget(totalBudget);
        response.setTotalBudgetSpent(totalBudgetSpent);
        response.setTotalBudgetRemaining(totalBudget.subtract(totalBudgetSpent));

        // 5. Recent Transactions
        List<Transaction> recents = transactionRepository.findTop10ByUserOrderByDateDescCreatedAtDesc(user);
        response.setRecentTransactions(recents.stream().map(TransactionResponse::new).toList());

        // 6. Expense Category Distribution (Current month, or if empty all-time)
        List<Object[]> catRows = transactionRepository.findCategoryTotals(
                user, TransactionType.EXPENSE, currentYm.atDay(1), currentYm.atEndOfMonth());
        if (catRows.isEmpty()) {
            catRows = transactionRepository.findCategoryTotals(
                    user, TransactionType.EXPENSE, now.minusMonths(6), now);
        }

        BigDecimal sumOfCategoryExpenses = BigDecimal.ZERO;
        for (Object[] row : catRows) {
            BigDecimal amt = (BigDecimal) row[1];
            sumOfCategoryExpenses = sumOfCategoryExpenses.add(amt);
        }

        List<CategoryBreakdownDTO> dist = new ArrayList<>();
        int colorIdx = 0;
        for (Object[] row : catRows) {
            String catName = (String) row[0];
            BigDecimal amt = (BigDecimal) row[1];
            double pct = 0.0;
            if (sumOfCategoryExpenses.compareTo(BigDecimal.ZERO) > 0) {
                pct = amt.multiply(BigDecimal.valueOf(100))
                        .divide(sumOfCategoryExpenses, 1, RoundingMode.HALF_UP)
                        .doubleValue();
            }
            String color = PALETTE[colorIdx % PALETTE.length];
            dist.add(new CategoryBreakdownDTO(catName, amt, pct, color));
            colorIdx++;
        }
        response.setCategoryDistribution(dist);

        // 7. Monthly Trends (Past 6 months chronologically)
        List<MonthlyTrendDTO> trends = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = currentYm.minusMonths(i);
            BigDecimal mInc = transactionRepository.sumByUserAndTypeAndDateBetween(
                    user, TransactionType.INCOME, ym.atDay(1), ym.atEndOfMonth());
            BigDecimal mExp = transactionRepository.sumByUserAndTypeAndDateBetween(
                    user, TransactionType.EXPENSE, ym.atDay(1), ym.atEndOfMonth());
            if (mInc == null) mInc = BigDecimal.ZERO;
            if (mExp == null) mExp = BigDecimal.ZERO;
            BigDecimal mSav = mInc.subtract(mExp);

            String monthLabel = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            trends.add(new MonthlyTrendDTO(ym.toString(), monthLabel, mInc, mExp, mSav));
        }
        response.setMonthlySpendingTrends(trends);

        return response;
    }
}
