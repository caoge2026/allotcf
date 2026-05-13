package com.allotcf.dto.practice;

import java.util.List;

public class PracticeResultDto {

    private final Long sessionId;
    private final int totalCount;
    private final int correctCount;
    private final int score;
    private final String nclcLevelLabel;
    private final List<QuestionResultDto> details;

    public PracticeResultDto(
        Long sessionId,
        int totalCount,
        int correctCount,
        int score,
        String nclcLevelLabel,
        List<QuestionResultDto> details
    ) {
        this.sessionId = sessionId;
        this.totalCount = totalCount;
        this.correctCount = correctCount;
        this.score = score;
        this.nclcLevelLabel = nclcLevelLabel;
        this.details = details;
    }

    public Long getSessionId() {
        return sessionId;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public int getCorrectCount() {
        return correctCount;
    }

    public int getScore() {
        return score;
    }

    public String getNclcLevelLabel() {
        return nclcLevelLabel;
    }

    public List<QuestionResultDto> getDetails() {
        return details;
    }
}
