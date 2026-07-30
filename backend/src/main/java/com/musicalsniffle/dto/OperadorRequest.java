package com.musicalsniffle.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OperadorRequest extends PersonaRequest {

    @NotBlank
    private String legajo;
}
