package com.musicalsniffle.service;

import com.musicalsniffle.dto.AuthResponse;
import com.musicalsniffle.dto.LoginRequest;
import com.musicalsniffle.model.Persona;
import com.musicalsniffle.model.TipoEvento;
import com.musicalsniffle.repository.PersonaRepository;
import com.musicalsniffle.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final PersonaRepository personaRepository;
    private final JwtService jwtService;
    private final HistorialService historialService;

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (AuthenticationException ex) {
            throw new IllegalArgumentException("Email o contraseña incorrectos");
        }

        Persona persona = personaRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        historialService.registrar(
                TipoEvento.LOGIN,
                "Login de " + persona.getEmail() + " (" + persona.getRol() + ")",
                persona,
                "Persona",
                persona.getId(),
                null);

        return AuthResponse.builder()
                .token(jwtService.generateToken(persona))
                .id(persona.getId())
                .nombre(persona.getNombre())
                .apellido(persona.getApellido())
                .email(persona.getEmail())
                .rol(persona.getRol())
                .build();
    }
}
