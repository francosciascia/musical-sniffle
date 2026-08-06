package com.musicalsniffle.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CrearPlantaRequest {

    @Min(4)
    @Max(80)
    private Integer gridCols;

    @Min(4)
    @Max(50)
    private Integer gridRows;
}
