package com.allotcf.dto.practice;

public class StartPracticeResponse {

    private final Long sessionId;

    public StartPracticeResponse(Long sessionId) {
        this.sessionId = sessionId;
    }

    public Long getSessionId() {
        return sessionId;
    }
}
