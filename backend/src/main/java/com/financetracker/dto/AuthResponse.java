package com.financetracker.dto;

public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String name;
    private String email;
    private String currency;
    private String role;

    public AuthResponse() {}

    public AuthResponse(String token, Long id, String name, String email, String currency, String role) {
        this.token = token;
        this.id = id;
        this.name = name;
        this.email = email;
        this.currency = currency;
        this.role = role;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
