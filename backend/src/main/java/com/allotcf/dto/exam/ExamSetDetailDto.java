package com.allotcf.dto.exam;

import java.util.List;

public class ExamSetDetailDto {

    private final Long id;
    private final String title;
    private final String type;
    private final List<QuestionDto> questions;

    public ExamSetDetailDto(Long id, String title, String type, List<QuestionDto> questions) {
        this.id = id;
        this.title = title;
        this.type = type;
        this.questions = questions;
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

    public List<QuestionDto> getQuestions() {
        return questions;
    }
}
