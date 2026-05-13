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
        return examSetRepository.findAll().stream()
            .map(examSet -> new ExamSetDto(
                examSet.getId(),
                examSet.getTitle(),
                examSet.getType(),
                examSet.getCreatedAt(),
                examSet.getQuestions() == null ? 0 : examSet.getQuestions().size()
            ))
            .toList();
    }

    public List<ExamSetDto> listForUser(User user) {
        return examSetRepository.findAll().stream()
            .map(examSet -> toExamSetDto(
                examSet,
                userExamSetProgressRepository.findByUserIdAndExamSetId(user.getId(), examSet.getId()).orElse(null)
            ))
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

    private ExamSetDto toExamSetDto(ExamSet examSet, UserExamSetProgress progress) {
        int questionCount = examSet.getQuestions() == null ? 0 : examSet.getQuestions().size();
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
