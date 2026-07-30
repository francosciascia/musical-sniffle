package com.musicalsniffle.dto;

import com.musicalsniffle.model.EstadoReserva;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReservaRequest {

    @NotNull
    private Long clienteId;

    @NotNull
    private Long plazaId;

    @NotEmpty
    private List<Long> autoIds;

    @NotNull
    private LocalDate fechaInicio;

    private LocalDate fechaFin;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal montoMensual;

    @NotNull
    private EstadoReserva estado;
}
