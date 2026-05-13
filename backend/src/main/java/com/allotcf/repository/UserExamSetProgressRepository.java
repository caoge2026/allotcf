package com.allotcf.repository;

import com.allotcf.entity.UserExamSetProgress;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserExamSetProgressRepository extends JpaRepository<UserExamSetProgress, Long> {

    Optional<UserExamSetProgress> findByUserIdAndExamSetId(Long userId, Long examSetId);
}
