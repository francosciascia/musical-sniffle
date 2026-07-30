package com.musicalsniffle.controller;

import com.musicalsniffle.dto.AutoRequest;
import com.musicalsniffle.model.Auto;
import com.musicalsniffle.model.Cliente;
import com.musicalsniffle.security.UserPrincipal;
import com.musicalsniffle.service.EstacionamientoService;
import jakarta.validation.Valid;
import java.util.List;
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
@RequestMapping("/api/cliente")
@RequiredArgsConstructor
public class ClienteController {

    private final EstacionamientoService estacionamientoService;

    @GetMapping("/autos")
    public List<Auto> misAutos(@AuthenticationPrincipal UserPrincipal user) {
        Cliente cliente = requireCliente(user);
        return estacionamientoService.listarAutosCliente(cliente.getId());
    }

    @PostMapping("/autos")
    @ResponseStatus(HttpStatus.CREATED)
    public Auto registrarAuto(
            @Valid @RequestBody AutoRequest request,
            @AuthenticationPrincipal UserPrincipal user) {
        Cliente cliente = requireCliente(user);
        return estacionamientoService.registrarAutoCliente(request, cliente);
    }

    private Cliente requireCliente(UserPrincipal user) {
        if (!(user.getPersona() instanceof Cliente cliente)) {
            throw new IllegalStateException("Solo clientes pueden acceder a este recurso");
        }
        return cliente;
    }
}
