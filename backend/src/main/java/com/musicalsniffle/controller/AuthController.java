package com.musicalsniffle.controller;

import com.musicalsniffle.dto.AuthResponse;
import com.musicalsniffle.dto.LoginRequest;
import com.musicalsniffle.dto.OperadorRequest;
import com.musicalsniffle.dto.PersonaRequest;
import com.musicalsniffle.dto.PersonaResponse;
import com.musicalsniffle.security.UserPrincipal;
import com.musicalsniffle.service.AuthService;
import com.musicalsniffle.service.PersonaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PersonaService personaService;

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register/cliente")
    @ResponseStatus(HttpStatus.CREATED)
    public PersonaResponse registrarCliente(@Valid @RequestBody PersonaRequest request) {
        return personaService.registrarCliente(request);
    }

    @GetMapping("/me")
    public PersonaResponse perfil(@AuthenticationPrincipal UserPrincipal user) {
        return PersonaResponse.from(user.getPersona());
    }
}
