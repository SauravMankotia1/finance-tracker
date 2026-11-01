package com.financetracker.service;

import com.financetracker.dto.AnalyticsResponse;
import com.financetracker.dto.CategoryBreakdownDTO;
import com.financetracker.dto.MonthlyTrendDTO;
import com.financetracker.model.Transaction;
import com.financetracker.model.TransactionType;
import com.financetracker.model.User;
import com.financetracker.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class ReportService {

    private final TransactionRepository transactionRepository;

    private static final String[] PALETTE = {
            "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
            "#06B6D4", "#EC4899", "#6366F1", "#14B8A6", "#F97316"
    };

    public ReportService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(String period, Integer targetYear, Integer targetMonth, User user) {
        LocalDate today = LocalDate.now();
        int y = (targetYear != null) ? targetYear : today.getYear();
        int m = (targetMonth != null) ? targetMonth : today.getMonthValue();

        LocalDate startDate;
        LocalDate endDate;

        String periodMode = (period != null) ? period.toLowerCase().trim() : "monthly";

        switch (periodMode) {
            case "weekly" -> {
                startDate = today.minusDays(6);
                endDate = today;
            }
            case "yearly" -> {
                startDate = LocalDate.of(y, 1, 1);
                endDate = LocalDate.of(y, 12, 31);
            }
            case "all" -> {
                startDate = today.minusYears(5);
                endDate = today;
            }
            case "monthly" -> {
                YearMonth ym = YearMonth.of(y, m);
                startDate = ym.atDay(1);
                endDate = ym.atEndOfMonth();
            }
            default -> {
                YearMonth ym = YearMonth.of(y, m);
                startDate = ym.atDay(1);
                endDate = ym.atEndOfMonth();
                periodMode = "monthly";
            }
        }

        AnalyticsResponse response = new AnalyticsResponse();
        response.setPeriod(periodMode);

        BigDecimal totalIncome = transactionRepository.sumByUserAndTypeAndDateBetween(
                user, TransactionType.INCOME, startDate, endDate);
        BigDecimal totalExpenses = transactionRepository.sumByUserAndTypeAndDateBetween(
                user, TransactionType.EXPENSE, startDate, endDate);

        if (totalIncome == null) totalIncome = BigDecimal.ZERO;
        if (totalExpenses == null) totalExpenses = BigDecimal.ZERO;

        BigDecimal netSavings = totalIncome.subtract(totalExpenses);
        double savingsRate = 0.0;
        if (totalIncome.compareTo(BigDecimal.ZERO) > 0) {
            savingsRate = netSavings.multiply(BigDecimal.valueOf(100))
                    .divide(totalIncome, 1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        response.setTotalIncome(totalIncome);
        response.setTotalExpenses(totalExpenses);
        response.setNetSavings(netSavings);
        response.setSavingsRate(savingsRate);

        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (days > 0 && totalExpenses.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal avg = totalExpenses.divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
            response.setAverageExpense(avg);
        }

        // Category breakdown
        List<Object[]> catRows = transactionRepository.findCategoryTotals(
                user, TransactionType.EXPENSE, startDate, endDate);

        List<CategoryBreakdownDTO> breakdownList = new ArrayList<>();
        int colorIdx = 0;
        String topCategory = "N/A";
        BigDecimal topAmount = BigDecimal.ZERO;

        for (Object[] row : catRows) {
            String catName = (String) row[0];
            BigDecimal amt = (BigDecimal) row[1];

            if (amt.compareTo(topAmount) > 0) {
                topAmount = amt;
                topCategory = catName;
            }

            double pct = 0.0;
            if (totalExpenses.compareTo(BigDecimal.ZERO) > 0) {
                pct = amt.multiply(BigDecimal.valueOf(100))
                        .divide(totalExpenses, 1, RoundingMode.HALF_UP)
                        .doubleValue();
            }

            breakdownList.add(new CategoryBreakdownDTO(catName, amt, pct, PALETTE[colorIdx % PALETTE.length]));
            colorIdx++;
        }

        response.setCategoryBreakdown(breakdownList);
        response.setTopSpendingCategory(topCategory);
        response.setTopCategoryAmount(topAmount);

        // Trend data for period
        List<MonthlyTrendDTO> trendList = new ArrayList<>();
        if ("weekly".equals(periodMode)) {
            // Day by day trend for past 7 days
            for (int i = 6; i >= 0; i--) {
                LocalDate d = today.minusDays(i);
                BigDecimal dInc = transactionRepository.sumByUserAndTypeAndDateBetween(
                        user, TransactionType.INCOME, d, d);
                BigDecimal dExp = transactionRepository.sumByUserAndTypeAndDateBetween(
                        user, TransactionType.EXPENSE, d, d);
                if (dInc == null) dInc = BigDecimal.ZERO;
                if (dExp == null) dExp = BigDecimal.ZERO;
                String dayLabel = d.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                trendList.add(new MonthlyTrendDTO(d.toString(), dayLabel, dInc, dExp, dInc.subtract(dExp)));
            }
        } else if ("yearly".equals(periodMode)) {
            // Month by month for that year
            for (int monthIdx = 1; monthIdx <= 12; monthIdx++) {
                YearMonth ym = YearMonth.of(y, monthIdx);
                BigDecimal mInc = transactionRepository.sumByUserAndTypeAndDateBetween(
                        user, TransactionType.INCOME, ym.atDay(1), ym.atEndOfMonth());
                BigDecimal mExp = transactionRepository.sumByUserAndTypeAndDateBetween(
                        user, TransactionType.EXPENSE, ym.atDay(1), ym.atEndOfMonth());
                if (mInc == null) mInc = BigDecimal.ZERO;
                if (mExp == null) mExp = BigDecimal.ZERO;
                String monthLabel = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                trendList.add(new MonthlyTrendDTO(ym.toString(), monthLabel, mInc, mExp, mInc.subtract(mExp)));
            }
        } else {
            // Monthly mode: past 6 months
            YearMonth curYm = YearMonth.of(y, m);
            for (int i = 5; i >= 0; i--) {
                YearMonth ym = curYm.minusMonths(i);
                BigDecimal mInc = transactionRepository.sumByUserAndTypeAndDateBetween(
                        user, TransactionType.INCOME, ym.atDay(1), ym.atEndOfMonth());
                BigDecimal mExp = transactionRepository.sumByUserAndTypeAndDateBetween(
                        user, TransactionType.EXPENSE, ym.atDay(1), ym.atEndOfMonth());
                if (mInc == null) mInc = BigDecimal.ZERO;
                if (mExp == null) mExp = BigDecimal.ZERO;
                String monthLabel = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                trendList.add(new MonthlyTrendDTO(ym.toString(), monthLabel, mInc, mExp, mInc.subtract(mExp)));
            }
        }

        response.setTrendData(trendList);
        return response;
    }

    @Transactional(readOnly = true)
    public String exportTransactionsCsv(User user) {
        List<Transaction> transactions = transactionRepository.findByUserOrderByDateDesc(user);
        StringBuilder sb = new StringBuilder();
        sb.append("Transaction ID,Date,Type,Category,Amount,Currency,Description,Payment Method,Notes\n");

        for (Transaction t : transactions) {
            sb.append(t.getId()).append(",");
            sb.append(t.getDate()).append(",");
            sb.append(t.getType()).append(",");
            sb.append(escapeCsv(t.getCategory())).append(",");
            sb.append(t.getAmount()).append(",");
            sb.append(user.getCurrency()).append(",");
            sb.append(escapeCsv(t.getDescription())).append(",");
            sb.append(escapeCsv(t.getPaymentMethod())).append(",");
            sb.append(escapeCsv(t.getNotes() != null ? t.getNotes() : "")).append("\n");
        }

        return sb.toString();
    }

    private String escapeCsv(String val) {
        if (val == null) return "\"\"";
        String clean = val.replace("\"", "\"\"");
        return "\"" + clean + "\"";
    }
}
