package com.musicalsniffle.dto;

import com.musicalsniffle.model.TipoVehiculo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AutoRequest {

    /** Se normaliza en servicio: 3–8 letras/números (ej. 123, ASD123, AA123BB). */
    @NotBlank
    private String patente;

    @NotNull
    private TipoVehiculo tipo;

    @NotBlank
    private String modelo;
}
