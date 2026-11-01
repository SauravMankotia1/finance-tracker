package com.financetracker.controller;

import com.financetracker.dto.AnalyticsResponse;
import com.financetracker.dto.ApiResponse;
import com.financetracker.model.User;
import com.financetracker.service.AuthService;
import com.financetracker.service.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final AuthService authService;

    public ReportController(ReportService reportService, AuthService authService) {
        this.reportService = reportService;
        this.authService = authService;
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getAnalytics(
            @RequestParam(defaultValue = "monthly") String period,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {

        User user = authService.getCurrentAuthenticatedUser();
        AnalyticsResponse response = reportService.getAnalytics(period, year, month, user);
        return ResponseEntity.ok(ApiResponse.success("Analytics retrieved successfully", response));
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv() {
        User user = authService.getCurrentAuthenticatedUser();
        String csvContent = reportService.exportTransactionsCsv(user);
        byte[] bytes = csvContent.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        String filename = "finflow_transactions_" + LocalDate.now() + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(bytes);
    }
}
