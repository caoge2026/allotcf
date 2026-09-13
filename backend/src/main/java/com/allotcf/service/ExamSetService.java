package com.allotcf.service;

import com.allotcf.dto.exam.ExamSetDetailDto;
import com.allotcf.dto.exam.ExamSetDto;
import com.allotcf.dto.exam.QuestionDto;
import com.allotcf.entity.ExamSet;
import com.allotcf.entity.Question;
import com.allotcf.entity.User;
import com.allotcf.entity.UserExamSetProgress;
import com.allotcf.repository.ExamSetRepository;
import com.allotcf.repository.UserExamSetProgressRepository;
import com.allotcf.repository.UserQuestionBookmarkRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class ExamSetService {

    private final ExamSetRepository examSetRepository;
    private final UserExamSetProgressRepository userExamSetProgressRepository;
    private final UserQuestionBookmarkRepository userQuestionBookmarkRepository;

    public ExamSetService(
        ExamSetRepository examSetRepository,
        UserExamSetProgressRepository userExamSetProgressRepository,
        UserQuestionBookmarkRepository userQuestionBookmarkRepository
    ) {
        this.examSetRepository = examSetRepository;
        this.userExamSetProgressRepository = userExamSetProgressRepository;
        this.userQuestionBookmarkRepository = userQuestionBookmarkRepository;
    }

    public List<ExamSetDto> listAll() {
        List<ExamSet> examSets = examSetRepository.findAll();
        Map<Long, Integer> questionCounts = loadQuestionCounts(examSets);
        return examSets.stream()
            .map(examSet -> new ExamSetDto(
                examSet.getId(), examSet.getTitle(), examSet.getType(), examSet.getCreatedAt(),
                questionCounts.getOrDefault(examSet.getId(), 0)
            ))
            .toList();
    }

    public List<ExamSetDto> listForUser(User user) {
        List<ExamSet> examSets = examSetRepository.findAll();
        Map<Long, Integer> questionCounts = loadQuestionCounts(examSets);
        Map<Long, UserExamSetProgress> progressByExamSetId = loadProgressByExamSetId(user, examSets);
        return examSets.stream()
            .map(examSet -> toExamSetDto(examSet, questionCounts.getOrDefault(examSet.getId(), 0),
                progressByExamSetId.get(examSet.getId())))
            .toList();
    }

    public ExamSetDetailDto getDetail(Long id, User user) {
        ExamSet examSet = examSetRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("题库不存在"));

        Set<Long> bookmarkedCanonicalIds = loadBookmarkedCanonicalIds(examSet, user);
        List<QuestionDto> questions = examSet.getQuestions().stream()
            .map(question -> toQuestionDto(question, bookmarkedCanonicalIds))
            .toList();

        return new ExamSetDetailDto(examSet.getId(), examSet.getTitle(), examSet.getType(), questions);
    }

    private Set<Long> loadBookmarkedCanonicalIds(ExamSet examSet, User user) {
        if (user == null || examSet.getQuestions() == null || examSet.getQuestions().isEmpty()) {
            return Set.of();
        }

        List<Long> canonicalQuestionIds = examSet.getQuestions().stream()
            .map(question -> question.getCanonicalQuestion().getId())
            .toList();

        return new HashSet<>(
            userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(user.getId(), canonicalQuestionIds)
                .stream()
                .map(bookmark -> bookmark.getCanonicalQuestion().getId())
                .toList()
        );
    }

    private QuestionDto toQuestionDto(Question question, Set<Long> bookmarkedCanonicalIds) {
        Long canonicalQuestionId = question.getCanonicalQuestion().getId();
        return new QuestionDto(
            question.getId(),
            question.getSequenceOrder(),
            question.getQuestionNo(),
            question.getPassage(),
            question.getQuestionText(),
            question.getOptionA(),
            question.getOptionB(),
            question.getOptionC(),
            question.getOptionD(),
            canonicalQuestionId,
            bookmarkedCanonicalIds.contains(canonicalQuestionId)
        );
    }

    private Map<Long, Integer> loadQuestionCounts(List<ExamSet> examSets) {
        List<Long> examSetIds = examSets.stream().map(ExamSet::getId).toList();
        if (examSetIds.isEmpty()) return Map.of();
        return examSetRepository.countQuestionsByExamSetIds(examSetIds).stream()
            .collect(Collectors.toMap(row -> (Long) row[0], row -> ((Number) row[1]).intValue()));
    }

    private Map<Long, UserExamSetProgress> loadProgressByExamSetId(User user, List<ExamSet> examSets) {
        if (user == null) return Map.of();
        List<Long> examSetIds = examSets.stream().map(ExamSet::getId).toList();
        if (examSetIds.isEmpty()) return Map.of();
        return userExamSetProgressRepository.findByUserIdAndExamSetIdIn(user.getId(), examSetIds).stream()
            .filter(progress -> progress.getExamSet() != null && progress.getExamSet().getId() != null)
            .collect(Collectors.toMap(progress -> progress.getExamSet().getId(), Function.identity()));
    }

    private ExamSetDto toExamSetDto(ExamSet examSet, int questionCount, UserExamSetProgress progress) {
        if (progress == null) {
            return new ExamSetDto(
                examSet.getId(),
                examSet.getTitle(),
                examSet.getType(),
                examSet.getCreatedAt(),
                questionCount
            );
        }

        return new ExamSetDto(
            examSet.getId(),
            examSet.getTitle(),
            examSet.getType(),
            examSet.getCreatedAt(),
            questionCount,
            progress.getStatus(),
            progress.getLatestSessionId(),
            progress.getCurrentIndex(),
            progress.getAnsweredCount(),
            progress.getTotalCount(),
            progress.getPausedRemainingSeconds(),
            progress.getScore(),
            progress.getNclcLevelLabel(),
            progress.getAnswersJson()
        );
    }
}
