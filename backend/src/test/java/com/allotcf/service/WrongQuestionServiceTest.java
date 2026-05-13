package com.allotcf.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.allotcf.dto.review.WrongQuestionListItemDto;
import com.allotcf.entity.CanonicalQuestion;
import com.allotcf.entity.ExamSet;
import com.allotcf.entity.Question;
import com.allotcf.entity.User;
import com.allotcf.entity.UserQuestionBookmark;
import com.allotcf.entity.UserWrongQuestion;
import com.allotcf.repository.QuestionRepository;
import com.allotcf.repository.UserQuestionBookmarkRepository;
import com.allotcf.repository.UserWrongQuestionRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WrongQuestionServiceTest {

    @Mock
    UserWrongQuestionRepository userWrongQuestionRepository;

    @Mock
    UserQuestionBookmarkRepository userQuestionBookmarkRepository;

    @Mock
    QuestionRepository questionRepository;

    @InjectMocks
    WrongQuestionService wrongQuestionService;

    @Test
    void listReadingWrongQuestions_filters_by_wrong_count_bookmark_difficulty_and_keyword() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(7L);

        CanonicalQuestion canonicalQuestion1 = mock(CanonicalQuestion.class);
        when(canonicalQuestion1.getId()).thenReturn(101L);
        when(canonicalQuestion1.getCorrectAnswer()).thenReturn("B");
        when(canonicalQuestion1.getDifficultyLevel()).thenReturn("C2");

        UserWrongQuestion wrongQuestion1 = new UserWrongQuestion();
        wrongQuestion1.setUser(user);
        wrongQuestion1.setCanonicalQuestion(canonicalQuestion1);
        wrongQuestion1.setWrongCount(6);
        wrongQuestion1.setLastWrongAt(LocalDateTime.parse("2026-05-04T10:00:00"));
        wrongQuestion1.setLastUserAnswer("A");
        wrongQuestion1.setReviewStage(2);
        wrongQuestion1.setNextReviewAt(LocalDateTime.now().minusDays(1).withHour(0).withMinute(0).withSecond(0).withNano(0));
        wrongQuestion1.setLastReviewedAt(LocalDateTime.parse("2026-05-04T10:00:00"));
        wrongQuestion1.setLastReviewResult("CORRECT");

        CanonicalQuestion canonicalQuestion2 = mock(CanonicalQuestion.class);
        when(canonicalQuestion2.getId()).thenReturn(102L);

        UserWrongQuestion wrongQuestion2 = new UserWrongQuestion();
        wrongQuestion2.setUser(user);
        wrongQuestion2.setCanonicalQuestion(canonicalQuestion2);
        wrongQuestion2.setWrongCount(2);
        wrongQuestion2.setLastWrongAt(LocalDateTime.parse("2026-05-03T10:00:00"));
        wrongQuestion2.setLastUserAnswer("D");

        when(userWrongQuestionRepository.findByUserIdOrderByWrongCountDescLastWrongAtDesc(7L))
            .thenReturn(List.of(wrongQuestion1, wrongQuestion2));

        UserQuestionBookmark bookmark = new UserQuestionBookmark();
        bookmark.setCanonicalQuestion(canonicalQuestion1);
        when(userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(7L, List.of(101L, 102L)))
            .thenReturn(List.of(bookmark));

        Question question1 = mockQuestion(101L, "4", "关键句 travaille", "问题一", "选项A", "选项B", "选项C", "选项D", "TCF 阅读真题 01");
        when(questionRepository.findByCanonicalQuestionIdInOrderBySequenceOrderAsc(List.of(101L, 102L)))
            .thenReturn(List.of(question1));

        List<WrongQuestionListItemDto> result = wrongQuestionService.listReadingWrongQuestions(
            user,
            true,
            5,
            Set.of("C2"),
            "travaille",
            "ACTIVE"
        );

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCanonicalQuestionId()).isEqualTo(101L);
        assertThat(result.get(0).getDifficultyLevel()).isEqualTo("C2");
        assertThat(result.get(0).isBookmarked()).isTrue();
        assertThat(result.get(0).getSourceExamSets()).containsExactly("TCF 阅读真题 01 第 4 题");
        assertThat(result.get(0).getReviewStage()).isEqualTo(2);
        assertThat(result.get(0).getNextReviewAt()).isEqualTo(wrongQuestion1.getNextReviewAt());
        assertThat(result.get(0).getDueStatus()).isEqualTo("OVERDUE");
        assertThat(result.get(0).getOverdueDays()).isEqualTo(1);
    }

    @Test
    void listReadingWrongQuestions_hides_mastered_questions_by_default_and_can_include_them() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(7L);

        CanonicalQuestion activeCanonicalQuestion = mock(CanonicalQuestion.class);
        when(activeCanonicalQuestion.getId()).thenReturn(111L);
        when(activeCanonicalQuestion.getCorrectAnswer()).thenReturn("B");
        when(activeCanonicalQuestion.getDifficultyLevel()).thenReturn("B2");

        UserWrongQuestion activeQuestion = new UserWrongQuestion();
        activeQuestion.setUser(user);
        activeQuestion.setCanonicalQuestion(activeCanonicalQuestion);
        activeQuestion.setWrongCount(3);
        activeQuestion.setLastWrongAt(LocalDateTime.parse("2026-05-04T10:00:00"));
        activeQuestion.setLastUserAnswer("A");
        activeQuestion.setReviewStage(3);

        CanonicalQuestion masteredCanonicalQuestion = mock(CanonicalQuestion.class);
        when(masteredCanonicalQuestion.getId()).thenReturn(112L);
        when(masteredCanonicalQuestion.getCorrectAnswer()).thenReturn("C");
        when(masteredCanonicalQuestion.getDifficultyLevel()).thenReturn("C1");

        UserWrongQuestion masteredQuestion = new UserWrongQuestion();
        masteredQuestion.setUser(user);
        masteredQuestion.setCanonicalQuestion(masteredCanonicalQuestion);
        masteredQuestion.setWrongCount(8);
        masteredQuestion.setLastWrongAt(LocalDateTime.parse("2026-05-03T10:00:00"));
        masteredQuestion.setLastUserAnswer("D");
        masteredQuestion.setReviewStage(4);

        when(userWrongQuestionRepository.findByUserIdOrderByWrongCountDescLastWrongAtDesc(7L))
            .thenReturn(List.of(masteredQuestion, activeQuestion));
        when(userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(7L, List.of(112L, 111L)))
            .thenReturn(List.of());

        Question masteredSource = mockQuestion(112L, "8", "已掌握正文", "已掌握题", "A", "B", "C", "D", "TCF 阅读真题 01");
        Question activeSource = mockQuestion(111L, "4", "待复习正文", "待复习题", "A", "B", "C", "D", "TCF 阅读真题 02");
        when(questionRepository.findByCanonicalQuestionIdInOrderBySequenceOrderAsc(List.of(112L, 111L)))
            .thenReturn(List.of(masteredSource, activeSource));

        List<WrongQuestionListItemDto> activeOnly = wrongQuestionService.listReadingWrongQuestions(
            user,
            false,
            0,
            Set.of(),
            "",
            "ACTIVE"
        );

        assertThat(activeOnly).extracting(WrongQuestionListItemDto::getCanonicalQuestionId)
            .containsExactly(111L);
        assertThat(activeOnly.get(0).isMastered()).isFalse();

        List<WrongQuestionListItemDto> masteredOnly = wrongQuestionService.listReadingWrongQuestions(
            user,
            false,
            0,
            Set.of(),
            "",
            "MASTERED"
        );

        assertThat(masteredOnly).extracting(WrongQuestionListItemDto::getCanonicalQuestionId)
            .containsExactly(112L);
        assertThat(masteredOnly.get(0).isMastered()).isTrue();

        List<WrongQuestionListItemDto> allQuestions = wrongQuestionService.listReadingWrongQuestions(
            user,
            false,
            0,
            Set.of(),
            "",
            "ALL"
        );

        assertThat(allQuestions).extracting(WrongQuestionListItemDto::getCanonicalQuestionId)
            .containsExactly(112L, 111L);
    }

    @Test
    void listReadingTodayWrongQuestions_returns_overdue_and_due_today_first() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(7L);

        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);

        CanonicalQuestion overdueCanonicalQuestion = mock(CanonicalQuestion.class);
        when(overdueCanonicalQuestion.getId()).thenReturn(201L);
        when(overdueCanonicalQuestion.getCorrectAnswer()).thenReturn("B");
        when(overdueCanonicalQuestion.getDifficultyLevel()).thenReturn("B2");

        UserWrongQuestion overdueQuestion = new UserWrongQuestion();
        overdueQuestion.setUser(user);
        overdueQuestion.setCanonicalQuestion(overdueCanonicalQuestion);
        overdueQuestion.setWrongCount(3);
        overdueQuestion.setLastWrongAt(today.minusDays(3));
        overdueQuestion.setLastUserAnswer("A");
        overdueQuestion.setNextReviewAt(today.minusDays(2));

        CanonicalQuestion dueTodayCanonicalQuestion = mock(CanonicalQuestion.class);
        when(dueTodayCanonicalQuestion.getId()).thenReturn(202L);
        when(dueTodayCanonicalQuestion.getCorrectAnswer()).thenReturn("C");
        when(dueTodayCanonicalQuestion.getDifficultyLevel()).thenReturn("C1");

        UserWrongQuestion dueTodayQuestion = new UserWrongQuestion();
        dueTodayQuestion.setUser(user);
        dueTodayQuestion.setCanonicalQuestion(dueTodayCanonicalQuestion);
        dueTodayQuestion.setWrongCount(10);
        dueTodayQuestion.setLastWrongAt(today.minusDays(1));
        dueTodayQuestion.setLastUserAnswer("D");
        dueTodayQuestion.setNextReviewAt(today);

        when(userWrongQuestionRepository.findByUserIdAndNextReviewAtLessThanEqual(
            7L,
            today.withHour(23).withMinute(59).withSecond(59).withNano(999_999_999)
        )).thenReturn(List.of(dueTodayQuestion, overdueQuestion));
        when(userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(7L, List.of(202L, 201L)))
            .thenReturn(List.of());

        Question dueTodaySource = mockQuestion(202L, "9", "今天到期正文", "今天到期题", "A", "B", "C", "D", "TCF 阅读真题 01");
        Question overdueSource = mockQuestion(201L, "4", "逾期正文", "逾期题", "A", "B", "C", "D", "TCF 阅读真题 02");
        when(questionRepository.findByCanonicalQuestionIdInOrderBySequenceOrderAsc(List.of(202L, 201L)))
            .thenReturn(List.of(dueTodaySource, overdueSource));

        List<WrongQuestionListItemDto> result = wrongQuestionService.listReadingTodayWrongQuestions(
            user,
            false,
            0,
            Set.of(),
            ""
        );

        assertThat(result).extracting(WrongQuestionListItemDto::getCanonicalQuestionId)
            .containsExactly(201L, 202L);
        assertThat(result.get(0).getDueStatus()).isEqualTo("OVERDUE");
        assertThat(result.get(0).getOverdueDays()).isEqualTo(2);
        assertThat(result.get(1).getDueStatus()).isEqualTo("DUE_TODAY");
    }

    @Test
    void listReadingTodayWrongQuestions_hides_mastered_questions() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(7L);

        LocalDateTime today = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);

        CanonicalQuestion activeCanonicalQuestion = mock(CanonicalQuestion.class);
        when(activeCanonicalQuestion.getId()).thenReturn(211L);
        when(activeCanonicalQuestion.getCorrectAnswer()).thenReturn("B");
        when(activeCanonicalQuestion.getDifficultyLevel()).thenReturn("B2");

        UserWrongQuestion activeQuestion = new UserWrongQuestion();
        activeQuestion.setUser(user);
        activeQuestion.setCanonicalQuestion(activeCanonicalQuestion);
        activeQuestion.setWrongCount(3);
        activeQuestion.setLastWrongAt(today.minusDays(2));
        activeQuestion.setLastUserAnswer("A");
        activeQuestion.setReviewStage(3);
        activeQuestion.setNextReviewAt(today);

        CanonicalQuestion masteredCanonicalQuestion = mock(CanonicalQuestion.class);
        when(masteredCanonicalQuestion.getId()).thenReturn(212L);

        UserWrongQuestion masteredQuestion = new UserWrongQuestion();
        masteredQuestion.setUser(user);
        masteredQuestion.setCanonicalQuestion(masteredCanonicalQuestion);
        masteredQuestion.setWrongCount(6);
        masteredQuestion.setLastWrongAt(today.minusDays(5));
        masteredQuestion.setLastUserAnswer("C");
        masteredQuestion.setReviewStage(4);
        masteredQuestion.setNextReviewAt(today);

        when(userWrongQuestionRepository.findByUserIdAndNextReviewAtLessThanEqual(
            7L,
            today.withHour(23).withMinute(59).withSecond(59).withNano(999_999_999)
        )).thenReturn(List.of(masteredQuestion, activeQuestion));
        when(userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(7L, List.of(212L, 211L)))
            .thenReturn(List.of());

        Question activeSource = mockQuestion(211L, "4", "待复习正文", "待复习题", "A", "B", "C", "D", "TCF 阅读真题 02");
        Question masteredSource = mockQuestion(212L, "8", "已掌握正文", "已掌握题", "A", "B", "C", "D", "TCF 阅读真题 03");
        when(questionRepository.findByCanonicalQuestionIdInOrderBySequenceOrderAsc(List.of(212L, 211L)))
            .thenReturn(List.of(masteredSource, activeSource));

        List<WrongQuestionListItemDto> result = wrongQuestionService.listReadingTodayWrongQuestions(
            user,
            false,
            0,
            Set.of(),
            "",
            "ACTIVE"
        );

        assertThat(result).extracting(WrongQuestionListItemDto::getCanonicalQuestionId)
            .containsExactly(211L);

        List<WrongQuestionListItemDto> masteredResult = wrongQuestionService.listReadingTodayWrongQuestions(
            user,
            false,
            0,
            Set.of(),
            "",
            "MASTERED"
        );

        assertThat(masteredResult).extracting(WrongQuestionListItemDto::getCanonicalQuestionId)
            .containsExactly(212L);
    }

    @Test
    void recordReviewAttempt_advances_stage_after_correct_answer() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(7L);

        CanonicalQuestion canonicalQuestion = mock(CanonicalQuestion.class);
        when(canonicalQuestion.getId()).thenReturn(301L);
        when(canonicalQuestion.getCorrectAnswer()).thenReturn("B");
        when(canonicalQuestion.getDifficultyLevel()).thenReturn("B1");

        UserWrongQuestion wrongQuestion = new UserWrongQuestion();
        wrongQuestion.setUser(user);
        wrongQuestion.setCanonicalQuestion(canonicalQuestion);
        wrongQuestion.setWrongCount(4);
        wrongQuestion.setLastWrongAt(LocalDateTime.now().minusDays(2));
        wrongQuestion.setLastUserAnswer("A");
        wrongQuestion.setReviewStage(1);

        when(userWrongQuestionRepository.findByUserIdAndCanonicalQuestionId(7L, 301L))
            .thenReturn(Optional.of(wrongQuestion));
        when(userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionId(7L, 301L))
            .thenReturn(Optional.empty());
        Question source = mockQuestion(301L, "6", "复习正文", "复习题", "A", "B", "C", "D", "TCF 阅读真题 01");
        when(questionRepository.findByCanonicalQuestionIdInOrderBySequenceOrderAsc(List.of(301L)))
            .thenReturn(List.of(source));

        WrongQuestionListItemDto result = wrongQuestionService.recordReviewAttempt(301L, "B", user);

        assertThat(wrongQuestion.getReviewStage()).isEqualTo(2);
        assertThat(wrongQuestion.getLastReviewResult()).isEqualTo("CORRECT");
        assertThat(wrongQuestion.getLastReviewedAt()).isNotNull();
        assertThat(wrongQuestion.getNextReviewAt()).isNotNull();
        assertThat(result.getReviewStage()).isEqualTo(2);
    }

    @Test
    void recordReviewAttempt_resets_to_short_interval_after_wrong_answer() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(7L);

        CanonicalQuestion canonicalQuestion = mock(CanonicalQuestion.class);
        when(canonicalQuestion.getId()).thenReturn(302L);
        when(canonicalQuestion.getCorrectAnswer()).thenReturn("C");
        when(canonicalQuestion.getDifficultyLevel()).thenReturn("C1");

        UserWrongQuestion wrongQuestion = new UserWrongQuestion();
        wrongQuestion.setUser(user);
        wrongQuestion.setCanonicalQuestion(canonicalQuestion);
        wrongQuestion.setWrongCount(4);
        wrongQuestion.setLastWrongAt(LocalDateTime.now().minusDays(2));
        wrongQuestion.setLastUserAnswer("A");
        wrongQuestion.setReviewStage(3);

        when(userWrongQuestionRepository.findByUserIdAndCanonicalQuestionId(7L, 302L))
            .thenReturn(Optional.of(wrongQuestion));
        when(userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionId(7L, 302L))
            .thenReturn(Optional.empty());
        Question source = mockQuestion(302L, "7", "复习正文", "复习题", "A", "B", "C", "D", "TCF 阅读真题 01");
        when(questionRepository.findByCanonicalQuestionIdInOrderBySequenceOrderAsc(List.of(302L)))
            .thenReturn(List.of(source));

        WrongQuestionListItemDto result = wrongQuestionService.recordReviewAttempt(302L, "A", user);

        assertThat(wrongQuestion.getReviewStage()).isEqualTo(2);
        assertThat(wrongQuestion.getWrongCount()).isEqualTo(5);
        assertThat(wrongQuestion.getLastUserAnswer()).isEqualTo("A");
        assertThat(wrongQuestion.getLastReviewResult()).isEqualTo("WRONG");
        assertThat(wrongQuestion.getNextReviewAt()).isNotNull();
        assertThat(result.getWrongCount()).isEqualTo(5);
    }

    @Test
    void listReadingBookmarkedQuestions_includes_bookmarks_without_wrong_records_and_can_filter_wrong_only() {
        User user = mock(User.class);
        when(user.getId()).thenReturn(7L);

        CanonicalQuestion wrongCanonicalQuestion = mock(CanonicalQuestion.class);
        when(wrongCanonicalQuestion.getId()).thenReturn(101L);
        when(wrongCanonicalQuestion.getCorrectAnswer()).thenReturn("B");
        when(wrongCanonicalQuestion.getDifficultyLevel()).thenReturn("C2");

        CanonicalQuestion bookmarkOnlyCanonicalQuestion = mock(CanonicalQuestion.class);
        when(bookmarkOnlyCanonicalQuestion.getId()).thenReturn(102L);
        when(bookmarkOnlyCanonicalQuestion.getCorrectAnswer()).thenReturn("A");
        when(bookmarkOnlyCanonicalQuestion.getDifficultyLevel()).thenReturn("A1");

        UserQuestionBookmark wrongBookmark = new UserQuestionBookmark();
        wrongBookmark.setUser(user);
        wrongBookmark.setCanonicalQuestion(wrongCanonicalQuestion);

        UserQuestionBookmark bookmarkOnly = new UserQuestionBookmark();
        bookmarkOnly.setUser(user);
        bookmarkOnly.setCanonicalQuestion(bookmarkOnlyCanonicalQuestion);

        when(userQuestionBookmarkRepository.findByUserId(7L))
            .thenReturn(List.of(wrongBookmark, bookmarkOnly));

        UserWrongQuestion wrongQuestion = new UserWrongQuestion();
        wrongQuestion.setUser(user);
        wrongQuestion.setCanonicalQuestion(wrongCanonicalQuestion);
        wrongQuestion.setWrongCount(4);
        wrongQuestion.setLastWrongAt(LocalDateTime.parse("2026-05-04T10:00:00"));
        wrongQuestion.setLastUserAnswer("D");

        when(userWrongQuestionRepository.findByUserIdAndCanonicalQuestionIdInOrderByWrongCountDescLastWrongAtDesc(
            7L,
            List.of(101L, 102L)
        )).thenReturn(List.of(wrongQuestion));

        Question wrongSource = mockQuestion(101L, "8", "错过的收藏题正文", "错过的收藏题", "A", "B", "C", "D", "TCF 阅读真题 01");
        Question bookmarkOnlySource = mockQuestion(102L, "12", "只收藏题正文", "只收藏题", "A", "B", "C", "D", "TCF 阅读真题 02");
        when(questionRepository.findByCanonicalQuestionIdInOrderBySequenceOrderAsc(List.of(101L, 102L)))
            .thenReturn(List.of(wrongSource, bookmarkOnlySource));

        List<WrongQuestionListItemDto> allBookmarks = wrongQuestionService.listReadingBookmarkedQuestions(
            user,
            false,
            Set.of(),
            ""
        );

        assertThat(allBookmarks).extracting(WrongQuestionListItemDto::getCanonicalQuestionId)
            .containsExactly(101L, 102L);
        assertThat(allBookmarks.get(1).getWrongCount()).isZero();
        assertThat(allBookmarks.get(1).getLastWrongAt()).isNull();
        assertThat(allBookmarks.get(1).getSourceExamSets()).containsExactly("TCF 阅读真题 02 第 12 题");

        List<WrongQuestionListItemDto> wrongOnlyBookmarks = wrongQuestionService.listReadingBookmarkedQuestions(
            user,
            true,
            Set.of(),
            ""
        );

        assertThat(wrongOnlyBookmarks).extracting(WrongQuestionListItemDto::getCanonicalQuestionId)
            .containsExactly(101L);
    }

    private Question mockQuestion(
        Long canonicalQuestionId,
        String questionNo,
        String passage,
        String questionText,
        String optionA,
        String optionB,
        String optionC,
        String optionD,
        String examSetTitle
    ) {
        Question question = mock(Question.class);
        CanonicalQuestion canonicalQuestion = mock(CanonicalQuestion.class);
        when(canonicalQuestion.getId()).thenReturn(canonicalQuestionId);
        when(question.getCanonicalQuestion()).thenReturn(canonicalQuestion);
        when(question.getQuestionNo()).thenReturn(questionNo);
        when(question.getPassage()).thenReturn(passage);
        when(question.getQuestionText()).thenReturn(questionText);
        when(question.getOptionA()).thenReturn(optionA);
        when(question.getOptionB()).thenReturn(optionB);
        when(question.getOptionC()).thenReturn(optionC);
        when(question.getOptionD()).thenReturn(optionD);
        ExamSet examSet = mock(ExamSet.class);
        when(examSet.getTitle()).thenReturn(examSetTitle);
        when(question.getExamSet()).thenReturn(examSet);
        return question;
    }
}
