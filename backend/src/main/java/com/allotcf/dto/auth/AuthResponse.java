package com.allotcf.dto.auth;

public class AuthResponse {

    private final String token;
    private final String email;
    private final String nickname;
    private final String userType;
    private final Integer guestActionCount;
    private final Integer guestActionLimit;

    public AuthResponse(String token, String email, String nickname) {
        this(token, email, nickname, "REGISTERED", null, null);
    }

    public AuthResponse(
        String token,
        String email,
        String nickname,
        String userType,
        Integer guestActionCount,
        Integer guestActionLimit
    ) {
        this.token = token;
        this.email = email;
        this.nickname = nickname;
        this.userType = userType;
        this.guestActionCount = guestActionCount;
        this.guestActionLimit = guestActionLimit;
    }

    public String getToken() {
        return token;
    }

    public String getEmail() {
        return email;
    }

    public String getNickname() {
        return nickname;
    }

    public String getUserType() {
        return userType;
    }

    public Integer getGuestActionCount() {
        return guestActionCount;
    }

    public Integer getGuestActionLimit() {
        return guestActionLimit;
    }
}
