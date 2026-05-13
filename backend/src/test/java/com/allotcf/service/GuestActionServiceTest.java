package com.allotcf.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.allotcf.entity.User;
import com.allotcf.exception.GuestLimitReachedException;
import com.allotcf.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GuestActionServiceTest {

    @Mock
    UserRepository userRepository;

    @InjectMocks
    GuestActionService guestActionService;

    @Test
    void registered_user_does_not_consume_guest_action() {
        User user = new User();
        user.setUserType("REGISTERED");

        guestActionService.consumeIfGuest(user);

        verify(userRepository, never()).save(user);
    }

    @Test
    void guest_action_increments_count_after_successful_action() {
        User user = new User();
        user.setUserType("GUEST");
        user.setGuestActionCount(4);
        user.setGuestActionLimit(10);
        when(userRepository.save(user)).thenReturn(user);

        guestActionService.consumeIfGuest(user);

        assertThat(user.getGuestActionCount()).isEqualTo(5);
        verify(userRepository).save(user);
    }

    @Test
    void guest_action_throws_when_limit_reached() {
        User user = new User();
        user.setUserType("GUEST");
        user.setGuestActionCount(10);
        user.setGuestActionLimit(10);

        assertThatThrownBy(() -> guestActionService.consumeIfGuest(user))
            .isInstanceOf(GuestLimitReachedException.class)
            .hasMessageContaining("访客预览次数已用完");

        verify(userRepository, never()).save(user);
    }
}
