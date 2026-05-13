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
@Table(name = "user_exam_set_progress")
public class UserExamSetProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_set_id", nullable = false)
    private ExamSet examSet;

    @Column(nullable = false, length = 20)
    private String status = "NOT_STARTED";

    @Column(name = "latest_session_id")
    private Long latestSessionId;

    @Column(name = "current_index")
    private Integer currentIndex;

    @Column(name = "answered_count")
    private Integer answeredCount;

    @Column(name = "total_count")
    private Integer totalCount;

    @Column(name = "paused_remaining_seconds")
    private Integer pausedRemainingSeconds;

    @Column
    private Integer score;

    @Column(name = "nclc_level_label", length = 50)
    private String nclcLevelLabel;

    @Column(name = "answers_json", columnDefinition = "LONGTEXT")
    private String answersJson;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public ExamSet getExamSet() {
        return examSet;
    }

    public void setExamSet(ExamSet examSet) {
        this.examSet = examSet;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getLatestSessionId() {
        return latestSessionId;
    }

    public void setLatestSessionId(Long latestSessionId) {
        this.latestSessionId = latestSessionId;
    }

    public Integer getCurrentIndex() {
        return currentIndex;
    }

    public void setCurrentIndex(Integer currentIndex) {
        this.currentIndex = currentIndex;
    }

    public Integer getAnsweredCount() {
        return answeredCount;
    }

    public void setAnsweredCount(Integer answeredCount) {
        this.answeredCount = answeredCount;
    }

    public Integer getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(Integer totalCount) {
        this.totalCount = totalCount;
    }

    public Integer getPausedRemainingSeconds() {
        return pausedRemainingSeconds;
    }

    public void setPausedRemainingSeconds(Integer pausedRemainingSeconds) {
        this.pausedRemainingSeconds = pausedRemainingSeconds;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public String getNclcLevelLabel() {
        return nclcLevelLabel;
    }

    public void setNclcLevelLabel(String nclcLevelLabel) {
        this.nclcLevelLabel = nclcLevelLabel;
    }

    public String getAnswersJson() {
        return answersJson;
    }

    public void setAnswersJson(String answersJson) {
        this.answersJson = answersJson;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
