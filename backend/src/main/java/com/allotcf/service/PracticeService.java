package com.allotcf.service;

import com.allotcf.dto.practice.AnswerItem;
import com.allotcf.dto.practice.PracticeResultDto;
import com.allotcf.dto.practice.QuestionResultDto;
import com.allotcf.dto.practice.SaveProgressRequest;
import com.allotcf.dto.practice.StartPracticeResponse;
import com.allotcf.dto.practice.SubmitRequest;
import com.allotcf.entity.AnswerRecord;
import com.allotcf.entity.ExamSet;
import com.allotcf.entity.PracticeSession;
import com.allotcf.entity.Question;
import com.allotcf.entity.User;
import com.allotcf.entity.UserExamSetProgress;
import com.allotcf.entity.UserWrongQuestion;
import com.allotcf.repository.AnswerRecordRepository;
import com.allotcf.repository.ExamSetRepository;
import com.allotcf.repository.PracticeSessionRepository;
import com.allotcf.repository.QuestionRepository;
import com.allotcf.repository.UserExamSetProgressRepository;
import com.allotcf.repository.UserQuestionBookmarkRepository;
import com.allotcf.repository.UserWrongQuestionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PracticeService {

    private final ExamSetRepository examSetRepository;
    private final PracticeSessionRepository practiceSessionRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRecordRepository answerRecordRepository;
    private final UserWrongQuestionRepository userWrongQuestionRepository;
    private final UserQuestionBookmarkRepository userQuestionBookmarkRepository;
    private final UserExamSetProgressRepository userExamSetProgressRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PracticeService(
        ExamSetRepository examSetRepository,
        PracticeSessionRepository practiceSessionRepository,
        QuestionRepository questionRepository,
        AnswerRecordRepository answerRecordRepository,
        UserWrongQuestionRepository userWrongQuestionRepository,
        UserQuestionBookmarkRepository userQuestionBookmarkRepository,
        UserExamSetProgressRepository userExamSetProgressRepository
    ) {
        this.examSetRepository = examSetRepository;
        this.practiceSessionRepository = practiceSessionRepository;
        this.questionRepository = questionRepository;
        this.answerRecordRepository = answerRecordRepository;
        this.userWrongQuestionRepository = userWrongQuestionRepository;
        this.userQuestionBookmarkRepository = userQuestionBookmarkRepository;
        this.userExamSetProgressRepository = userExamSetProgressRepository;
    }

    @Transactional
    public StartPracticeResponse startPractice(Long examSetId, User user) {
        ExamSet examSet = examSetRepository.findById(examSetId)
            .orElseThrow(() -> new IllegalArgumentException("题库不存在"));

        PracticeSession session = new PracticeSession();
        session.setUser(user);
        session.setExamSet(examSet);
        session = practiceSessionRepository.save(session);
        return new StartPracticeResponse(session.getId());
    }

    @Transactional
    public PracticeResultDto submit(Long sessionId, SubmitRequest request) {
        PracticeSession session = practiceSessionRepository.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("练习不存在"));

        List<QuestionResultDto> details = new ArrayList<>();
        int correct = 0;
        int score = 0;
        Set<Long> canonicalQuestionIds = new HashSet<>();

        for (AnswerItem item : request.getAnswers()) {
            Question question = questionRepository.findById(item.getQuestionId())
                .orElseThrow(() -> new IllegalArgumentException("题目不存在: " + item.getQuestionId()));
            canonicalQuestionIds.add(question.getCanonicalQuestion().getId());

            boolean isCorrect = question.getCorrectAnswer().equals(item.getUserAnswer());
            if (isCorrect) {
                correct++;
                score += calculateReadingScore(question.getSequenceOrder());
            } else if (item.getUserAnswer() != null && !item.getUserAnswer().isBlank()) {
                recordWrongQuestion(session.getUser(), question, item.getUserAnswer());
            }

            AnswerRecord record = new AnswerRecord();
            record.setPracticeSession(session);
            record.setQuestion(question);
            record.setUserAnswer(item.getUserAnswer());
            record.setIsCorrect(isCorrect);
            record.setTimeSpentSeconds(item.getTimeSpentSeconds());
            answerRecordRepository.save(record);

            details.add(toQuestionResultDto(question, item.getUserAnswer(), isCorrect, false));
        }

        Set<Long> bookmarkedCanonicalIds = loadBookmarkedCanonicalIds(session.getUser().getId(), canonicalQuestionIds);
        details.replaceAll(detail -> detailWithBookmark(detail, bookmarkedCanonicalIds.contains(detail.getCanonicalQuestionId())));

        session.setFinishedAt(LocalDateTime.now());
        session.setTotalCount(request.getAnswers().size());
        session.setCorrectCount(correct);
        practiceSessionRepository.save(session);
        markCompleted(session, correct, request.getAnswers().size(), score);

        return new PracticeResultDto(
            sessionId,
            request.getAnswers().size(),
            correct,
            score,
            mapReadingScoreToNclc(score),
            details
        );
    }

    @Transactional
    public UserExamSetProgress saveProgress(Long sessionId, SaveProgressRequest request) {
        PracticeSession session = practiceSessionRepository.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("练习不存在"));
        List<AnswerItem> answers = request.getAnswers() == null ? List.of() : request.getAnswers();
        UserExamSetProgress progress = getOrCreateProgress(session.getUser(), session.getExamSet());

        progress.setStatus("IN_PROGRESS");
        progress.setLatestSessionId(sessionId);
        progress.setCurrentIndex(request.getCurrentIndex());
        progress.setPausedRemainingSeconds(request.getPausedRemainingSeconds());
        progress.setAnsweredCount((int) answers.stream()
            .filter(answer -> answer.getUserAnswer() != null && !answer.getUserAnswer().isBlank())
            .count());
        progress.setTotalCount(session.getExamSet().getQuestions() == null ? null : session.getExamSet().getQuestions().size());
        progress.setAnswersJson(toAnswersJson(answers));
        progress.setUpdatedAt(LocalDateTime.now());
        return userExamSetProgressRepository.save(progress);
    }

    public PracticeResultDto getResult(Long sessionId) {
        PracticeSession session = practiceSessionRepository.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("练习不存在"));

        List<AnswerRecord> answerRecords = answerRecordRepository.findByPracticeSessionId(sessionId);
        Set<Long> canonicalQuestionIds = answerRecords.stream()
            .map(record -> record.getQuestion().getCanonicalQuestion().getId())
            .collect(java.util.stream.Collectors.toSet());
        Set<Long> bookmarkedCanonicalIds = loadBookmarkedCanonicalIds(session.getUser().getId(), canonicalQuestionIds);

        List<QuestionResultDto> details = answerRecords.stream()
            .map(record -> toQuestionResultDto(
                record.getQuestion(),
                record.getUserAnswer(),
                record.getIsCorrect(),
                bookmarkedCanonicalIds.contains(record.getQuestion().getCanonicalQuestion().getId())
            ))
            .toList();

        int score = answerRecords.stream()
            .filter(AnswerRecord::getIsCorrect)
            .mapToInt(record -> calculateReadingScore(record.getQuestion().getSequenceOrder()))
            .sum();

        return new PracticeResultDto(
            sessionId,
            session.getTotalCount() == null ? 0 : session.getTotalCount(),
            session.getCorrectCount() == null ? 0 : session.getCorrectCount(),
            score,
            mapReadingScoreToNclc(score),
            details
        );
    }

    private void recordWrongQuestion(User user, Question question, String userAnswer) {
        UserWrongQuestion wrongQuestion = userWrongQuestionRepository
            .findByUserIdAndCanonicalQuestionId(user.getId(), question.getCanonicalQuestion().getId())
            .orElseGet(() -> {
                UserWrongQuestion created = new UserWrongQuestion();
                created.setUser(user);
                created.setCanonicalQuestion(question.getCanonicalQuestion());
                created.setWrongCount(0);
                return created;
            });

        wrongQuestion.setWrongCount(wrongQuestion.getWrongCount() + 1);
        wrongQuestion.setLastWrongAt(LocalDateTime.now());
        wrongQuestion.setLastUserAnswer(userAnswer);
        wrongQuestion.setReviewStage(0);
        wrongQuestion.setNextReviewAt(LocalDate.now().plusDays(1).atStartOfDay());
        wrongQuestion.setLastReviewResult("WRONG");
        wrongQuestion.setUpdatedAt(LocalDateTime.now());
        userWrongQuestionRepository.save(wrongQuestion);
    }

    private void markCompleted(PracticeSession session, int correctCount, int totalCount, int score) {
        if (session.getUser() == null || session.getExamSet() == null) {
            return;
        }

        UserExamSetProgress progress = getOrCreateProgress(session.getUser(), session.getExamSet());
        progress.setStatus("COMPLETED");
        progress.setLatestSessionId(session.getId());
        progress.setAnsweredCount(totalCount);
        progress.setTotalCount(totalCount);
        progress.setScore(score);
        progress.setNclcLevelLabel(mapReadingScoreToNclc(score));
        progress.setCurrentIndex(null);
        progress.setPausedRemainingSeconds(null);
        progress.setAnswersJson(null);
        progress.setUpdatedAt(LocalDateTime.now());
        userExamSetProgressRepository.save(progress);
    }

    private UserExamSetProgress getOrCreateProgress(User user, ExamSet examSet) {
        return userExamSetProgressRepository.findByUserIdAndExamSetId(user.getId(), examSet.getId())
            .orElseGet(() -> {
                UserExamSetProgress created = new UserExamSetProgress();
                created.setUser(user);
                created.setExamSet(examSet);
                return created;
            });
    }

    private String toAnswersJson(List<AnswerItem> answers) {
        try {
            return objectMapper.writeValueAsString(answers);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("保存进度失败");
        }
    }

    private Set<Long> loadBookmarkedCanonicalIds(Long userId, Set<Long> canonicalQuestionIds) {
        if (canonicalQuestionIds.isEmpty()) {
            return Set.of();
        }
        return userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(
                userId,
                canonicalQuestionIds.stream().toList()
            )
            .stream()
            .map(bookmark -> bookmark.getCanonicalQuestion().getId())
            .collect(java.util.stream.Collectors.toSet());
    }

    private QuestionResultDto toQuestionResultDto(
        Question question,
        String userAnswer,
        boolean isCorrect,
        boolean bookmarked
    ) {
        return new QuestionResultDto(
            question.getId(),
            question.getCanonicalQuestion().getId(),
            question.getSequenceOrder(),
            question.getQuestionNo(),
            question.getPassage(),
            question.getQuestionText(),
            question.getOptionA(),
            question.getOptionB(),
            question.getOptionC(),
            question.getOptionD(),
            userAnswer,
            question.getCorrectAnswer(),
            isCorrect,
            bookmarked
        );
    }

    private QuestionResultDto detailWithBookmark(QuestionResultDto detail, boolean bookmarked) {
        return new QuestionResultDto(
            detail.getQuestionId(),
            detail.getCanonicalQuestionId(),
            detail.getSequenceOrder(),
            detail.getQuestionNo(),
            detail.getPassage(),
            detail.getQuestionText(),
            detail.getOptionA(),
            detail.getOptionB(),
            detail.getOptionC(),
            detail.getOptionD(),
            detail.getUserAnswer(),
            detail.getCorrectAnswer(),
            detail.isCorrect(),
            bookmarked
        );
    }

    private int calculateReadingScore(int sequenceOrder) {
        if (sequenceOrder >= 1 && sequenceOrder <= 4) {
            return 3;
        }
        if (sequenceOrder >= 5 && sequenceOrder <= 10) {
            return 9;
        }
        if (sequenceOrder >= 11 && sequenceOrder <= 19) {
            return 15;
        }
        if (sequenceOrder >= 20 && sequenceOrder <= 29) {
            return 21;
        }
        if (sequenceOrder >= 30 && sequenceOrder <= 35) {
            return 26;
        }
        if (sequenceOrder >= 36 && sequenceOrder <= 39) {
            return 33;
        }
        return 0;
    }

    private String mapReadingScoreToNclc(int score) {
        if (score >= 549) {
            return "CLB/NCLC 10";
        }
        if (score >= 524) {
            return "CLB/NCLC 9";
        }
        if (score >= 499) {
            return "CLB/NCLC 8";
        }
        if (score >= 453) {
            return "CLB/NCLC 7";
        }
        if (score >= 406) {
            return "CLB/NCLC 6";
        }
        if (score >= 375) {
            return "CLB/NCLC 5";
        }
        if (score >= 342) {
            return "CLB/NCLC 4";
        }
        return "CLB/NCLC 4 以下";
    }
}
