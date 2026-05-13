package com.allotcf.repository;

import com.allotcf.entity.Question;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByExamSetIdOrderBySequenceOrderAsc(Long examSetId);

    List<Question> findByCanonicalQuestionIdInOrderBySequenceOrderAsc(List<Long> canonicalQuestionIds);

    Optional<Question> findFirstByCanonicalQuestionId(Long canonicalQuestionId);
}
