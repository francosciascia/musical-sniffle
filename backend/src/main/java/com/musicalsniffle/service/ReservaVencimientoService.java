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
    private final AjustesEstacionamientoService ajustesService;

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void procesarAbonosDiario() {
        suspenderPorAtraso();
        marcarVencidas(ajustesService.fechaReferenciaAbono());
    }

    /** ACTIVA con fechaFin hace ≥ N días → SUSPENDIDA (sigue existiendo el lugar, pero no es abonado “al día”). */
    @Transactional
    public int suspenderPorAtraso() {
        int dias = ajustesService.getEntity().getDiasAtrasoParaSuspender();
        if (dias <= 0) {
            return 0;
        }
        LocalDate limite = LocalDate.now().minusDays(dias);
        List<Reserva> atrasadas =
                reservaRepository.findActivasConFinAntesDe(EstadoReserva.ACTIVA, limite);
        for (Reserva reserva : atrasadas) {
            reserva.setEstado(EstadoReserva.SUSPENDIDA);
            reservaRepository.save(reserva);
            historialService.registrar(
                    TipoEvento.RESERVA_ACTUALIZADA,
                    "Abono #" + reserva.getId() + " suspendido por atraso (auto)",
                    null,
                    "Reserva",
                    reserva.getId(),
                    null);
        }
        return atrasadas.size();
    }

    @Transactional
    public int marcarVencidas(LocalDate fechaLimite) {
        List<Reserva> expiradas =
                reservaRepository.findByEstadoAndFechaFinBefore(EstadoReserva.ACTIVA, fechaLimite);
        // También suspendidas ya fuera de gracia
        List<Reserva> suspendidasExpiradas =
                reservaRepository.findByEstadoAndFechaFinBefore(EstadoReserva.SUSPENDIDA, fechaLimite);
        int n = 0;
        for (Reserva reserva : expiradas) {
            n += marcarVencida(reserva);
        }
        for (Reserva reserva : suspendidasExpiradas) {
            n += marcarVencida(reserva);
        }
        return n;
    }

    private int marcarVencida(Reserva reserva) {
        reserva.setEstado(EstadoReserva.VENCIDA);
        reservaRepository.save(reserva);
        historialService.registrar(
                TipoEvento.RESERVA_CANCELADA,
                "Reserva #" + reserva.getId() + " vencida automáticamente",
                null,
                "Reserva",
                reserva.getId(),
                null);
        return 1;
    }
}
