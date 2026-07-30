package com.musicalsniffle.service;

import com.musicalsniffle.model.EstadoReserva;
import com.musicalsniffle.model.Reserva;
import com.musicalsniffle.model.TipoEvento;
import com.musicalsniffle.repository.ReservaRepository;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReservaVencimientoService {

    private final ReservaRepository reservaRepository;
    private final HistorialService historialService;

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void vencerReservasExpiradas() {
        marcarVencidas(LocalDate.now());
    }

    @Transactional
    public int marcarVencidas(LocalDate fecha) {
        List<Reserva> expiradas = reservaRepository.findByEstadoAndFechaFinBefore(EstadoReserva.ACTIVA, fecha);
        for (Reserva reserva : expiradas) {
            reserva.setEstado(EstadoReserva.VENCIDA);
            reservaRepository.save(reserva);
            historialService.registrar(
                    TipoEvento.RESERVA_CANCELADA,
                    "Reserva #" + reserva.getId() + " vencida automáticamente",
                    null,
                    "Reserva",
                    reserva.getId(),
                    null);
        }
        return expiradas.size();
    }
}
