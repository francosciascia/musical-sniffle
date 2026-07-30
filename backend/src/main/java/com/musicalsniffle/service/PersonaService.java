package com.musicalsniffle.service;

import com.musicalsniffle.dto.OperadorRequest;
import com.musicalsniffle.dto.PersonaRequest;
import com.musicalsniffle.dto.PersonaResponse;
import com.musicalsniffle.model.Cliente;
import com.musicalsniffle.model.Operador;
import com.musicalsniffle.model.SuperAdmin;
import com.musicalsniffle.repository.ClienteRepository;
import com.musicalsniffle.repository.OperadorRepository;
import com.musicalsniffle.repository.PersonaRepository;
import com.musicalsniffle.repository.SuperAdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PersonaService {

    private final PersonaRepository personaRepository;
    private final ClienteRepository clienteRepository;
    private final OperadorRepository operadorRepository;
    private final SuperAdminRepository superAdminRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public PersonaResponse registrarCliente(PersonaRequest request) {
        validarDatosUnicos(request);

        Cliente cliente = Cliente.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .dni(request.getDni())
                .email(request.getEmail())
                .telefono(request.getTelefono())
                .password(passwordEncoder.encode(request.getPassword()))
                .activo(true)
                .build();

        return PersonaResponse.from(clienteRepository.save(cliente));
    }

    @Transactional
    public PersonaResponse registrarOperador(OperadorRequest request) {
        validarDatosUnicos(request);

        if (operadorRepository.existsByLegajo(request.getLegajo())) {
            throw new IllegalArgumentException("Ya existe un operador con ese legajo");
        }

        Operador operador = Operador.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .dni(request.getDni())
                .email(request.getEmail())
                .telefono(request.getTelefono())
                .password(passwordEncoder.encode(request.getPassword()))
                .legajo(request.getLegajo())
                .activo(true)
                .build();

        return PersonaResponse.from(operadorRepository.save(operador));
    }

    @Transactional
    public PersonaResponse registrarSuperAdmin(PersonaRequest request) {
        validarDatosUnicos(request);

        SuperAdmin superAdmin = SuperAdmin.builder()
                .nombre(request.getNombre())
                .apellido(request.getApellido())
                .dni(request.getDni())
                .email(request.getEmail())
                .telefono(request.getTelefono())
                .password(passwordEncoder.encode(request.getPassword()))
                .activo(true)
                .build();

        return PersonaResponse.from(superAdminRepository.save(superAdmin));
    }

    private void validarDatosUnicos(PersonaRequest request) {
        if (personaRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }
        if (personaRepository.existsByDni(request.getDni())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese DNI");
        }
    }
}
