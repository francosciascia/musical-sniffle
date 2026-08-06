package com.musicalsniffle.controller;

import com.musicalsniffle.dto.AuthResponse;
import com.musicalsniffle.dto.LoginRequest;
import com.musicalsniffle.dto.PersonaResponse;
import com.musicalsniffle.security.UserPrincipal;
import com.musicalsniffle.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public PersonaResponse perfil(@AuthenticationPrincipal UserPrincipal user) {
        return PersonaResponse.from(user.getPersona());
    }
}
