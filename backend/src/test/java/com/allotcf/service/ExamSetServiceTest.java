package com.allotcf.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.allotcf.dto.exam.ExamSetDetailDto;
import com.allotcf.dto.exam.ExamSetDto;
import com.allotcf.entity.CanonicalQuestion;
import com.allotcf.entity.ExamSet;
import com.allotcf.entity.Question;
import com.allotcf.entity.User;
import com.allotcf.entity.UserExamSetProgress;
import com.allotcf.entity.UserQuestionBookmark;
import com.allotcf.repository.ExamSetRepository;
import com.allotcf.repository.UserExamSetProgressRepository;
import com.allotcf.repository.UserQuestionBookmarkRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class ExamSetServiceTest {

    @Mock
    ExamSetRepository examSetRepository;

    @Mock
    UserExamSetProgressRepository userExamSetProgressRepository;

    @Mock
    UserQuestionBookmarkRepository userQuestionBookmarkRepository;

    @InjectMocks
    ExamSetService examSetService;

    @Test
    void listAll_returns_dto_list() {
        ExamSet examSet = new ExamSet();
        when(examSetRepository.findAll()).thenReturn(List.of(examSet));

        List<ExamSetDto> result = examSetService.listAll();

        assertThat(result).hasSize(1);
    }

    @Test
    void getDetail_not_found_throws() {
        when(examSetRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> examSetService.getDetail(99L, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("题库不存在");
    }

    @Test
    void getDetail_returns_canonical_question_id_and_user_bookmark_state() {
        User user = mock(User.class);
        ExamSet examSet = mock(ExamSet.class);
        Question question = mock(Question.class);
        CanonicalQuestion canonicalQuestion = mock(CanonicalQuestion.class);
        UserQuestionBookmark bookmark = new UserQuestionBookmark();
        bookmark.setCanonicalQuestion(canonicalQuestion);

        when(user.getId()).thenReturn(7L);
        when(examSet.getId()).thenReturn(2L);
        when(examSet.getTitle()).thenReturn("TCF 阅读真题 01");
        when(examSet.getType()).thenReturn("READING");
        when(examSet.getQuestions()).thenReturn(List.of(question));
        when(question.getId()).thenReturn(10L);
        when(question.getCanonicalQuestion()).thenReturn(canonicalQuestion);
        when(question.getSequenceOrder()).thenReturn(1);
        when(question.getQuestionNo()).thenReturn("1");
        when(question.getPassage()).thenReturn("正文");
        when(question.getQuestionText()).thenReturn("题干");
        when(question.getOptionA()).thenReturn("A");
        when(question.getOptionB()).thenReturn("B");
        when(question.getOptionC()).thenReturn("C");
        when(question.getOptionD()).thenReturn("D");
        when(canonicalQuestion.getId()).thenReturn(100L);
        when(examSetRepository.findById(2L)).thenReturn(Optional.of(examSet));
        when(userQuestionBookmarkRepository.findByUserIdAndCanonicalQuestionIdIn(7L, List.of(100L)))
            .thenReturn(List.of(bookmark));

        ExamSetDetailDto result = examSetService.getDetail(2L, user);

        assertThat(result.getQuestions().get(0).getCanonicalQuestionId()).isEqualTo(100L);
        assertThat(result.getQuestions().get(0).isBookmarked()).isTrue();
    }

    @Test
    void listForUser_returns_account_level_practice_status() {
        User user = new User();
        ExamSet examSet = mock(ExamSet.class);
        UserExamSetProgress progress = new UserExamSetProgress();
        progress.setStatus("IN_PROGRESS");
        progress.setCurrentIndex(10);
        progress.setTotalCount(39);
        progress.setLatestSessionId(123L);

        when(examSet.getId()).thenReturn(2L);
        when(examSet.getTitle()).thenReturn("TCF 阅读真题 01");
        when(examSet.getType()).thenReturn("READING");
        when(examSet.getQuestions()).thenReturn(List.of());
        when(examSetRepository.findAll()).thenReturn(List.of(examSet));
        when(userExamSetProgressRepository.findByUserIdAndExamSetId(user.getId(), 2L))
            .thenReturn(Optional.of(progress));

        List<ExamSetDto> result = examSetService.listForUser(user);

        assertThat(result.get(0).getPracticeStatus()).isEqualTo("IN_PROGRESS");
        assertThat(result.get(0).getCurrentIndex()).isEqualTo(10);
        assertThat(result.get(0).getLatestSessionId()).isEqualTo(123L);
    }
}
