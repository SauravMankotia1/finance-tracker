package com.financetracker.dto;

import com.financetracker.model.Category;
import com.financetracker.model.TransactionType;

public class CategoryResponse {
    private Long id;
    private String name;
    private TransactionType type;
    private String icon;
    private String color;
    private boolean isCustom;

    public CategoryResponse() {}

    public CategoryResponse(Category c) {
        this.id = c.getId();
        this.name = c.getName();
        this.type = c.getType();
        this.icon = c.getIcon();
        this.color = c.getColor();
        this.isCustom = c.isCustom();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public boolean isCustom() { return isCustom; }
    public void setCustom(boolean custom) { isCustom = custom; }
}
