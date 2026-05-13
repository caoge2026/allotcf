package com.allotcf.service;

import com.allotcf.config.JwtUtil;
import com.allotcf.dto.auth.AuthResponse;
import com.allotcf.dto.auth.LoginRequest;
import com.allotcf.dto.auth.RegisterRequest;
import com.allotcf.entity.User;
import com.allotcf.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("邮箱已注册");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname());
        return userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new IllegalArgumentException("邮箱或密码错误"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("邮箱或密码错误");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());
        return toAuthResponse(user, token);
    }

    public AuthResponse loginAsGuest() {
        User user = new User();
        user.setEmail("guest_" + UUID.randomUUID() + "@guest.allotcf");
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setNickname("访客用户");
        user.setUserType("GUEST");
        user.setGuestActionCount(0);
        user.setGuestActionLimit(10);
        user.setLastLogin(LocalDateTime.now());
        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getEmail());
        return toAuthResponse(savedUser, token);
    }

    private AuthResponse toAuthResponse(User user, String token) {
        Integer guestActionCount = "GUEST".equals(user.getUserType()) ? user.getGuestActionCount() : null;
        Integer guestActionLimit = "GUEST".equals(user.getUserType()) ? user.getGuestActionLimit() : null;
        return new AuthResponse(
            token,
            user.getEmail(),
            user.getNickname(),
            user.getUserType(),
            guestActionCount,
            guestActionLimit
        );
    }
}
