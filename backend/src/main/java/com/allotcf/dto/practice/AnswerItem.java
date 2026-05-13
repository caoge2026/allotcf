package com.allotcf.dto.practice;

public class AnswerItem {

    private Long questionId;
    private String userAnswer;
    private Integer timeSpentSeconds;

    public AnswerItem() {
    }

    public AnswerItem(Long questionId, String userAnswer, Integer timeSpentSeconds) {
        this.questionId = questionId;
        this.userAnswer = userAnswer;
        this.timeSpentSeconds = timeSpentSeconds;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getUserAnswer() {
        return userAnswer;
    }

    public void setUserAnswer(String userAnswer) {
        this.userAnswer = userAnswer;
    }

    public Integer getTimeSpentSeconds() {
        return timeSpentSeconds;
    }

    public void setTimeSpentSeconds(Integer timeSpentSeconds) {
        this.timeSpentSeconds = timeSpentSeconds;
    }
}
