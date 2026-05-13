package com.allotcf.service;

import com.allotcf.entity.User;
import com.allotcf.exception.GuestLimitReachedException;
import com.allotcf.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GuestActionService {

    private static final String GUEST_USER_TYPE = "GUEST";

    private final UserRepository userRepository;

    public GuestActionService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public void consumeIfGuest(User user) {
        requireAllowed(user);
        if (user == null || !GUEST_USER_TYPE.equals(user.getUserType())) {
            return;
        }

        int actionCount = user.getGuestActionCount() == null ? 0 : user.getGuestActionCount();
        user.setGuestActionCount(actionCount + 1);
        userRepository.save(user);
    }

    public void requireAllowed(User user) {
        if (user == null || !GUEST_USER_TYPE.equals(user.getUserType())) {
            return;
        }

        int actionCount = user.getGuestActionCount() == null ? 0 : user.getGuestActionCount();
        int actionLimit = user.getGuestActionLimit() == null ? 10 : user.getGuestActionLimit();
        if (actionCount >= actionLimit) {
            throw new GuestLimitReachedException();
        }
    }
}
