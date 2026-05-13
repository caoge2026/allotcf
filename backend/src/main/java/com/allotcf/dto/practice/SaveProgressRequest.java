package com.allotcf.dto.practice;

import java.util.List;

public class SaveProgressRequest {

    private Integer currentIndex;
    private Integer pausedRemainingSeconds;
    private List<AnswerItem> answers;

    public Integer getCurrentIndex() {
        return currentIndex;
    }

    public void setCurrentIndex(Integer currentIndex) {
        this.currentIndex = currentIndex;
    }

    public Integer getPausedRemainingSeconds() {
        return pausedRemainingSeconds;
    }

    public void setPausedRemainingSeconds(Integer pausedRemainingSeconds) {
        this.pausedRemainingSeconds = pausedRemainingSeconds;
    }

    public List<AnswerItem> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerItem> answers) {
        this.answers = answers;
    }
}
