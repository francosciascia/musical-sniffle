package com.musicalsniffle.dto;

import com.musicalsniffle.model.TipoVehiculo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AutoRequest {

    @NotBlank
    private String patente;

    @NotNull
    private TipoVehiculo tipo;

    @NotBlank
    private String modelo;
}
