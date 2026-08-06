package com.musicalsniffle.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ajustes_estacionamiento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AjustesEstacionamiento {

    @Id
    private Short id = 1;

    @Column(name = "plaza_obligatoria", nullable = false)
    @Builder.Default
    private boolean plazaObligatoria = false;

    /** Si es true, hasta 2 motos pueden compartir la misma plaza. */
    @Column(name = "permitir_dos_motos_por_plaza", nullable = false)
    @Builder.Default
    private boolean permitirDosMotosPorPlaza = false;
}
