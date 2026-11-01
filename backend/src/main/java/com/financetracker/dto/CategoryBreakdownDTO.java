package com.financetracker.dto;

import java.math.BigDecimal;

public class CategoryBreakdownDTO {
    private String category;
    private BigDecimal amount;
    private double percentage;
    private String color;

    public CategoryBreakdownDTO() {}

    public CategoryBreakdownDTO(String category, BigDecimal amount, double percentage, String color) {
        this.category = category;
        this.amount = amount;
        this.percentage = percentage;
        this.color = color;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public double getPercentage() { return percentage; }
    public void setPercentage(double percentage) { this.percentage = percentage; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
