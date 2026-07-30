package com.musicalsniffle.dto;

import com.musicalsniffle.model.Rol;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {

    private String token;
    private Long id;
    private String nombre;
    private String apellido;
    private String email;
    private Rol rol;
}
