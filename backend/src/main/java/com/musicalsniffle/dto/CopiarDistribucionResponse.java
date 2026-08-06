package com.musicalsniffle.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CopiarDistribucionResponse {

    private PlantaResponse planta;
    private int plazasCopiadas;
    private int pisoOrigen;
    private int pisoDestino;
}
