package com.musicalsniffle.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/** Alta de cliente desde admin: sin contraseña (solo para reservas / operación). */
@Getter
@Setter
public class ClienteAdminRequest {

    @NotBlank
    private String nombre;

    @NotBlank
    private String apellido;

    @NotBlank
    @Size(min = 7, max = 20)
    private String dni;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8, max = 30)
    private String telefono;
}
