package com.allotcf.repository;

import com.allotcf.entity.CanonicalQuestion;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CanonicalQuestionRepository extends JpaRepository<CanonicalQuestion, Long> {

    Optional<CanonicalQuestion> findByDedupeKey(String dedupeKey);
}
