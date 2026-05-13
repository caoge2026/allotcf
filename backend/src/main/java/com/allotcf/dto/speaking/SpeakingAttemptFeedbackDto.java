package com.allotcf.dto.speaking;

import java.util.List;

public class SpeakingAttemptFeedbackDto {

    private final Long attemptId;
    private final int score;
    private final String summary;
    private final List<String> strengths;
    private final List<String> improvements;
    private final String referenceAnswer;

    public SpeakingAttemptFeedbackDto(
        Long attemptId,
        int score,
        String summary,
        List<String> strengths,
        List<String> improvements,
        String referenceAnswer
    ) {
        this.attemptId = attemptId;
        this.score = score;
        this.summary = summary;
        this.strengths = strengths;
        this.improvements = improvements;
        this.referenceAnswer = referenceAnswer;
    }

    public Long getAttemptId() {
        return attemptId;
    }

    public int getScore() {
        return score;
    }

    public String getSummary() {
        return summary;
    }

    public List<String> getStrengths() {
        return strengths;
    }

    public List<String> getImprovements() {
        return improvements;
    }

    public String getReferenceAnswer() {
        return referenceAnswer;
    }
}
