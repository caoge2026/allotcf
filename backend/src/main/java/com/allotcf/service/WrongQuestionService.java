package com.allotcf.service;

import com.allotcf.dto.review.WrongQuestionListItemDto;
import com.allotcf.entity.CanonicalQuestion;
import com.allotcf.entity.Question;
import com.allotcf.entity.User;
import com.allotcf.entity.UserQuestionBookmark;
import com.allotcf.entity.UserWrongQuestion;
import com.allotcf.repository.QuestionRepository;
import com.allotcf.repository.UserQuestionBookmarkRepository;
import com.allotcf.repository.UserWrongQuestionRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WrongQuestionService {

    private static final int MASTERED_REVIEW_STAGE = 4;

    private final UserWrongQuestionRepository userWrongQuestionRepository;
    private final UserQuestionBookmarkRepository userQuestionBookmarkRepository;
    private final QuestionRepository questionRepository;

    public WrongQuestionService(
        UserWrongQuestionRepository userWrongQuestionRepository,
        UserQuestionBookmarkRepository userQuestionBookmarkRepository,
        QuestionRepository questionRepository
    ) {
        this.userWrongQuestionRepository = userWrongQuestionRepository;
        this.userQuestionBookmarkRepository = userQuestionBookmarkRepository;
        this.questionRepository = questionRepository;
    }

    @Transactional(readOnly = true)
    public List<WrongQuestionListItemDto> listReadingWrongQuestions(
        User user,
        boolean bookmarkedOnly,
        int minWrongCount,
        Set<String> difficultyLevels,
        String keyword
    ) {
        return listReadingWrongQuestions(user, bookmarkedOnly, minWrongCount, difficultyLevels, keyword, "ACTIVE");
    }

    @Transactional(readOnly = true)
    public List<WrongQuestionListItemDto> listReadingWrongQuestions(
        User user,
        boolean bookmarkedOnly,
        int minWrongCount,
        Set<String> difficultyLevels,
        String keyword,
        String masteryStatus
    ) {
        List<UserWrongQuestion> wrongQuestions = userWrongQuestionRepository
            .findByUserIdOrderByWrongCountDescLastWrongAtDesc(user.getId());

        List<Long> canonicalIds = wrongQuestions.stream()
            .map(item -> item.getCanonicalQuestion().getId())
            .toList();

        Set<Long> bookmarkedIds = userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(
                user.getId(),
                canonicalIds
            ).stream()
            .map(bookmark -> bookmark.getCanonicalQuestion().getId())
            .collect(Collectors.toSet());

        Map<Long, List<Question>> questionsByCanonicalId = questionRepository
            .findByCanonicalQuestionIdInOrderBySequenceOrderAsc(canonicalIds)
            .stream()
            .collect(Collectors.groupingBy(question -> question.getCanonicalQuestion().getId()));

        return wrongQuestions.stream()
            .filter(item -> !bookmarkedOnly || bookmarkedIds.contains(item.getCanonicalQuestion().getId()))
            .filter(item -> item.getWrongCount() >= minWrongCount)
            .filter(item -> matchesMasteryStatus(item, masteryStatus))
            .map(item -> toDto(item, bookmarkedIds.contains(item.getCanonicalQuestion().getId()), questionsByCanonicalId))
            .filter(item -> difficultyLevels.isEmpty() || difficultyLevels.contains(item.getDifficultyLevel()))
            .filter(item -> matchesKeyword(item, keyword))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<WrongQuestionListItemDto> listReadingTodayWrongQuestions(
        User user,
        boolean bookmarkedOnly,
        int minWrongCount,
        Set<String> difficultyLevels,
        String keyword
    ) {
        return listReadingTodayWrongQuestions(user, bookmarkedOnly, minWrongCount, difficultyLevels, keyword, "ACTIVE");
    }

    @Transactional(readOnly = true)
    public List<WrongQuestionListItemDto> listReadingTodayWrongQuestions(
        User user,
        boolean bookmarkedOnly,
        int minWrongCount,
        Set<String> difficultyLevels,
        String keyword,
        String masteryStatus
    ) {
        LocalDateTime endOfToday = LocalDate.now().atTime(23, 59, 59, 999_999_999);
        List<UserWrongQuestion> wrongQuestions = userWrongQuestionRepository
            .findByUserIdAndNextReviewAtLessThanEqual(user.getId(), endOfToday);

        List<Long> canonicalIds = wrongQuestions.stream()
            .map(item -> item.getCanonicalQuestion().getId())
            .toList();

        Set<Long> bookmarkedIds = userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(
                user.getId(),
                canonicalIds
            ).stream()
            .map(bookmark -> bookmark.getCanonicalQuestion().getId())
            .collect(Collectors.toSet());

        Map<Long, List<Question>> questionsByCanonicalId = questionRepository
            .findByCanonicalQuestionIdInOrderBySequenceOrderAsc(canonicalIds)
            .stream()
            .collect(Collectors.groupingBy(question -> question.getCanonicalQuestion().getId()));

        return wrongQuestions.stream()
            .filter(item -> !bookmarkedOnly || bookmarkedIds.contains(item.getCanonicalQuestion().getId()))
            .filter(item -> item.getWrongCount() >= minWrongCount)
            .filter(item -> matchesMasteryStatus(item, masteryStatus))
            .map(item -> toDto(item, bookmarkedIds.contains(item.getCanonicalQuestion().getId()), questionsByCanonicalId))
            .filter(item -> difficultyLevels.isEmpty() || difficultyLevels.contains(item.getDifficultyLevel()))
            .filter(item -> matchesKeyword(item, keyword))
            .sorted(Comparator
                .comparing(WrongQuestionListItemDto::getNextReviewAt, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(WrongQuestionListItemDto::getWrongCount, Comparator.reverseOrder())
                .thenComparing(WrongQuestionListItemDto::getLastWrongAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<WrongQuestionListItemDto> listReadingBookmarkedQuestions(
        User user,
        boolean wrongOnly,
        Set<String> difficultyLevels,
        String keyword
    ) {
        List<UserQuestionBookmark> bookmarks = userQuestionBookmarkRepository.findByUserId(user.getId());
        List<Long> canonicalIds = bookmarks.stream()
            .map(bookmark -> bookmark.getCanonicalQuestion().getId())
            .toList();

        if (canonicalIds.isEmpty()) {
            return List.of();
        }

        Map<Long, UserWrongQuestion> wrongQuestionsByCanonicalId = userWrongQuestionRepository
            .findByUserIdAndCanonicalQuestionIdInOrderByWrongCountDescLastWrongAtDesc(user.getId(), canonicalIds)
            .stream()
            .collect(Collectors.toMap(
                item -> item.getCanonicalQuestion().getId(),
                Function.identity()
            ));

        Map<Long, List<Question>> questionsByCanonicalId = questionRepository
            .findByCanonicalQuestionIdInOrderBySequenceOrderAsc(canonicalIds)
            .stream()
            .collect(Collectors.groupingBy(question -> question.getCanonicalQuestion().getId()));

        return bookmarks.stream()
            .map(bookmark -> toDto(
                bookmark.getCanonicalQuestion(),
                wrongQuestionsByCanonicalId.get(bookmark.getCanonicalQuestion().getId()),
                true,
                questionsByCanonicalId
            ))
            .filter(item -> !wrongOnly || item.getWrongCount() > 0)
            .filter(item -> difficultyLevels.isEmpty() || difficultyLevels.contains(item.getDifficultyLevel()))
            .filter(item -> matchesKeyword(item, keyword))
            .toList();
    }

    @Transactional
    public boolean addBookmark(Long canonicalQuestionId, User user) {
        if (userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionId(user.getId(), canonicalQuestionId).isPresent()) {
            return true;
        }

        Question sampleQuestion = questionRepository.findFirstByCanonicalQuestionId(canonicalQuestionId)
            .orElseThrow(() -> new IllegalArgumentException("题目不存在"));

        UserQuestionBookmark bookmark = new UserQuestionBookmark();
        bookmark.setUser(user);
        bookmark.setCanonicalQuestion(sampleQuestion.getCanonicalQuestion());
        userQuestionBookmarkRepository.save(bookmark);
        return true;
    }

    @Transactional
    public boolean removeBookmark(Long canonicalQuestionId, User user) {
        userQuestionBookmarkRepository.deleteByUserIdAndCanonicalQuestionId(user.getId(), canonicalQuestionId);
        return false;
    }

    @Transactional
    public WrongQuestionListItemDto recordReviewAttempt(Long canonicalQuestionId, String selectedAnswer, User user) {
        UserWrongQuestion wrongQuestion = userWrongQuestionRepository
            .findByUserIdAndCanonicalQuestionId(user.getId(), canonicalQuestionId)
            .orElseThrow(() -> new IllegalArgumentException("错题不存在"));

        boolean correct = wrongQuestion.getCanonicalQuestion().getCorrectAnswer().equalsIgnoreCase(selectedAnswer);
        LocalDateTime now = LocalDateTime.now();
        if (correct) {
            int nextStage = wrongQuestion.getReviewStage() + 1;
            wrongQuestion.setReviewStage(nextStage);
            wrongQuestion.setLastReviewResult("CORRECT");
            wrongQuestion.setNextReviewAt(LocalDate.now().plusDays(intervalDays(nextStage)).atStartOfDay());
        } else {
            wrongQuestion.setReviewStage(Math.max(0, wrongQuestion.getReviewStage() - 1));
            wrongQuestion.setWrongCount(wrongQuestion.getWrongCount() + 1);
            wrongQuestion.setLastUserAnswer(selectedAnswer);
            wrongQuestion.setLastWrongAt(now);
            wrongQuestion.setLastReviewResult("WRONG");
            wrongQuestion.setNextReviewAt(LocalDate.now().plusDays(1).atStartOfDay());
        }
        wrongQuestion.setLastReviewedAt(now);
        wrongQuestion.setUpdatedAt(now);

        boolean bookmarked = userQuestionBookmarkRepository
            .findByUserIdAndCanonicalQuestionId(user.getId(), canonicalQuestionId)
            .isPresent();
        Map<Long, List<Question>> questionsByCanonicalId = questionRepository
            .findByCanonicalQuestionIdInOrderBySequenceOrderAsc(List.of(canonicalQuestionId))
            .stream()
            .collect(Collectors.groupingBy(question -> question.getCanonicalQuestion().getId()));

        return toDto(wrongQuestion, bookmarked, questionsByCanonicalId);
    }

    private int intervalDays(int reviewStage) {
        int[] intervals = {1, 2, 4, 7, 15, 30};
        return intervals[Math.min(reviewStage, intervals.length - 1)];
    }

    private WrongQuestionListItemDto toDto(
        UserWrongQuestion wrongQuestion,
        boolean bookmarked,
        Map<Long, List<Question>> questionsByCanonicalId
    ) {
        return toDto(wrongQuestion.getCanonicalQuestion(), wrongQuestion, bookmarked, questionsByCanonicalId);
    }

    private WrongQuestionListItemDto toDto(
        CanonicalQuestion canonicalQuestion,
        UserWrongQuestion wrongQuestion,
        boolean bookmarked,
        Map<Long, List<Question>> questionsByCanonicalId
    ) {
        List<Question> sourceQuestions = questionsByCanonicalId.getOrDefault(canonicalQuestion.getId(), List.of());
        Question sampleQuestion = sourceQuestions.stream().findFirst()
            .orElseThrow(() -> new IllegalArgumentException("缺少统一题目对应的题面"));

        List<String> sourceExamSets = sourceQuestions.stream()
            .map(this::formatSourceLabel)
            .distinct()
            .toList();

        return new WrongQuestionListItemDto(
            canonicalQuestion.getId(),
            sampleQuestion.getQuestionText(),
            sampleQuestion.getPassage(),
            sampleQuestion.getOptionA(),
            sampleQuestion.getOptionB(),
            sampleQuestion.getOptionC(),
            sampleQuestion.getOptionD(),
            canonicalQuestion.getCorrectAnswer(),
            canonicalQuestion.getDifficultyLevel(),
            wrongQuestion == null ? 0 : wrongQuestion.getWrongCount(),
            wrongQuestion == null ? null : wrongQuestion.getLastWrongAt(),
            wrongQuestion == null ? null : wrongQuestion.getLastUserAnswer(),
            wrongQuestion == null ? 0 : wrongQuestion.getReviewStage(),
            wrongQuestion == null ? null : wrongQuestion.getNextReviewAt(),
            dueStatus(wrongQuestion),
            overdueDays(wrongQuestion),
            isMastered(wrongQuestion),
            bookmarked,
            sourceExamSets
        );
    }

    private boolean matchesMasteryStatus(UserWrongQuestion wrongQuestion, String masteryStatus) {
        if ("ALL".equalsIgnoreCase(masteryStatus)) {
            return true;
        }
        if ("MASTERED".equalsIgnoreCase(masteryStatus)) {
            return isMastered(wrongQuestion);
        }
        return !isMastered(wrongQuestion);
    }

    private boolean isMastered(UserWrongQuestion wrongQuestion) {
        return wrongQuestion != null && wrongQuestion.getReviewStage() >= MASTERED_REVIEW_STAGE;
    }

    private String dueStatus(UserWrongQuestion wrongQuestion) {
        if (wrongQuestion == null || wrongQuestion.getNextReviewAt() == null) {
            return "UNSCHEDULED";
        }

        LocalDate today = LocalDate.now();
        LocalDate nextReviewDate = wrongQuestion.getNextReviewAt().toLocalDate();
        if (nextReviewDate.isBefore(today)) {
            return "OVERDUE";
        }
        if (nextReviewDate.isEqual(today)) {
            return "DUE_TODAY";
        }
        return "UPCOMING";
    }

    private long overdueDays(UserWrongQuestion wrongQuestion) {
        if (wrongQuestion == null || wrongQuestion.getNextReviewAt() == null) {
            return 0;
        }

        LocalDate today = LocalDate.now();
        LocalDate nextReviewDate = wrongQuestion.getNextReviewAt().toLocalDate();
        if (!nextReviewDate.isBefore(today)) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(nextReviewDate, today);
    }

    private boolean matchesKeyword(WrongQuestionListItemDto item, String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return true;
        }
        String needle = keyword.toLowerCase();
        return containsIgnoreCase(item.getPassage(), needle)
            || containsIgnoreCase(item.getQuestionText(), needle)
            || containsIgnoreCase(item.getOptionA(), needle)
            || containsIgnoreCase(item.getOptionB(), needle)
            || containsIgnoreCase(item.getOptionC(), needle)
            || containsIgnoreCase(item.getOptionD(), needle);
    }

    private boolean containsIgnoreCase(String haystack, String needle) {
        return haystack != null && haystack.toLowerCase().contains(needle);
    }

    private String formatSourceLabel(Question question) {
        String questionNo = question.getQuestionNo();
        if (questionNo == null || questionNo.isBlank()) {
            questionNo = String.valueOf(question.getSequenceOrder());
        }

        return question.getExamSet().getTitle() + " 第 " + questionNo + " 题";
    }
}
