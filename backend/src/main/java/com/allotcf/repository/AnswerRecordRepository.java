package com.allotcf.repository;

import com.allotcf.entity.AnswerRecord;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerRecordRepository extends JpaRepository<AnswerRecord, Long> {

    List<AnswerRecord> findByPracticeSessionId(Long sessionId);
}
