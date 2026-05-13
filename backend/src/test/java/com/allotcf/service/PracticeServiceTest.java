package com.allotcf.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.allotcf.dto.practice.AnswerItem;
import com.allotcf.dto.practice.PracticeResultDto;
import com.allotcf.dto.practice.SaveProgressRequest;
import com.allotcf.dto.practice.SubmitRequest;
import com.allotcf.entity.ExamSet;
import com.allotcf.entity.PracticeSession;
import com.allotcf.entity.Question;
import com.allotcf.entity.User;
import com.allotcf.entity.UserExamSetProgress;
import com.allotcf.entity.UserQuestionBookmark;
import com.allotcf.entity.UserWrongQuestion;
import com.allotcf.repository.AnswerRecordRepository;
import com.allotcf.repository.ExamSetRepository;
import com.allotcf.repository.PracticeSessionRepository;
import com.allotcf.repository.QuestionRepository;
import com.allotcf.repository.UserExamSetProgressRepository;
import com.allotcf.repository.UserQuestionBookmarkRepository;
import com.allotcf.repository.UserWrongQuestionRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PracticeServiceTest {

    @Mock
    ExamSetRepository examSetRepository;

    @Mock
    PracticeSessionRepository practiceSessionRepository;

    @Mock
    QuestionRepository questionRepository;

    @Mock
    AnswerRecordRepository answerRecordRepository;

    @Mock
    UserWrongQuestionRepository userWrongQuestionRepository;

    @Mock
    UserQuestionBookmarkRepository userQuestionBookmarkRepository;

    @Mock
    UserExamSetProgressRepository userExamSetProgressRepository;

    @InjectMocks
    PracticeService practiceService;

    @Test
    void submit_calculates_correct_count() {
        PracticeSession session = new PracticeSession();
        User user = new User();
        user.setEmail("tester@example.com");
        session.setUser(user);

        Question q1 = mockQuestion(1L, "A");
        Question q2 = mockQuestion(2L, "B");

        when(practiceSessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(questionRepository.findById(1L)).thenReturn(Optional.of(q1));
        when(questionRepository.findById(2L)).thenReturn(Optional.of(q2));
        when(answerRecordRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(practiceSessionRepository.save(any())).thenReturn(session);
        when(userWrongQuestionRepository.findByUserIdAndCanonicalQuestionId(any(), any())).thenReturn(Optional.empty());
        when(userWrongQuestionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(any(), any())).thenReturn(List.of());

        SubmitRequest request = new SubmitRequest();
        request.setAnswers(List.of(
            new AnswerItem(1L, "A", 10),
            new AnswerItem(2L, "C", 8)
        ));

        PracticeResultDto result = practiceService.submit(1L, request);

        assertThat(result.getCorrectCount()).isEqualTo(1);
        assertThat(result.getTotalCount()).isEqualTo(2);
    }

    @Test
    void submit_calculates_reading_score_and_nclc_level() {
        PracticeSession session = new PracticeSession();
        User user = new User();
        user.setEmail("tester@example.com");
        session.setUser(user);

        Question q1 = mockQuestion(1L, 1, "A");
        Question q5 = mockQuestion(5L, 5, "B");
        Question q11 = mockQuestion(11L, 11, "C");
        Question q20 = mockQuestion(20L, 20, "D");
        Question q30 = mockQuestion(30L, 30, "A");
        Question q36 = mockQuestion(36L, 36, "B");

        when(practiceSessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(questionRepository.findById(1L)).thenReturn(Optional.of(q1));
        when(questionRepository.findById(5L)).thenReturn(Optional.of(q5));
        when(questionRepository.findById(11L)).thenReturn(Optional.of(q11));
        when(questionRepository.findById(20L)).thenReturn(Optional.of(q20));
        when(questionRepository.findById(30L)).thenReturn(Optional.of(q30));
        when(questionRepository.findById(36L)).thenReturn(Optional.of(q36));
        when(answerRecordRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(practiceSessionRepository.save(any())).thenReturn(session);
        when(userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(any(), any())).thenReturn(List.of());

        SubmitRequest request = new SubmitRequest();
        request.setAnswers(List.of(
            new AnswerItem(1L, "A", 5),
            new AnswerItem(5L, "B", 5),
            new AnswerItem(11L, "C", 5),
            new AnswerItem(20L, "D", 5),
            new AnswerItem(30L, "A", 5),
            new AnswerItem(36L, "B", 5)
        ));

        PracticeResultDto result = practiceService.submit(1L, request);

        assertThat(result.getScore()).isEqualTo(107);
        assertThat(result.getNclcLevelLabel()).isEqualTo("CLB/NCLC 4 以下");
    }

    @Test
    void submit_returns_review_detail_and_accumulates_wrong_question() {
        PracticeSession session = new PracticeSession();
        User user = new User();
        user.setEmail("tester@example.com");
        session.setUser(user);

        Question question = mockQuestion(2L, 2, "B");
        UserWrongQuestion accumulated = new UserWrongQuestion();
        accumulated.setUser(user);
        accumulated.setWrongCount(1);
        accumulated.setReviewStage(3);
        UserQuestionBookmark bookmark = new UserQuestionBookmark();
        com.allotcf.entity.CanonicalQuestion canonicalQuestion = mock(com.allotcf.entity.CanonicalQuestion.class);
        when(canonicalQuestion.getId()).thenReturn(1002L);
        bookmark.setCanonicalQuestion(canonicalQuestion);

        when(practiceSessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(questionRepository.findById(2L)).thenReturn(Optional.of(question));
        when(answerRecordRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(practiceSessionRepository.save(any())).thenReturn(session);
        when(userWrongQuestionRepository.findByUserIdAndCanonicalQuestionId(any(), any()))
            .thenReturn(Optional.of(accumulated));
        when(userWrongQuestionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(any(), any())).thenReturn(List.of(bookmark));

        SubmitRequest request = new SubmitRequest();
        request.setAnswers(List.of(new AnswerItem(2L, "A", 8)));

        PracticeResultDto result = practiceService.submit(1L, request);

        assertThat(result.getDetails()).hasSize(1);
        assertThat(result.getDetails().get(0).getQuestionText()).isEqualTo("题干 2");
        assertThat(result.getDetails().get(0).getOptionB()).isEqualTo("选项B2");
        assertThat(result.getDetails().get(0).isCorrect()).isFalse();
        assertThat(result.getDetails().get(0).isBookmarked()).isTrue();
        assertThat(accumulated.getWrongCount()).isEqualTo(2);
        assertThat(accumulated.getReviewStage()).isZero();
        assertThat(accumulated.getNextReviewAt()).isNotNull();
        assertThat(accumulated.getNextReviewAt()).isAfter(accumulated.getLastWrongAt());
        assertThat(accumulated.getLastReviewResult()).isEqualTo("WRONG");
    }

    @Test
    void submit_does_not_add_unanswered_question_to_wrong_question_book() {
        PracticeSession session = new PracticeSession();
        User user = new User();
        user.setEmail("tester@example.com");
        session.setUser(user);

        Question question = mockQuestion(2L, 2, "B");

        when(practiceSessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(questionRepository.findById(2L)).thenReturn(Optional.of(question));
        when(answerRecordRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(practiceSessionRepository.save(any())).thenReturn(session);
        when(userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(any(), any())).thenReturn(List.of());

        SubmitRequest request = new SubmitRequest();
        request.setAnswers(List.of(new AnswerItem(2L, "", 0)));

        PracticeResultDto result = practiceService.submit(1L, request);

        assertThat(result.getDetails()).hasSize(1);
        assertThat(result.getDetails().get(0).getUserAnswer()).isEmpty();
        assertThat(result.getDetails().get(0).isCorrect()).isFalse();
        verify(userWrongQuestionRepository, never()).save(any());
    }

    @Test
    void saveProgress_marks_exam_set_as_in_progress_for_the_account() {
        PracticeSession session = new PracticeSession();
        User user = new User();
        ExamSet examSet = mock(ExamSet.class);
        Question question1 = mock(Question.class);
        Question question2 = mock(Question.class);
        session.setUser(user);
        session.setExamSet(examSet);

        when(examSet.getQuestions()).thenReturn(List.of(question1, question2));
        when(practiceSessionRepository.findById(7L)).thenReturn(Optional.of(session));
        when(userExamSetProgressRepository.findByUserIdAndExamSetId(user.getId(), examSet.getId()))
            .thenReturn(Optional.empty());
        when(userExamSetProgressRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SaveProgressRequest request = new SaveProgressRequest();
        request.setCurrentIndex(10);
        request.setPausedRemainingSeconds(2500);
        request.setAnswers(List.of(new AnswerItem(1L, "A", 12)));

        UserExamSetProgress progress = practiceService.saveProgress(7L, request);

        assertThat(progress.getStatus()).isEqualTo("IN_PROGRESS");
        assertThat(progress.getCurrentIndex()).isEqualTo(10);
        assertThat(progress.getAnsweredCount()).isEqualTo(1);
        assertThat(progress.getTotalCount()).isEqualTo(2);
        assertThat(progress.getLatestSessionId()).isEqualTo(7L);
    }

    private Question mockQuestion(Long id, int sequenceOrder, String correctAnswer) {
        Question question = mock(Question.class);
        when(question.getId()).thenReturn(id);
        when(question.getSequenceOrder()).thenReturn(sequenceOrder);
        when(question.getQuestionNo()).thenReturn("1-" + sequenceOrder);
        when(question.getPassage()).thenReturn("正文 " + sequenceOrder);
        when(question.getQuestionText()).thenReturn("题干 " + sequenceOrder);
        when(question.getOptionA()).thenReturn("选项A" + sequenceOrder);
        when(question.getOptionB()).thenReturn("选项B" + sequenceOrder);
        when(question.getOptionC()).thenReturn("选项C" + sequenceOrder);
        when(question.getOptionD()).thenReturn("选项D" + sequenceOrder);
        when(question.getCorrectAnswer()).thenReturn(correctAnswer);
        com.allotcf.entity.CanonicalQuestion canonicalQuestion = mock(com.allotcf.entity.CanonicalQuestion.class);
        when(canonicalQuestion.getId()).thenReturn(id + 1000);
        when(question.getCanonicalQuestion()).thenReturn(canonicalQuestion);
        return question;
    }

    private Question mockQuestion(Long id, String correctAnswer) {
        return mockQuestion(id, 1, correctAnswer);
    }
}
