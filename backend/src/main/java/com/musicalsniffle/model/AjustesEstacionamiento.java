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

    /** Días extra después de fechaFin en que el abono sigue valiendo. */
    @Column(name = "dias_gracia_abono", nullable = false)
    @Builder.Default
    private int diasGraciaAbono = 5;

    /** Avisar en ingreso si el abono vence dentro de N días (0 = no avisar). */
    @Column(name = "dias_aviso_vencimiento", nullable = false)
    @Builder.Default
    private int diasAvisoVencimiento = 7;

    /** Si true, un visitante puede entrar a una plaza que tiene abonado. */
    @Column(name = "permitir_visitante_plaza_abonado", nullable = false)
    @Builder.Default
    private boolean permitirVisitantePlazaAbonado = false;

    /** Avisar cuando el ingreso usa abono dentro del período de gracia. */
    @Column(name = "avisar_abono_en_gracia", nullable = false)
    @Builder.Default
    private boolean avisarAbonoEnGracia = true;

    /** Incluir en “a cobrar” abonos que vencen en ≤ N días (o ya vencidos). */
    @Column(name = "dias_horizonte_cobro", nullable = false)
    @Builder.Default
    private int diasHorizonteCobro = 10;

    /** Tras N días desde fechaFin, pasar ACTIVA → SUSPENDIDA (0 = no auto-suspender). */
    @Column(name = "dias_atraso_para_suspender", nullable = false)
    @Builder.Default
    private int diasAtrasoParaSuspender = 10;

    /** Si true, un auto con abono suspendido no puede ingresar. */
    @Column(name = "bloquear_ingreso_si_suspendida", nullable = false)
    @Builder.Default
    private boolean bloquearIngresoSiSuspendida = false;
}
