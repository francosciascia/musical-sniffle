package com.musicalsniffle.service;

import com.musicalsniffle.dto.AjustesEstacionamientoRequest;
import com.musicalsniffle.dto.AjustesEstacionamientoResponse;
import com.musicalsniffle.model.AjustesEstacionamiento;
import com.musicalsniffle.repository.AjustesEstacionamientoRepository;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AjustesEstacionamientoService {

    public static final short SINGLETON_ID = 1;

    private final AjustesEstacionamientoRepository repository;

    @Transactional(readOnly = true)
    public AjustesEstacionamientoResponse obtener() {
        return toResponse(cargar());
    }

    @Transactional
    public AjustesEstacionamientoResponse actualizar(AjustesEstacionamientoRequest request) {
        AjustesEstacionamiento ajustes = cargar();
        ajustes.setPlazaObligatoria(request.isPlazaObligatoria());
        ajustes.setPermitirDosMotosPorPlaza(request.isPermitirDosMotosPorPlaza());
        ajustes.setDiasGraciaAbono(request.getDiasGraciaAbono());
        ajustes.setDiasAvisoVencimiento(request.getDiasAvisoVencimiento());
        ajustes.setPermitirVisitantePlazaAbonado(request.isPermitirVisitantePlazaAbonado());
        ajustes.setAvisarAbonoEnGracia(request.isAvisarAbonoEnGracia());
        ajustes.setDiasHorizonteCobro(request.getDiasHorizonteCobro());
        ajustes.setDiasAtrasoParaSuspender(request.getDiasAtrasoParaSuspender());
        ajustes.setBloquearIngresoSiSuspendida(request.isBloquearIngresoSiSuspendida());
        return toResponse(repository.save(ajustes));
    }

    @Transactional(readOnly = true)
    public AjustesEstacionamiento getEntity() {
        return cargar();
    }

    @Transactional(readOnly = true)
    public boolean isPlazaObligatoria() {
        return cargar().isPlazaObligatoria();
    }

    @Transactional(readOnly = true)
    public boolean isPermitirVisitantePlazaAbonado() {
        return cargar().isPermitirVisitantePlazaAbonado();
    }

    @Transactional(readOnly = true)
    public boolean isBloquearIngresoSiSuspendida() {
        return cargar().isBloquearIngresoSiSuspendida();
    }

    @Transactional(readOnly = true)
    public int motosPorPlaza() {
        return cargar().isPermitirDosMotosPorPlaza() ? 2 : 1;
    }

    @Transactional(readOnly = true)
    public LocalDate fechaReferenciaAbono() {
        int gracia = Math.max(0, cargar().getDiasGraciaAbono());
        return LocalDate.now().minusDays(gracia);
    }

    private AjustesEstacionamiento cargar() {
        return repository.findById(SINGLETON_ID).orElseGet(() -> repository.save(
                AjustesEstacionamiento.builder()
                        .id(SINGLETON_ID)
                        .plazaObligatoria(false)
                        .permitirDosMotosPorPlaza(false)
                        .diasGraciaAbono(5)
                        .diasAvisoVencimiento(7)
                        .permitirVisitantePlazaAbonado(false)
                        .avisarAbonoEnGracia(true)
                        .diasHorizonteCobro(10)
                        .diasAtrasoParaSuspender(10)
                        .bloquearIngresoSiSuspendida(false)
                        .build()));
    }

    private static AjustesEstacionamientoResponse toResponse(AjustesEstacionamiento a) {
        return AjustesEstacionamientoResponse.builder()
                .plazaObligatoria(a.isPlazaObligatoria())
                .permitirDosMotosPorPlaza(a.isPermitirDosMotosPorPlaza())
                .motosPorPlaza(a.isPermitirDosMotosPorPlaza() ? 2 : 1)
                .diasGraciaAbono(a.getDiasGraciaAbono())
                .diasAvisoVencimiento(a.getDiasAvisoVencimiento())
                .permitirVisitantePlazaAbonado(a.isPermitirVisitantePlazaAbonado())
                .avisarAbonoEnGracia(a.isAvisarAbonoEnGracia())
                .diasHorizonteCobro(a.getDiasHorizonteCobro())
                .diasAtrasoParaSuspender(a.getDiasAtrasoParaSuspender())
                .bloquearIngresoSiSuspendida(a.isBloquearIngresoSiSuspendida())
                .build();
    }
}
