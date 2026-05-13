package com.allotcf.controller;

import com.allotcf.dto.common.ErrorResponse;
import com.allotcf.dto.review.ReviewQuestionAttemptRequest;
import com.allotcf.entity.User;
import com.allotcf.exception.GuestLimitReachedException;
import com.allotcf.service.GuestActionService;
import com.allotcf.service.WrongQuestionService;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/review")
public class WrongQuestionController {

    private final WrongQuestionService wrongQuestionService;
    private final GuestActionService guestActionService;

    public WrongQuestionController(
        WrongQuestionService wrongQuestionService,
        GuestActionService guestActionService
    ) {
        this.wrongQuestionService = wrongQuestionService;
        this.guestActionService = guestActionService;
    }

    @GetMapping("/wrong-questions")
    public ResponseEntity<?> listWrongQuestions(
        @RequestParam(defaultValue = "READING") String type,
        @RequestParam(defaultValue = "false") boolean bookmarkedOnly,
        @RequestParam(defaultValue = "0") int minWrongCount,
        @RequestParam(defaultValue = "") String difficultyLevels,
        @RequestParam(defaultValue = "") String keyword,
        @RequestParam(defaultValue = "ACTIVE") String masteryStatus,
        @AuthenticationPrincipal User user
    ) {
        if (!"READING".equalsIgnoreCase(type)) {
            return ResponseEntity.badRequest().body(Map.of("error", "当前仅支持阅读错题复习"));
        }
        Set<String> selectedDifficultyLevels = Arrays.stream(difficultyLevels.split(","))
            .map(String::trim)
            .filter(level -> !level.isEmpty())
            .collect(Collectors.toSet());
        return ResponseEntity.ok(
            wrongQuestionService.listReadingWrongQuestions(
                user,
                bookmarkedOnly,
                minWrongCount,
                selectedDifficultyLevels,
                keyword,
                masteryStatus
            )
        );
    }

    @GetMapping("/bookmarked-questions")
    public ResponseEntity<?> listBookmarkedQuestions(
        @RequestParam(defaultValue = "READING") String type,
        @RequestParam(defaultValue = "false") boolean wrongOnly,
        @RequestParam(defaultValue = "") String difficultyLevels,
        @RequestParam(defaultValue = "") String keyword,
        @AuthenticationPrincipal User user
    ) {
        if (!"READING".equalsIgnoreCase(type)) {
            return ResponseEntity.badRequest().body(Map.of("error", "当前仅支持阅读收藏练习"));
        }
        Set<String> selectedDifficultyLevels = Arrays.stream(difficultyLevels.split(","))
            .map(String::trim)
            .filter(level -> !level.isEmpty())
            .collect(Collectors.toSet());
        return ResponseEntity.ok(
            wrongQuestionService.listReadingBookmarkedQuestions(
                user,
                wrongOnly,
                selectedDifficultyLevels,
                keyword
            )
        );
    }

    @GetMapping("/today-wrong-questions")
    public ResponseEntity<?> listTodayWrongQuestions(
        @RequestParam(defaultValue = "READING") String type,
        @RequestParam(defaultValue = "false") boolean bookmarkedOnly,
        @RequestParam(defaultValue = "0") int minWrongCount,
        @RequestParam(defaultValue = "") String difficultyLevels,
        @RequestParam(defaultValue = "") String keyword,
        @RequestParam(defaultValue = "ACTIVE") String masteryStatus,
        @AuthenticationPrincipal User user
    ) {
        if (!"READING".equalsIgnoreCase(type)) {
            return ResponseEntity.badRequest().body(Map.of("error", "当前仅支持阅读错题复习"));
        }
        Set<String> selectedDifficultyLevels = Arrays.stream(difficultyLevels.split(","))
            .map(String::trim)
            .filter(level -> !level.isEmpty())
            .collect(Collectors.toSet());
        return ResponseEntity.ok(
            wrongQuestionService.listReadingTodayWrongQuestions(
                user,
                bookmarkedOnly,
                minWrongCount,
                selectedDifficultyLevels,
                keyword,
                masteryStatus
            )
        );
    }

    @PostMapping("/bookmarks/{canonicalQuestionId}")
    public ResponseEntity<?> addBookmark(
        @PathVariable Long canonicalQuestionId,
        @AuthenticationPrincipal User user
    ) {
        try {
            guestActionService.requireAllowed(user);
            boolean bookmarked = wrongQuestionService.addBookmark(canonicalQuestionId, user);
            guestActionService.consumeIfGuest(user);
            return ResponseEntity.ok(Map.of("bookmarked", bookmarked));
        } catch (GuestLimitReachedException exception) {
            return guestLimitResponse(exception);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @DeleteMapping("/bookmarks/{canonicalQuestionId}")
    public ResponseEntity<?> removeBookmark(
        @PathVariable Long canonicalQuestionId,
        @AuthenticationPrincipal User user
    ) {
        try {
            guestActionService.requireAllowed(user);
            boolean bookmarked = wrongQuestionService.removeBookmark(canonicalQuestionId, user);
            guestActionService.consumeIfGuest(user);
            return ResponseEntity.ok(Map.of("bookmarked", bookmarked));
        } catch (GuestLimitReachedException exception) {
            return guestLimitResponse(exception);
        }
    }

    @PostMapping("/wrong-questions/{canonicalQuestionId}/attempt")
    public ResponseEntity<?> recordWrongQuestionAttempt(
        @PathVariable Long canonicalQuestionId,
        @RequestBody ReviewQuestionAttemptRequest request,
        @AuthenticationPrincipal User user
    ) {
        try {
            guestActionService.requireAllowed(user);
            Object response = wrongQuestionService.recordReviewAttempt(
                canonicalQuestionId,
                request.getSelectedAnswer(),
                user
            );
            guestActionService.consumeIfGuest(user);
            return ResponseEntity.ok(response);
        } catch (GuestLimitReachedException exception) {
            return guestLimitResponse(exception);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    private ResponseEntity<ErrorResponse> guestLimitResponse(GuestLimitReachedException exception) {
        return ResponseEntity
            .status(HttpStatus.FORBIDDEN)
            .body(new ErrorResponse("GUEST_LIMIT_REACHED", exception.getMessage()));
    }
}
