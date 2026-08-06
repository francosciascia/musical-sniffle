package com.musicalsniffle.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AjustesEstacionamientoResponse {

    private boolean plazaObligatoria;
    private boolean permitirDosMotosPorPlaza;
    /** Derivado: 2 si la opción está activa, si no 1. */
    private int motosPorPlaza;
}
