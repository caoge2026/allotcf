package com.allotcf.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_question_bookmark")
public class UserQuestionBookmark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canonical_question_id", nullable = false)
    private CanonicalQuestion canonicalQuestion;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public CanonicalQuestion getCanonicalQuestion() {
        return canonicalQuestion;
    }

    public void setCanonicalQuestion(CanonicalQuestion canonicalQuestion) {
        this.canonicalQuestion = canonicalQuestion;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
