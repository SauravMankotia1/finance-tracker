package com.financetracker.controller;

import com.financetracker.dto.ApiResponse;
import com.financetracker.dto.DashboardSummaryResponse;
import com.financetracker.model.User;
import com.financetracker.service.AuthService;
import com.financetracker.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthService authService;

    public DashboardController(DashboardService dashboardService, AuthService authService) {
        this.dashboardService = dashboardService;
        this.authService = authService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getStats() {
        User user = authService.getCurrentAuthenticatedUser();
        DashboardSummaryResponse summary = dashboardService.getDashboardSummary(user);
        return ResponseEntity.ok(ApiResponse.success("Dashboard statistics retrieved successfully", summary));
    }
}
