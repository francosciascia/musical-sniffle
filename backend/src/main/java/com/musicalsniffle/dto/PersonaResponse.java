package com.musicalsniffle.dto;

import com.musicalsniffle.model.Persona;
import com.musicalsniffle.model.Rol;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PersonaResponse {

    private Long id;
    private String nombre;
    private String apellido;
    private String dni;
    private String email;
    private String telefono;
    private Rol rol;
    private boolean activo;
    private String legajo;

    public static PersonaResponse from(Persona persona) {
        PersonaResponseBuilder builder = PersonaResponse.builder()
                .id(persona.getId())
                .nombre(persona.getNombre())
                .apellido(persona.getApellido())
                .dni(persona.getDni())
                .email(persona.getEmail())
                .telefono(persona.getTelefono())
                .rol(persona.getRol())
                .activo(persona.isActivo());

        if (persona instanceof com.musicalsniffle.model.Operador operador) {
            builder.legajo(operador.getLegajo());
        }

        return builder.build();
    }
}
