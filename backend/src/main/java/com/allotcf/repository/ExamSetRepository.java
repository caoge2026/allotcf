package com.allotcf.repository;

import com.allotcf.entity.ExamSet;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExamSetRepository extends JpaRepository<ExamSet, Long> {
    @Query("""
        select q.examSet.id, count(q.id)
        from Question q
        where q.examSet.id in :examSetIds
        group by q.examSet.id
        """)
    List<Object[]> countQuestionsByExamSetIds(@Param("examSetIds") List<Long> examSetIds);
}
