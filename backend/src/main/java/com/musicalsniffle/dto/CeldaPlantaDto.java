package com.musicalsniffle.dto;

import com.musicalsniffle.model.TipoCeldaPlanta;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CeldaPlantaDto {

    @NotNull
    private Integer col;

    @NotNull
    private Integer row;

    @NotNull
    private TipoCeldaPlanta tipo;
}
