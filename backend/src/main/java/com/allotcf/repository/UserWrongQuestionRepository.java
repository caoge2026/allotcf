package com.allotcf.repository;

import com.allotcf.entity.UserWrongQuestion;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserWrongQuestionRepository extends JpaRepository<UserWrongQuestion, Long> {

    Optional<UserWrongQuestion> findByUserIdAndCanonicalQuestionId(Long userId, Long canonicalQuestionId);

    List<UserWrongQuestion> findByUserIdOrderByWrongCountDescLastWrongAtDesc(Long userId);

    List<UserWrongQuestion> findByUserIdAndCanonicalQuestionIdInOrderByWrongCountDescLastWrongAtDesc(
        Long userId,
        List<Long> canonicalQuestionIds
    );

    List<UserWrongQuestion> findByUserIdAndNextReviewAtLessThanEqual(Long userId, LocalDateTime endOfToday);
}
