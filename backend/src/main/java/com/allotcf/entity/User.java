package com.allotcf.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 200)
    private String email;

    @Column(nullable = false, length = 100)
    private String password;

    @Column(length = 50)
    private String nickname;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "user_type", nullable = false, length = 20)
    private String userType = "REGISTERED";

    @Column(name = "guest_action_count", nullable = false)
    private Integer guestActionCount = 0;

    @Column(name = "guest_action_limit", nullable = false)
    private Integer guestActionLimit = 10;

    @Column(name = "guest_expires_at")
    private LocalDateTime guestExpiresAt;

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(LocalDateTime lastLogin) {
        this.lastLogin = lastLogin;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }

    public Integer getGuestActionCount() {
        return guestActionCount;
    }

    public void setGuestActionCount(Integer guestActionCount) {
        this.guestActionCount = guestActionCount;
    }

    public Integer getGuestActionLimit() {
        return guestActionLimit;
    }

    public void setGuestActionLimit(Integer guestActionLimit) {
        this.guestActionLimit = guestActionLimit;
    }

    public LocalDateTime getGuestExpiresAt() {
        return guestExpiresAt;
    }

    public void setGuestExpiresAt(LocalDateTime guestExpiresAt) {
        this.guestExpiresAt = guestExpiresAt;
    }
}
