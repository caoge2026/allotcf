package com.allotcf.controller;

import com.allotcf.entity.User;
import com.allotcf.service.ExamSetService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exam-sets")
public class ExamSetController {

    private final ExamSetService examSetService;

    public ExamSetController(ExamSetService examSetService) {
        this.examSetService = examSetService;
    }

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(examSetService.listForUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(examSetService.getDetail(id, user));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.notFound().build();
        }
    }
}
