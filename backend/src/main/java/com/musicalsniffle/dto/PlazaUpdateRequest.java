package com.musicalsniffle.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlazaUpdateRequest {

    @NotBlank
    private String codigo;

    private boolean activa = true;

    private int piso = 1;

    private Integer posX;

    private Integer posY;
}
