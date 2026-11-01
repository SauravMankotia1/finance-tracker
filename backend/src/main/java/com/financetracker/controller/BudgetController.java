package com.financetracker.controller;

import com.financetracker.dto.ApiResponse;
import com.financetracker.dto.BudgetRequest;
import com.financetracker.dto.BudgetResponse;
import com.financetracker.model.User;
import com.financetracker.service.AuthService;
import com.financetracker.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;
    private final AuthService authService;

    public BudgetController(BudgetService budgetService, AuthService authService) {
        this.budgetService = budgetService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> createOrUpdateBudget(@Valid @RequestBody BudgetRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        BudgetResponse response = budgetService.createOrUpdateBudget(request, user);
        return ResponseEntity.ok(ApiResponse.success("Budget saved successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> getBudgets(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        User user = authService.getCurrentAuthenticatedUser();
        LocalDate now = LocalDate.now();
        int m = (month != null) ? month : now.getMonthValue();
        int y = (year != null) ? year : now.getYear();

        List<BudgetResponse> list = budgetService.getBudgetsForMonth(m, y, user);
        return ResponseEntity.ok(ApiResponse.success("Budgets retrieved successfully", list));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        budgetService.deleteBudget(id, user);
        return ResponseEntity.ok(ApiResponse.success("Budget deleted successfully"));
    }
}
