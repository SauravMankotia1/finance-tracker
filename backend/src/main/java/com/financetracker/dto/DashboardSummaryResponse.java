package com.financetracker.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class DashboardSummaryResponse {
    private BigDecimal totalBalance = BigDecimal.ZERO;
    private BigDecimal totalIncome = BigDecimal.ZERO;
    private BigDecimal totalExpenses = BigDecimal.ZERO;
    private BigDecimal totalSavings = BigDecimal.ZERO;
    private double savingsRate = 0.0;

    private BigDecimal monthlyIncome = BigDecimal.ZERO;
    private BigDecimal monthlyExpenses = BigDecimal.ZERO;
    private BigDecimal monthlySavings = BigDecimal.ZERO;
    private double monthlySavingsRate = 0.0;

    private BigDecimal previousMonthIncome = BigDecimal.ZERO;
    private BigDecimal previousMonthExpenses = BigDecimal.ZERO;
    private double incomeGrowth = 0.0;
    private double expenseGrowth = 0.0;

    private BigDecimal totalBudget = BigDecimal.ZERO;
    private BigDecimal totalBudgetSpent = BigDecimal.ZERO;
    private BigDecimal totalBudgetRemaining = BigDecimal.ZERO;

    private String currency = "USD";

    private List<TransactionResponse> recentTransactions = new ArrayList<>();
    private List<CategoryBreakdownDTO> categoryDistribution = new ArrayList<>();
    private List<MonthlyTrendDTO> monthlySpendingTrends = new ArrayList<>();

    public DashboardSummaryResponse() {}

    public BigDecimal getTotalBalance() { return totalBalance; }
    public void setTotalBalance(BigDecimal totalBalance) { this.totalBalance = totalBalance; }

    public BigDecimal getTotalIncome() { return totalIncome; }
    public void setTotalIncome(BigDecimal totalIncome) { this.totalIncome = totalIncome; }

    public BigDecimal getTotalExpenses() { return totalExpenses; }
    public void setTotalExpenses(BigDecimal totalExpenses) { this.totalExpenses = totalExpenses; }

    public BigDecimal getTotalSavings() { return totalSavings; }
    public void setTotalSavings(BigDecimal totalSavings) { this.totalSavings = totalSavings; }

    public double getSavingsRate() { return savingsRate; }
    public void setSavingsRate(double savingsRate) { this.savingsRate = savingsRate; }

    public BigDecimal getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(BigDecimal monthlyIncome) { this.monthlyIncome = monthlyIncome; }

    public BigDecimal getMonthlyExpenses() { return monthlyExpenses; }
    public void setMonthlyExpenses(BigDecimal monthlyExpenses) { this.monthlyExpenses = monthlyExpenses; }

    public BigDecimal getMonthlySavings() { return monthlySavings; }
    public void setMonthlySavings(BigDecimal monthlySavings) { this.monthlySavings = monthlySavings; }

    public double getMonthlySavingsRate() { return monthlySavingsRate; }
    public void setMonthlySavingsRate(double monthlySavingsRate) { this.monthlySavingsRate = monthlySavingsRate; }

    public BigDecimal getPreviousMonthIncome() { return previousMonthIncome; }
    public void setPreviousMonthIncome(BigDecimal previousMonthIncome) { this.previousMonthIncome = previousMonthIncome; }

    public BigDecimal getPreviousMonthExpenses() { return previousMonthExpenses; }
    public void setPreviousMonthExpenses(BigDecimal previousMonthExpenses) { this.previousMonthExpenses = previousMonthExpenses; }

    public double getIncomeGrowth() { return incomeGrowth; }
    public void setIncomeGrowth(double incomeGrowth) { this.incomeGrowth = incomeGrowth; }

    public double getExpenseGrowth() { return expenseGrowth; }
    public void setExpenseGrowth(double expenseGrowth) { this.expenseGrowth = expenseGrowth; }

    public BigDecimal getTotalBudget() { return totalBudget; }
    public void setTotalBudget(BigDecimal totalBudget) { this.totalBudget = totalBudget; }

    public BigDecimal getTotalBudgetSpent() { return totalBudgetSpent; }
    public void setTotalBudgetSpent(BigDecimal totalBudgetSpent) { this.totalBudgetSpent = totalBudgetSpent; }

    public BigDecimal getTotalBudgetRemaining() { return totalBudgetRemaining; }
    public void setTotalBudgetRemaining(BigDecimal totalBudgetRemaining) { this.totalBudgetRemaining = totalBudgetRemaining; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public List<TransactionResponse> getRecentTransactions() { return recentTransactions; }
    public void setRecentTransactions(List<TransactionResponse> recentTransactions) { this.recentTransactions = recentTransactions; }

    public List<CategoryBreakdownDTO> getCategoryDistribution() { return categoryDistribution; }
    public void setCategoryDistribution(List<CategoryBreakdownDTO> categoryDistribution) { this.categoryDistribution = categoryDistribution; }

    public List<MonthlyTrendDTO> getMonthlySpendingTrends() { return monthlySpendingTrends; }
    public void setMonthlySpendingTrends(List<MonthlyTrendDTO> monthlySpendingTrends) { this.monthlySpendingTrends = monthlySpendingTrends; }
}
