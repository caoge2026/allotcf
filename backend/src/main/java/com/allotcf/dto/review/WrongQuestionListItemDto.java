package com.allotcf.dto.review;

import java.time.LocalDateTime;
import java.util.List;

public class WrongQuestionListItemDto {

    private final Long canonicalQuestionId;
    private final String questionText;
    private final String passage;
    private final String optionA;
    private final String optionB;
    private final String optionC;
    private final String optionD;
    private final String correctAnswer;
    private final String difficultyLevel;
    private final int wrongCount;
    private final LocalDateTime lastWrongAt;
    private final String lastUserAnswer;
    private final int reviewStage;
    private final LocalDateTime nextReviewAt;
    private final String dueStatus;
    private final long overdueDays;
    private final boolean mastered;
    private final boolean bookmarked;
    private final List<String> sourceExamSets;

    public WrongQuestionListItemDto(
        Long canonicalQuestionId,
        String questionText,
        String passage,
        String optionA,
        String optionB,
        String optionC,
        String optionD,
        String correctAnswer,
        String difficultyLevel,
        int wrongCount,
        LocalDateTime lastWrongAt,
        String lastUserAnswer,
        int reviewStage,
        LocalDateTime nextReviewAt,
        String dueStatus,
        long overdueDays,
        boolean mastered,
        boolean bookmarked,
        List<String> sourceExamSets
    ) {
        this.canonicalQuestionId = canonicalQuestionId;
        this.questionText = questionText;
        this.passage = passage;
        this.optionA = optionA;
        this.optionB = optionB;
        this.optionC = optionC;
        this.optionD = optionD;
        this.correctAnswer = correctAnswer;
        this.difficultyLevel = difficultyLevel;
        this.wrongCount = wrongCount;
        this.lastWrongAt = lastWrongAt;
        this.lastUserAnswer = lastUserAnswer;
        this.reviewStage = reviewStage;
        this.nextReviewAt = nextReviewAt;
        this.dueStatus = dueStatus;
        this.overdueDays = overdueDays;
        this.mastered = mastered;
        this.bookmarked = bookmarked;
        this.sourceExamSets = sourceExamSets;
    }

    public Long getCanonicalQuestionId() {
        return canonicalQuestionId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public String getPassage() {
        return passage;
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

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public String getDifficultyLevel() {
        return difficultyLevel;
    }

    public int getWrongCount() {
        return wrongCount;
    }

    public LocalDateTime getLastWrongAt() {
        return lastWrongAt;
    }

    public String getLastUserAnswer() {
        return lastUserAnswer;
    }

    public int getReviewStage() {
        return reviewStage;
    }

    public LocalDateTime getNextReviewAt() {
        return nextReviewAt;
    }

    public String getDueStatus() {
        return dueStatus;
    }

    public long getOverdueDays() {
        return overdueDays;
    }

    public boolean isMastered() {
        return mastered;
    }

    public boolean isBookmarked() {
        return bookmarked;
    }

    public List<String> getSourceExamSets() {
        return sourceExamSets;
    }
}
