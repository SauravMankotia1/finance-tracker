package com.financetracker.dto;

import com.financetracker.model.Transaction;
import com.financetracker.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TransactionResponse {
    private Long id;
    private TransactionType type;
    private BigDecimal amount;
    private String category;
    private LocalDate date;
    private String description;
    private String notes;
    private String paymentMethod;
    private LocalDateTime createdAt;

    public TransactionResponse() {}

    public TransactionResponse(Transaction tx) {
        this.id = tx.getId();
        this.type = tx.getType();
        this.amount = tx.getAmount();
        this.category = tx.getCategory();
        this.date = tx.getDate();
        this.description = tx.getDescription();
        this.notes = tx.getNotes();
        this.paymentMethod = tx.getPaymentMethod();
        this.createdAt = tx.getCreatedAt();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public TransactionType getType() { return type; }
    public void setType(TransactionType type) { this.type = type; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
