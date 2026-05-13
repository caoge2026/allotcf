package com.allotcf.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.allotcf.config.JwtFilter;
import com.allotcf.config.JwtUtil;
import com.allotcf.config.SecurityConfig;
import com.allotcf.dto.auth.AuthResponse;
import com.allotcf.repository.UserRepository;
import com.allotcf.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtUtil.class, JwtFilter.class})
@TestPropertySource(properties = {
    "jwt.secret=test-secret-key-at-least-32-characters-long",
    "jwt.expiration=86400000"
})
class AuthControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockBean
    AuthService authService;

    @MockBean
    UserRepository userRepository;

    @Test
    void login_returns_token() throws Exception {
        when(authService.login(any()))
            .thenReturn(new AuthResponse("test-token", "user@example.com", "TestUser"));

        String body = "{\"email\":\"user@example.com\",\"password\":\"password123\"}";

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("test-token"));
    }

    @Test
    void guest_login_returns_guest_token_and_limit() throws Exception {
        when(authService.loginAsGuest())
            .thenReturn(new AuthResponse("guest-token", "guest_abc@guest.allotcf", "访客用户", "GUEST", 0, 10));

        mockMvc.perform(post("/api/auth/guest"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("guest-token"))
            .andExpect(jsonPath("$.email").value("guest_abc@guest.allotcf"))
            .andExpect(jsonPath("$.nickname").value("访客用户"))
            .andExpect(jsonPath("$.userType").value("GUEST"))
            .andExpect(jsonPath("$.guestActionCount").value(0))
            .andExpect(jsonPath("$.guestActionLimit").value(10));
    }

    @Test
    void login_allows_https_origin_from_production_ip() throws Exception {
        when(authService.login(any()))
            .thenReturn(new AuthResponse("test-token", "user@example.com", "TestUser"));

        String body = "{\"email\":\"user@example.com\",\"password\":\"password123\"}";

        mockMvc.perform(post("/api/auth/login")
                .header("Origin", "https://47.94.88.161")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("test-token"));
    }

    @Test
    void login_allows_https_origin_from_production_domain() throws Exception {
        when(authService.login(any()))
            .thenReturn(new AuthResponse("test-token", "user@example.com", "TestUser"));

        String body = "{\"email\":\"user@example.com\",\"password\":\"password123\"}";

        mockMvc.perform(post("/api/auth/login")
                .header("Origin", "https://allotcf.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("test-token"));

        mockMvc.perform(post("/api/auth/login")
                .header("Origin", "https://www.allotcf.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("test-token"));
    }

    @Test
    void login_allows_localhost_5174_origin() throws Exception {
        when(authService.login(any()))
            .thenReturn(new AuthResponse("test-token", "user@example.com", "TestUser"));

        String body = "{\"email\":\"user@example.com\",\"password\":\"password123\"}";

        mockMvc.perform(post("/api/auth/login")
                .header("Origin", "http://localhost:5174")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("test-token"));
    }

    @Test
    void login_preflight_allows_lan_vite_origin_for_mobile_testing() throws Exception {
        mockMvc.perform(options("/api/auth/login")
                .header("Origin", "http://192.168.0.108:5174")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "content-type"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://192.168.0.108:5174"));
    }
}
