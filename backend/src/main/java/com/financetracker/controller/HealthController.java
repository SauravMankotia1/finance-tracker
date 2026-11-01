package com.financetracker.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final long startTime = System.currentTimeMillis();

    @GetMapping
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "Personal Finance Tracker API");
        health.put("version", "1.0.0");
        health.put("timestamp", Instant.now().toString());
        health.put("uptimeSeconds", (System.currentTimeMillis() - startTime) / 1000);
        health.put("jvmUptimeMs", ManagementFactory.getRuntimeMXBean().getUptime());
        return ResponseEntity.ok(health);
    }
}
