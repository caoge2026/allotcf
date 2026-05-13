package com.allotcf.dto.exam;

public class QuestionDto {

    private final Long id;
    private final Integer sequenceOrder;
    private final String questionNo;
    private final String passage;
    private final String questionText;
    private final String optionA;
    private final String optionB;
    private final String optionC;
    private final String optionD;
    private final Long canonicalQuestionId;
    private final boolean bookmarked;

    public QuestionDto(
        Long id,
        Integer sequenceOrder,
        String questionNo,
        String passage,
        String questionText,
        String optionA,
        String optionB,
        String optionC,
        String optionD,
        Long canonicalQuestionId,
        boolean bookmarked
    ) {
        this.id = id;
        this.sequenceOrder = sequenceOrder;
        this.questionNo = questionNo;
        this.passage = passage;
        this.questionText = questionText;
        this.optionA = optionA;
        this.optionB = optionB;
        this.optionC = optionC;
        this.optionD = optionD;
        this.canonicalQuestionId = canonicalQuestionId;
        this.bookmarked = bookmarked;
    }

    public Long getId() {
        return id;
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

    public Long getCanonicalQuestionId() {
        return canonicalQuestionId;
    }

    public boolean isBookmarked() {
        return bookmarked;
    }
}
