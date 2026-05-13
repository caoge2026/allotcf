package com.allotcf.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "question")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_set_id", nullable = false)
    private ExamSet examSet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canonical_question_id", nullable = false)
    private CanonicalQuestion canonicalQuestion;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder;

    @Column(name = "question_no", length = 20)
    private String questionNo;

    @Column(columnDefinition = "TEXT")
    private String passage;

    @Column(name = "question_text", nullable = false, length = 500)
    private String questionText;

    @Column(name = "option_a", nullable = false, length = 300)
    private String optionA;

    @Column(name = "option_b", nullable = false, length = 300)
    private String optionB;

    @Column(name = "option_c", nullable = false, length = 300)
    private String optionC;

    @Column(name = "option_d", nullable = false, length = 300)
    private String optionD;

    @Column(name = "correct_answer", nullable = false, columnDefinition = "CHAR(1)")
    private String correctAnswer;

    public Long getId() {
        return id;
    }

    public ExamSet getExamSet() {
        return examSet;
    }

    public Integer getSequenceOrder() {
        return sequenceOrder;
    }

    public CanonicalQuestion getCanonicalQuestion() {
        return canonicalQuestion;
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

    public String getCorrectAnswer() {
        return correctAnswer;
    }
}
