package com.financetracker.controller;

import com.financetracker.dto.ApiResponse;
import com.financetracker.dto.CategoryRequest;
import com.financetracker.dto.CategoryResponse;
import com.financetracker.model.TransactionType;
import com.financetracker.model.User;
import com.financetracker.service.AuthService;
import com.financetracker.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;
    private final AuthService authService;

    public CategoryController(CategoryService categoryService, AuthService authService) {
        this.categoryService = categoryService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories(
            @RequestParam(required = false) TransactionType type) {
        User user = authService.getCurrentAuthenticatedUser();
        List<CategoryResponse> categories = categoryService.getCategories(type, user);
        return ResponseEntity.ok(ApiResponse.success("Categories retrieved successfully", categories));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryResponse>> addCategory(@Valid @RequestBody CategoryRequest request) {
        User user = authService.getCurrentAuthenticatedUser();
        CategoryResponse response = categoryService.addCustomCategory(request, user);
        return ResponseEntity.ok(ApiResponse.success("Category created successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        User user = authService.getCurrentAuthenticatedUser();
        categoryService.deleteCustomCategory(id, user);
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully"));
    }
}
