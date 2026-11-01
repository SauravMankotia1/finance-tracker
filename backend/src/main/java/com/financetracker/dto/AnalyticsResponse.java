package com.financetracker.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class AnalyticsResponse {
    private String period; // "weekly", "monthly", "yearly", "all"
    private BigDecimal totalIncome = BigDecimal.ZERO;
    private BigDecimal totalExpenses = BigDecimal.ZERO;
    private BigDecimal netSavings = BigDecimal.ZERO;
    private double savingsRate = 0.0;
    private BigDecimal averageExpense = BigDecimal.ZERO;
    private String topSpendingCategory = "N/A";
    private BigDecimal topCategoryAmount = BigDecimal.ZERO;

    private List<CategoryBreakdownDTO> categoryBreakdown = new ArrayList<>();
    private List<MonthlyTrendDTO> trendData = new ArrayList<>();

    public AnalyticsResponse() {}

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public BigDecimal getTotalIncome() { return totalIncome; }
    public void setTotalIncome(BigDecimal totalIncome) { this.totalIncome = totalIncome; }

    public BigDecimal getTotalExpenses() { return totalExpenses; }
    public void setTotalExpenses(BigDecimal totalExpenses) { this.totalExpenses = totalExpenses; }

    public BigDecimal getNetSavings() { return netSavings; }
    public void setNetSavings(BigDecimal netSavings) { this.netSavings = netSavings; }

    public double getSavingsRate() { return savingsRate; }
    public void setSavingsRate(double savingsRate) { this.savingsRate = savingsRate; }

    public BigDecimal getAverageExpense() { return averageExpense; }
    public void setAverageExpense(BigDecimal averageExpense) { this.averageExpense = averageExpense; }

    public String getTopSpendingCategory() { return topSpendingCategory; }
    public void setTopSpendingCategory(String topSpendingCategory) { this.topSpendingCategory = topSpendingCategory; }

    public BigDecimal getTopCategoryAmount() { return topCategoryAmount; }
    public void setTopCategoryAmount(BigDecimal topCategoryAmount) { this.topCategoryAmount = topCategoryAmount; }

    public List<CategoryBreakdownDTO> getCategoryBreakdown() { return categoryBreakdown; }
    public void setCategoryBreakdown(List<CategoryBreakdownDTO> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }

    public List<MonthlyTrendDTO> getTrendData() { return trendData; }
    public void setTrendData(List<MonthlyTrendDTO> trendData) { this.trendData = trendData; }
}
