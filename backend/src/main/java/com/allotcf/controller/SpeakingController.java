package com.allotcf.controller;

import com.allotcf.dto.common.ErrorResponse;
import com.allotcf.dto.speaking.SpeakingAttemptRequest;
import com.allotcf.entity.User;
import com.allotcf.exception.GuestLimitReachedException;
import com.allotcf.service.GuestActionService;
import com.allotcf.service.SpeakingService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/speaking")
public class SpeakingController {

    private final SpeakingService speakingService;
    private final GuestActionService guestActionService;

    public SpeakingController(SpeakingService speakingService, GuestActionService guestActionService) {
        this.speakingService = speakingService;
        this.guestActionService = guestActionService;
    }

    @GetMapping("/scenarios")
    public ResponseEntity<?> listScenarios() {
        return ResponseEntity.ok(speakingService.listScenarios());
    }

    @PostMapping("/scenarios/{id}/standard-answer")
    public ResponseEntity<?> standardAnswer(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(Map.of("standardAnswer", speakingService.getOrCreateStandardAnswer(id)));
        } catch (IllegalStateException exception) {
            return aiUnavailableResponse(exception);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @PostMapping("/scenarios/{id}/attempts")
    public ResponseEntity<?> submitAttempt(
        @PathVariable Long id,
        @RequestBody SpeakingAttemptRequest request,
        @AuthenticationPrincipal User user
    ) {
        try {
            guestActionService.requireAllowed(user);
            Object response = speakingService.submitAttempt(id, request.getAnswer(), user);
            guestActionService.consumeIfGuest(user);
            return ResponseEntity.ok(response);
        } catch (GuestLimitReachedException exception) {
            return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("GUEST_LIMIT_REACHED", exception.getMessage()));
        } catch (IllegalStateException exception) {
            return aiUnavailableResponse(exception);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    private ResponseEntity<ErrorResponse> aiUnavailableResponse(IllegalStateException exception) {
        return ResponseEntity
            .status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(new ErrorResponse("AI_NOT_CONFIGURED", exception.getMessage()));
    }
}
