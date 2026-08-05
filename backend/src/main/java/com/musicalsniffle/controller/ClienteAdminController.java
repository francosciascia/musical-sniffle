package com.musicalsniffle.controller;

import com.musicalsniffle.dto.AutoRequest;
import com.musicalsniffle.dto.ClienteAdminRequest;
import com.musicalsniffle.dto.PersonaResponse;
import com.musicalsniffle.model.Auto;
import com.musicalsniffle.model.Cliente;
import com.musicalsniffle.repository.ClienteRepository;
import com.musicalsniffle.service.EstacionamientoService;
import com.musicalsniffle.service.PersonaService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/clientes")
@RequiredArgsConstructor
public class ClienteAdminController {

    private final ClienteRepository clienteRepository;
    private final EstacionamientoService estacionamientoService;
    private final PersonaService personaService;

    @PutMapping("/{id}")
    public PersonaResponse actualizar(
            @PathVariable Long id, @Valid @RequestBody ClienteAdminRequest request) {
        return personaService.actualizarClienteAdmin(id, request);
    }

    @GetMapping("/{id}/autos")
    public List<Auto> listarAutos(@PathVariable Long id) {
        if (!clienteRepository.existsById(id)) {
            throw new IllegalArgumentException("Cliente no encontrado: " + id);
        }
        return estacionamientoService.listarAutosCliente(id);
    }

    @PostMapping("/{id}/autos")
    @ResponseStatus(HttpStatus.CREATED)
    public Auto registrarAuto(@PathVariable Long id, @Valid @RequestBody AutoRequest request) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado: " + id));
        return estacionamientoService.registrarAutoCliente(request, cliente);
    }
}
