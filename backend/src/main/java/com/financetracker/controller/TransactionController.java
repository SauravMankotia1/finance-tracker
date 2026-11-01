package com.financetracker.controller;

import com.financetracker.dto.ApiResponse;
import com.financetracker.dto.TransactionRequest;
import com.financetracker.dto.TransactionResponse;
import com.financetracker.model.TransactionType;
import com.financetracker.model.User;
import com.financetracker.service.AuthService;
import com.financetracker.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final AuthService authService;

    public TransactionController(TransactionService transactionService, AuthService authService) {
        this.transactionService = transactionService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TransactionResponse>> createTransaction(@Valid @RequestBody TransactionRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        TransactionResponse response = transactionService.createTransaction(request, user);
        return ResponseEntity.ok(ApiResponse.success("Transaction created successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> updateTransaction(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        TransactionResponse response = transactionService.updateTransaction(id, request, user);
        return ResponseEntity.ok(ApiResponse.success("Transaction updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        transactionService.deleteTransaction(id, user);
        return ResponseEntity.ok(ApiResponse.success("Transaction deleted successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TransactionResponse>> getTransaction(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        TransactionResponse response = transactionService.getTransaction(id, user);
        return ResponseEntity.ok(ApiResponse.success("Transaction retrieved successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TransactionResponse>>> getTransactions(
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        User user = authService.getCurrentAuthenticatedUser();
        Page<TransactionResponse> result = transactionService.getFilteredTransactions(
                type, category, startDate, endDate, search, page, size, sortBy, sortDir, user);
        return ResponseEntity.ok(ApiResponse.success("Transactions retrieved successfully", result));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<TransactionResponse>>> getAllTransactions() {
        User user = authService.getCurrentAuthenticatedUser();
        List<TransactionResponse> result = transactionService.getAllTransactions(user);
        return ResponseEntity.ok(ApiResponse.success("All transactions retrieved successfully", result));
    }
}
