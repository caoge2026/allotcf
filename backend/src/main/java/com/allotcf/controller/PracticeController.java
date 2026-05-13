package com.allotcf.controller;

import com.allotcf.dto.common.ErrorResponse;
import com.allotcf.dto.practice.SaveProgressRequest;
import com.allotcf.dto.practice.SubmitRequest;
import com.allotcf.entity.User;
import com.allotcf.exception.GuestLimitReachedException;
import com.allotcf.service.GuestActionService;
import com.allotcf.service.PracticeService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/practice-sessions")
public class PracticeController {

    private final PracticeService practiceService;
    private final GuestActionService guestActionService;

    public PracticeController(PracticeService practiceService, GuestActionService guestActionService) {
        this.practiceService = practiceService;
        this.guestActionService = guestActionService;
    }

    @PostMapping
    public ResponseEntity<?> start(@RequestParam Long examSetId, @AuthenticationPrincipal User user) {
        try {
            guestActionService.requireAllowed(user);
            Object response = practiceService.startPractice(examSetId, user);
            guestActionService.consumeIfGuest(user);
            return ResponseEntity.ok(response);
        } catch (GuestLimitReachedException exception) {
            return guestLimitResponse(exception);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submit(
        @PathVariable Long id,
        @RequestBody SubmitRequest request,
        @AuthenticationPrincipal User user
    ) {
        try {
            guestActionService.requireAllowed(user);
            Object response = practiceService.submit(id, request);
            guestActionService.consumeIfGuest(user);
            return ResponseEntity.ok(response);
        } catch (GuestLimitReachedException exception) {
            return guestLimitResponse(exception);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @PostMapping("/{id}/progress")
    public ResponseEntity<?> saveProgress(
        @PathVariable Long id,
        @RequestBody SaveProgressRequest request,
        @AuthenticationPrincipal User user
    ) {
        try {
            guestActionService.requireAllowed(user);
            practiceService.saveProgress(id, request);
            guestActionService.consumeIfGuest(user);
            return ResponseEntity.ok(Map.of("saved", true));
        } catch (GuestLimitReachedException exception) {
            return guestLimitResponse(exception);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @GetMapping("/{id}/result")
    public ResponseEntity<?> result(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(practiceService.getResult(id));
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.notFound().build();
        }
    }

    private ResponseEntity<ErrorResponse> guestLimitResponse(GuestLimitReachedException exception) {
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse("GUEST_LIMIT_REACHED", exception.getMessage()));
    }
}
