package com.allotcf.repository;

import com.allotcf.entity.PracticeSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PracticeSessionRepository extends JpaRepository<PracticeSession, Long> {
    Optional<PracticeSession> findByIdAndUserId(Long id, Long userId);
}
