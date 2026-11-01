package com.financetracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {
    @NotBlank(message = "Name cannot be empty")
    @Size(min = 2, max = 100)
    private String name;

    private String currency;

    public UpdateProfileRequest() {}

    public UpdateProfileRequest(String name, String currency) {
        this.name = name;
        this.currency = currency;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
}
