package com.allotcf.dto.practice;

import java.util.List;

public class SubmitRequest {

    private List<AnswerItem> answers;

    public List<AnswerItem> getAnswers() {
        return answers;
    }

    public void setAnswers(List<AnswerItem> answers) {
        this.answers = answers;
    }
}
