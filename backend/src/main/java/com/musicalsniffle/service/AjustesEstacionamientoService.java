package com.musicalsniffle.service;

import com.musicalsniffle.dto.AjustesEstacionamientoRequest;
import com.musicalsniffle.dto.AjustesEstacionamientoResponse;
import com.musicalsniffle.model.AjustesEstacionamiento;
import com.musicalsniffle.repository.AjustesEstacionamientoRepository;
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
        return toResponse(repository.save(ajustes));
    }

    @Transactional(readOnly = true)
    public boolean isPlazaObligatoria() {
        return cargar().isPlazaObligatoria();
    }

    /** Capacidad de motos por plaza según la regla activa. */
    @Transactional(readOnly = true)
    public int motosPorPlaza() {
        return cargar().isPermitirDosMotosPorPlaza() ? 2 : 1;
    }

    private AjustesEstacionamiento cargar() {
        return repository.findById(SINGLETON_ID).orElseGet(() -> repository.save(
                AjustesEstacionamiento.builder()
                        .id(SINGLETON_ID)
                        .plazaObligatoria(false)
                        .permitirDosMotosPorPlaza(false)
                        .build()));
    }

    private static AjustesEstacionamientoResponse toResponse(AjustesEstacionamiento a) {
        return AjustesEstacionamientoResponse.builder()
                .plazaObligatoria(a.isPlazaObligatoria())
                .permitirDosMotosPorPlaza(a.isPermitirDosMotosPorPlaza())
                .motosPorPlaza(a.isPermitirDosMotosPorPlaza() ? 2 : 1)
                .build();
    }
}
