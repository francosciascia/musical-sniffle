package com.musicalsniffle.controller;

import com.musicalsniffle.dto.OperadorRequest;
import com.musicalsniffle.dto.PersonaRequest;
import com.musicalsniffle.dto.PersonaResponse;
import com.musicalsniffle.repository.PersonaRepository;
import com.musicalsniffle.service.PersonaService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/usuarios")
@RequiredArgsConstructor
public class UsuarioAdminController {

    private final PersonaService personaService;
    private final PersonaRepository personaRepository;

    @GetMapping
    public List<PersonaResponse> listar() {
        return personaRepository.findAll().stream()
                .map(PersonaResponse::from)
                .toList();
    }

    @PostMapping("/operadores")
    @ResponseStatus(HttpStatus.CREATED)
    public PersonaResponse registrarOperador(@Valid @RequestBody OperadorRequest request) {
        return personaService.registrarOperador(request);
    }

    @PostMapping("/super-admins")
    @ResponseStatus(HttpStatus.CREATED)
    public PersonaResponse registrarSuperAdmin(@Valid @RequestBody PersonaRequest request) {
        return personaService.registrarSuperAdmin(request);
    }
}
