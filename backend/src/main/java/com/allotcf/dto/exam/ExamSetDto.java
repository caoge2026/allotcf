package com.allotcf.dto.exam;

import java.time.LocalDateTime;

public class ExamSetDto {

    private final Long id;
    private final String title;
    private final String type;
    private final LocalDateTime createdAt;
    private final int questionCount;
    private final String practiceStatus;
    private final Long latestSessionId;
    private final Integer currentIndex;
    private final Integer answeredCount;
    private final Integer totalCount;
    private final Integer pausedRemainingSeconds;
    private final Integer score;
    private final String nclcLevelLabel;
    private final String answersJson;

    public ExamSetDto(Long id, String title, String type, LocalDateTime createdAt, int questionCount) {
        this(id, title, type, createdAt, questionCount, "NOT_STARTED", null, null, null, null, null, null, null, null);
    }

    public ExamSetDto(
        Long id,
        String title,
        String type,
        LocalDateTime createdAt,
        int questionCount,
        String practiceStatus,
        Long latestSessionId,
        Integer currentIndex,
        Integer answeredCount,
        Integer totalCount,
        Integer pausedRemainingSeconds,
        Integer score,
        String nclcLevelLabel,
        String answersJson
    ) {
        this.id = id;
        this.title = title;
        this.type = type;
        this.createdAt = createdAt;
        this.questionCount = questionCount;
        this.practiceStatus = practiceStatus;
        this.latestSessionId = latestSessionId;
        this.currentIndex = currentIndex;
        this.answeredCount = answeredCount;
        this.totalCount = totalCount;
        this.pausedRemainingSeconds = pausedRemainingSeconds;
        this.score = score;
        this.nclcLevelLabel = nclcLevelLabel;
        this.answersJson = answersJson;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getType() {
        return type;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public int getQuestionCount() {
        return questionCount;
    }

    public String getPracticeStatus() {
        return practiceStatus;
    }

    public Long getLatestSessionId() {
        return latestSessionId;
    }

    public Integer getCurrentIndex() {
        return currentIndex;
    }

    public Integer getAnsweredCount() {
        return answeredCount;
    }

    public Integer getTotalCount() {
        return totalCount;
    }

    public Integer getPausedRemainingSeconds() {
        return pausedRemainingSeconds;
    }

    public Integer getScore() {
        return score;
    }

    public String getNclcLevelLabel() {
        return nclcLevelLabel;
    }

    public String getAnswersJson() {
        return answersJson;
    }
}
