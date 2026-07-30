package com.musicalsniffle.controller;

import com.musicalsniffle.dto.HistorialResponse;
import com.musicalsniffle.dto.ReservaResponse;
import com.musicalsniffle.dto.TotalResponse;
import com.musicalsniffle.model.TipoEvento;
import com.musicalsniffle.security.UserPrincipal;
import com.musicalsniffle.service.HistorialService;
import com.musicalsniffle.service.ReservaService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class HistorialController {

    private final HistorialService historialService;
    private final ReservaService reservaService;

    @GetMapping("/api/admin/historial")
    public List<HistorialResponse> listarHistorialAdmin(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) TipoEvento tipo) {

        if (tipo != null) {
            return historialService.listarPorTipo(tipo).stream()
                    .map(HistorialResponse::from)
                    .toList();
        }

        LocalDateTime inicio = (desde != null ? desde : LocalDate.now().minusDays(30)).atStartOfDay();
        LocalDateTime fin = (hasta != null ? hasta : LocalDate.now()).atTime(LocalTime.MAX);

        return historialService.listarPorPeriodo(inicio, fin).stream()
                .map(HistorialResponse::from)
                .toList();
    }

    @GetMapping("/api/admin/historial/total")
    public TotalResponse calcularTotalAdmin(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {

        LocalDateTime inicio = (desde != null ? desde : LocalDate.now().withDayOfMonth(1)).atStartOfDay();
        LocalDateTime fin = (hasta != null ? hasta : LocalDate.now()).atTime(LocalTime.MAX);

        BigDecimal pagos = historialService.calcularTotalPagos(inicio, fin);
        BigDecimal mensuales = historialService.calcularTotalPagosMensuales(inicio, fin);

        return TotalResponse.builder()
                .totalPagos(pagos)
                .totalPagosMensuales(mensuales)
                .totalGeneral(pagos.add(mensuales))
                .build();
    }

    @GetMapping("/api/operador/historial")
    public List<HistorialResponse> listarHistorialOperador(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {

        LocalDateTime inicio = (desde != null ? desde : LocalDate.now()).atStartOfDay();
        LocalDateTime fin = (hasta != null ? hasta : LocalDate.now()).atTime(LocalTime.MAX);

        return historialService.listarPorPeriodo(inicio, fin).stream()
                .map(HistorialResponse::from)
                .toList();
    }

    @GetMapping("/api/cliente/mi-reserva")
    public ReservaResponse miReserva(@AuthenticationPrincipal UserPrincipal user) {
        return reservaService.buscarActivaPorCliente(user.getPersona().getId());
    }
}
