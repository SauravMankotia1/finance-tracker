package com.financetracker.service;

import com.financetracker.dto.*;
import com.financetracker.exception.BadRequestException;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.exception.UnauthorizedException;
import com.financetracker.model.User;
import com.financetracker.repository.UserRepository;
import com.financetracker.security.JwtService;
import com.financetracker.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final DemoDataService demoDataService;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       DemoDataService demoDataService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.demoDataService = demoDataService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email address already exists.");
        }

        User user = new User(
                request.getName(),
                request.getEmail().toLowerCase().trim(),
                passwordEncoder.encode(request.getPassword()),
                request.getCurrency() != null ? request.getCurrency() : "USD"
        );

        User savedUser = userRepository.save(user);

        if (request.isSeedDemoData()) {
            demoDataService.seedDemoDataForUser(savedUser);
        }

        UserPrincipal principal = UserPrincipal.create(savedUser);
        String token = jwtService.generateToken(principal);

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getCurrency(),
                savedUser.getRole().name()
        );
    }

    public AuthResponse login(AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase().trim(),
                        request.getPassword()
                )
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String token = jwtService.generateToken(principal);

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCurrency(),
                user.getRole().name()
        );
    }

    public User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new UnauthorizedException("User is not authenticated");
        }

        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    public UserProfileResponse getProfile() {
        User user = getCurrentAuthenticatedUser();
        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCurrency(),
                user.getRole().name(),
                user.getCreatedAt()
        );
    }

    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        User user = getCurrentAuthenticatedUser();
        user.setName(request.getName().trim());
        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            user.setCurrency(request.getCurrency().trim().toUpperCase());
        }
        User updated = userRepository.save(user);
        return new UserProfileResponse(
                updated.getId(),
                updated.getName(),
                updated.getEmail(),
                updated.getCurrency(),
                updated.getRole().name(),
                updated.getCreatedAt()
        );
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getCurrentAuthenticatedUser();
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password does not match");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void seedDemoData() {
        User user = getCurrentAuthenticatedUser();
        demoDataService.clearUserData(user);
        demoDataService.seedDemoDataForUser(user);
    }

    @Transactional
    public void clearData() {
        User user = getCurrentAuthenticatedUser();
        demoDataService.clearUserData(user);
    }
}
