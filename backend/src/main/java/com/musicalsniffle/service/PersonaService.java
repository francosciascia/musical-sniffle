package com.musicalsniffle.service;

import com.musicalsniffle.dto.ClienteAdminRequest;
import com.musicalsniffle.dto.OperadorRequest;
import com.musicalsniffle.dto.PersonaRequest;
import com.musicalsniffle.dto.PersonaResponse;
import com.musicalsniffle.model.Cliente;
import com.musicalsniffle.model.Operador;
import com.musicalsniffle.model.Persona;
import com.musicalsniffle.model.SuperAdmin;
import com.musicalsniffle.repository.ClienteRepository;
import com.musicalsniffle.repository.OperadorRepository;
import com.musicalsniffle.repository.PersonaRepository;
import com.musicalsniffle.repository.SuperAdminRepository;
import com.musicalsniffle.util.TextoNormalizer;
import java.util.UUID;
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

    /** Alta desde admin: sin contraseña de acceso; solo ficha para reservas / operación. */
    @Transactional
    public PersonaResponse registrarClienteAdmin(ClienteAdminRequest request) {
        validarDatosUnicos(request.getEmail(), request.getDni());

        String randomPassword = UUID.randomUUID() + UUID.randomUUID().toString();

        Cliente cliente = Cliente.builder()
                .nombre(TextoNormalizer.capitalizarNombre(request.getNombre()))
                .apellido(TextoNormalizer.capitalizarNombre(request.getApellido()))
                .dni(request.getDni())
                .email(request.getEmail())
                .telefono(request.getTelefono())
                .password(passwordEncoder.encode(randomPassword))
                .activo(true)
                .build();

        return PersonaResponse.from(clienteRepository.save(cliente));
    }

    @Transactional
    public PersonaResponse actualizarClienteAdmin(Long id, ClienteAdminRequest request) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado: " + id));

        validarDatosUnicosExcepto(id, request.getEmail(), request.getDni());

        cliente.setNombre(TextoNormalizer.capitalizarNombre(request.getNombre()));
        cliente.setApellido(TextoNormalizer.capitalizarNombre(request.getApellido()));
        cliente.setDni(request.getDni().trim());
        cliente.setEmail(request.getEmail().trim());
        cliente.setTelefono(request.getTelefono().trim());

        return PersonaResponse.from(clienteRepository.save(cliente));
    }

    @Transactional
    public PersonaResponse registrarOperador(OperadorRequest request) {
        validarDatosUnicos(request.getEmail(), request.getDni());

        if (operadorRepository.existsByLegajo(request.getLegajo())) {
            throw new IllegalArgumentException("Ya existe un operador con ese legajo");
        }

        Operador operador = Operador.builder()
                .nombre(TextoNormalizer.capitalizarNombre(request.getNombre()))
                .apellido(TextoNormalizer.capitalizarNombre(request.getApellido()))
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
        validarDatosUnicos(request.getEmail(), request.getDni());

        SuperAdmin superAdmin = SuperAdmin.builder()
                .nombre(TextoNormalizer.capitalizarNombre(request.getNombre()))
                .apellido(TextoNormalizer.capitalizarNombre(request.getApellido()))
                .dni(request.getDni())
                .email(request.getEmail())
                .telefono(request.getTelefono())
                .password(passwordEncoder.encode(request.getPassword()))
                .activo(true)
                .build();

        return PersonaResponse.from(superAdminRepository.save(superAdmin));
    }

    @Transactional
    public PersonaResponse setActivo(Long id, boolean activo) {
        Persona persona = personaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado: " + id));
        persona.setActivo(activo);
        return PersonaResponse.from(personaRepository.save(persona));
    }

    private void validarDatosUnicos(String email, String dni) {
        if (personaRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }
        if (personaRepository.existsByDni(dni)) {
            throw new IllegalArgumentException("Ya existe un usuario con ese DNI");
        }
    }

    private void validarDatosUnicosExcepto(Long id, String email, String dni) {
        if (personaRepository.existsByEmailAndIdNot(email, id)) {
            throw new IllegalArgumentException("Ya existe un usuario con ese email");
        }
        if (personaRepository.existsByDniAndIdNot(dni, id)) {
            throw new IllegalArgumentException("Ya existe un usuario con ese DNI");
        }
    }
}
