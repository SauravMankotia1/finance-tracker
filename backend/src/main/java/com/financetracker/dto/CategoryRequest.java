package com.financetracker.dto;

import com.financetracker.model.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CategoryRequest {
    @NotBlank(message = "Category name is required")
    private String name;

    @NotNull(message = "Transaction type is required")
    private TransactionType type;

    private String icon = "Tag";
    private String color = "#10B981";

    public CategoryRequest() {}

    public CategoryRequest(String name, TransactionType type, String icon, String color) {
        this.name = name;
        this.type = type;
        this.icon = icon;
        this.color = color;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
