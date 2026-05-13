package com.allotcf.dto.practice;

public class QuestionResultDto {

    private final Long questionId;
    private final Long canonicalQuestionId;
    private final Integer sequenceOrder;
    private final String questionNo;
    private final String passage;
    private final String questionText;
    private final String optionA;
    private final String optionB;
    private final String optionC;
    private final String optionD;
    private final String userAnswer;
    private final String correctAnswer;
    private final boolean isCorrect;
    private final boolean bookmarked;

    public QuestionResultDto(
        Long questionId,
        Long canonicalQuestionId,
        Integer sequenceOrder,
        String questionNo,
        String passage,
        String questionText,
        String optionA,
        String optionB,
        String optionC,
        String optionD,
        String userAnswer,
        String correctAnswer,
        boolean isCorrect,
        boolean bookmarked
    ) {
        this.questionId = questionId;
        this.canonicalQuestionId = canonicalQuestionId;
        this.sequenceOrder = sequenceOrder;
        this.questionNo = questionNo;
        this.passage = passage;
        this.questionText = questionText;
        this.optionA = optionA;
        this.optionB = optionB;
        this.optionC = optionC;
        this.optionD = optionD;
        this.userAnswer = userAnswer;
        this.correctAnswer = correctAnswer;
        this.isCorrect = isCorrect;
        this.bookmarked = bookmarked;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public Long getCanonicalQuestionId() {
        return canonicalQuestionId;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public String getQuestionNo() {
        return questionNo;
    }

    public String getPassage() {
        return passage;
    }

    public String getQuestionText() {
        return questionText;
    }

    public String getOptionA() {
        return optionA;
    }

    public String getOptionB() {
        return optionB;
    }

    public String getOptionC() {
        return optionC;
    }

    public String getOptionD() {
        return optionD;
    }

    public String getUserAnswer() {
        return userAnswer;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public boolean isCorrect() {
        return isCorrect;
    }

    public boolean isBookmarked() {
        return bookmarked;
    }
}
