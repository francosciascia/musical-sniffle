package com.musicalsniffle.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PlantaResponse {

    private int piso;
    private List<CeldaPlantaDto> celdas;
}
