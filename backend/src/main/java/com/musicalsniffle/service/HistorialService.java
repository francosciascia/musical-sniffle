package com.musicalsniffle.service;

import com.musicalsniffle.model.Historial;
import com.musicalsniffle.model.Persona;
import com.musicalsniffle.model.TipoEvento;
import com.musicalsniffle.repository.HistorialRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HistorialService {

    private final HistorialRepository historialRepository;

    @Transactional
    public Historial registrar(
            TipoEvento tipoEvento,
            String descripcion,
            Persona persona,
            String entidadTipo,
            Long entidadId,
            BigDecimal monto) {

        Historial historial = Historial.builder()
                .tipoEvento(tipoEvento)
                .fechaHora(LocalDateTime.now())
                .descripcion(descripcion)
                .persona(persona)
                .entidadTipo(entidadTipo)
                .entidadId(entidadId)
                .monto(monto)
                .build();

        return historialRepository.save(historial);
    }

    public List<Historial> listarPorPeriodo(LocalDateTime desde, LocalDateTime hasta) {
        return historialRepository.findByFechaHoraBetweenOrderByFechaHoraDesc(desde, hasta);
    }

    public List<Historial> listarPorTipo(TipoEvento tipoEvento) {
        return historialRepository.findByTipoEventoOrderByFechaHoraDesc(tipoEvento);
    }

    public BigDecimal calcularTotal(LocalDateTime desde, LocalDateTime hasta) {
        return historialRepository.sumMontosByTiposAndPeriodo(
                List.of(TipoEvento.PAGO, TipoEvento.PAGO_MENSUAL), desde, hasta);
    }

    public BigDecimal calcularTotalPagos(LocalDateTime desde, LocalDateTime hasta) {
        return historialRepository.sumMontosByTiposAndPeriodo(List.of(TipoEvento.PAGO), desde, hasta);
    }

    public BigDecimal calcularTotalPagosMensuales(LocalDateTime desde, LocalDateTime hasta) {
        return historialRepository.sumMontosByTiposAndPeriodo(List.of(TipoEvento.PAGO_MENSUAL), desde, hasta);
    }
}
