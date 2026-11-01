package com.financetracker.dto;

import java.math.BigDecimal;

public class BudgetResponse {
    private Long id;
    private String categoryName;
    private BigDecimal monthlyLimit;
    private BigDecimal actualSpent;
    private BigDecimal remaining;
    private double percentageUsed;
    private boolean isExceeded;
    private boolean isWarning;
    private int month;
    private int year;
    private int alertThreshold;

    public BudgetResponse() {}

    public BudgetResponse(Long id, String categoryName, BigDecimal monthlyLimit, BigDecimal actualSpent,
                          BigDecimal remaining, double percentageUsed, boolean isExceeded, boolean isWarning,
                          int month, int year, int alertThreshold) {
        this.id = id;
        this.categoryName = categoryName;
        this.monthlyLimit = monthlyLimit;
        this.actualSpent = actualSpent;
        this.remaining = remaining;
        this.percentageUsed = percentageUsed;
        this.isExceeded = isExceeded;
        this.isWarning = isWarning;
        this.month = month;
        this.year = year;
        this.alertThreshold = alertThreshold;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public BigDecimal getMonthlyLimit() { return monthlyLimit; }
    public void setMonthlyLimit(BigDecimal monthlyLimit) { this.monthlyLimit = monthlyLimit; }

    public BigDecimal getActualSpent() { return actualSpent; }
    public void setActualSpent(BigDecimal actualSpent) { this.actualSpent = actualSpent; }

    public BigDecimal getRemaining() { return remaining; }
    public void setRemaining(BigDecimal remaining) { this.remaining = remaining; }

    public double getPercentageUsed() { return percentageUsed; }
    public void setPercentageUsed(double percentageUsed) { this.percentageUsed = percentageUsed; }

    public boolean isExceeded() { return isExceeded; }
    public void setExceeded(boolean exceeded) { isExceeded = exceeded; }

    public boolean isWarning() { return isWarning; }
    public void setWarning(boolean warning) { isWarning = warning; }

    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public int getAlertThreshold() { return alertThreshold; }
    public void setAlertThreshold(int alertThreshold) { this.alertThreshold = alertThreshold; }
}
