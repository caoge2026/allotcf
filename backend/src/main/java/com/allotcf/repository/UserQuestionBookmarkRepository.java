package com.allotcf.repository;

import com.allotcf.entity.UserQuestionBookmark;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserQuestionBookmarkRepository extends JpaRepository<UserQuestionBookmark, Long> {

    Optional<UserQuestionBookmark> findByUserIdAndCanonicalQuestionId(Long userId, Long canonicalQuestionId);

    List<UserQuestionBookmark> findByUserId(Long userId);

    List<UserQuestionBookmark> findByUserIdAndCanonicalQuestionIdIn(Long userId, List<Long> canonicalQuestionIds);

    void deleteByUserIdAndCanonicalQuestionId(Long userId, Long canonicalQuestionId);
}
