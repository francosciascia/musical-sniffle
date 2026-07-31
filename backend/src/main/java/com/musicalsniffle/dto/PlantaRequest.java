package com.musicalsniffle.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlantaRequest {

    @NotNull
    @Valid
    private List<CeldaPlantaDto> celdas;
}
