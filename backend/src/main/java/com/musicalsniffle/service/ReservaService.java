package com.musicalsniffle.service;

import com.musicalsniffle.dto.PagoMensualRequest;
import com.musicalsniffle.dto.ReservaRequest;
import com.musicalsniffle.dto.ReservaResponse;
import com.musicalsniffle.model.Auto;
import com.musicalsniffle.model.Cliente;
import com.musicalsniffle.model.EstadoReserva;
import com.musicalsniffle.model.MedioPago;
import com.musicalsniffle.model.Persona;
import com.musicalsniffle.model.Plaza;
import com.musicalsniffle.model.Reserva;
import com.musicalsniffle.model.TipoEvento;
import com.musicalsniffle.repository.AutoRepository;
import com.musicalsniffle.repository.ClienteRepository;
import com.musicalsniffle.repository.PlazaRepository;
import com.musicalsniffle.repository.ReservaRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final ClienteRepository clienteRepository;
    private final PlazaRepository plazaRepository;
    private final AutoRepository autoRepository;
    private final HistorialService historialService;
    private final AjustesEstacionamientoService ajustesService;

    @Transactional(readOnly = true)
    public List<ReservaResponse> listarTodas() {
        return reservaRepository.findAll().stream()
                .map(ReservaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReservaResponse obtenerPorId(Long id) {
        return ReservaResponse.from(buscarReserva(id));
    }

    @Transactional(readOnly = true)
    public Optional<Reserva> buscarActivaPorAuto(Long autoId) {
        LocalDate hoy = LocalDate.now();
        return reservaRepository.findActivaByAutoId(
                autoId, EstadoReserva.ACTIVA, hoy, ajustesService.fechaReferenciaAbono());
    }

    @Transactional(readOnly = true)
    public Optional<Reserva> buscarSuspendidaPorAuto(Long autoId) {
        return reservaRepository.findByAutoIdAndEstado(autoId, EstadoReserva.SUSPENDIDA);
    }

    @Transactional(readOnly = true)
    public Optional<Reserva> buscarActivaPorPlaza(Long plazaId) {
        LocalDate hoy = LocalDate.now();
        return reservaRepository.findActivaByPlazaId(
                plazaId, EstadoReserva.ACTIVA, hoy, ajustesService.fechaReferenciaAbono());
    }

    @Transactional(readOnly = true)
    public ReservaResponse buscarActivaPorCliente(Long clienteId) {
        Reserva reserva = reservaRepository.findByClienteIdAndEstado(clienteId, EstadoReserva.ACTIVA)
                .orElseThrow(() -> new IllegalArgumentException("El cliente no tiene reserva activa"));
        return ReservaResponse.from(reserva);
    }

    @Transactional
    public ReservaResponse crear(ReservaRequest request, Persona operador) {
        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado: " + request.getClienteId()));

        Plaza plaza = plazaRepository.findById(request.getPlazaId())
                .orElseThrow(() -> new IllegalArgumentException("Plaza no encontrada: " + request.getPlazaId()));

        validarPlazaDisponible(plaza.getId(), request.getFechaInicio());
        validarClienteSinReservaActiva(cliente.getId());

        Set<Auto> autos = cargarAutos(request.getAutoIds(), cliente);

        Reserva reserva = Reserva.builder()
                .cliente(cliente)
                .plaza(plaza)
                .autos(autos)
                .fechaInicio(request.getFechaInicio())
                .fechaFin(request.getFechaFin())
                .montoMensual(request.getMontoMensual())
                .estado(request.getEstado())
                .creadaEn(LocalDateTime.now())
                .build();

        Reserva guardada = reservaRepository.save(reserva);

        historialService.registrar(
                TipoEvento.RESERVA_CREADA,
                "Reserva mensual creada para " + cliente.getEmail() + " en plaza " + plaza.getCodigo(),
                operador,
                "Reserva",
                guardada.getId(),
                guardada.getMontoMensual());

        return ReservaResponse.from(guardada);
    }

    @Transactional
    public ReservaResponse actualizar(Long id, ReservaRequest request, Persona operador) {
        Reserva reserva = buscarReserva(id);

        Plaza plaza = plazaRepository.findById(request.getPlazaId())
                .orElseThrow(() -> new IllegalArgumentException("Plaza no encontrada: " + request.getPlazaId()));

        if (!plaza.getId().equals(reserva.getPlaza().getId())) {
            validarPlazaDisponible(plaza.getId(), request.getFechaInicio());
        }

        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado: " + request.getClienteId()));

        reserva.setCliente(cliente);
        reserva.setPlaza(plaza);
        reserva.setAutos(cargarAutos(request.getAutoIds(), cliente));
        reserva.setFechaInicio(request.getFechaInicio());
        reserva.setFechaFin(request.getFechaFin());
        reserva.setMontoMensual(request.getMontoMensual());
        reserva.setEstado(request.getEstado());

        Reserva guardada = reservaRepository.save(reserva);

        historialService.registrar(
                TipoEvento.RESERVA_ACTUALIZADA,
                "Reserva #" + guardada.getId() + " actualizada",
                operador,
                "Reserva",
                guardada.getId(),
                null);

        return ReservaResponse.from(guardada);
    }

    @Transactional
    public ReservaResponse cancelar(Long id, Persona operador) {
        Reserva reserva = buscarReserva(id);
        reserva.setEstado(EstadoReserva.CANCELADA);
        reserva.setFechaFin(LocalDate.now());

        Reserva guardada = reservaRepository.save(reserva);

        historialService.registrar(
                TipoEvento.RESERVA_CANCELADA,
                "Reserva #" + guardada.getId() + " cancelada",
                operador,
                "Reserva",
                guardada.getId(),
                null);

        return ReservaResponse.from(guardada);
    }

    @Transactional(readOnly = true)
    public List<ReservaResponse> listarACobrar() {
        LocalDate hoy = LocalDate.now();
        int horizonte = Math.max(0, ajustesService.getEntity().getDiasHorizonteCobro());
        List<EstadoReserva> estados = List.of(EstadoReserva.ACTIVA, EstadoReserva.SUSPENDIDA);

        return reservaRepository.findParaCobrar(estados).stream()
                .map(r -> {
                    LocalDate fin = r.getFechaFin();
                    Long dias = fin == null ? null : java.time.temporal.ChronoUnit.DAYS.between(hoy, fin);
                    String motivo;
                    if (r.getEstado() == EstadoReserva.SUSPENDIDA) {
                        motivo = "suspendida";
                    } else if (fin == null) {
                        motivo = "sin_fecha";
                    } else if (dias < 0) {
                        motivo = "vencido";
                    } else if (dias == 0) {
                        motivo = "vence_hoy";
                    } else if (dias <= horizonte) {
                        motivo = "por_vencer";
                    } else {
                        motivo = "al_dia";
                    }
                    return ReservaResponse.from(r, motivo, dias);
                })
                .sorted((a, b) -> Integer.compare(prioridadCobro(a.getMotivoCobro()), prioridadCobro(b.getMotivoCobro())))
                .toList();
    }

    private static int prioridadCobro(String motivo) {
        return switch (motivo == null ? "" : motivo) {
            case "suspendida" -> 0;
            case "vencido" -> 1;
            case "vence_hoy" -> 2;
            case "por_vencer" -> 3;
            case "sin_fecha" -> 4;
            default -> 5; // al_dia
        };
    }

    @Transactional
    public ReservaResponse suspender(Long id, Persona operador) {
        Reserva reserva = buscarReserva(id);
        if (reserva.getEstado() != EstadoReserva.ACTIVA) {
            throw new IllegalStateException("Solo se pueden suspender abonos activos");
        }
        reserva.setEstado(EstadoReserva.SUSPENDIDA);
        Reserva guardada = reservaRepository.save(reserva);
        historialService.registrar(
                TipoEvento.RESERVA_ACTUALIZADA,
                "Abono #" + guardada.getId() + " suspendido",
                operador,
                "Reserva",
                guardada.getId(),
                null);
        return ReservaResponse.from(guardada);
    }

    @Transactional
    public ReservaResponse reactivar(Long id, Persona operador) {
        Reserva reserva = buscarReserva(id);
        if (reserva.getEstado() != EstadoReserva.SUSPENDIDA) {
            throw new IllegalStateException("Solo se pueden reactivar abonos suspendidos");
        }
        reserva.setEstado(EstadoReserva.ACTIVA);
        Reserva guardada = reservaRepository.save(reserva);
        historialService.registrar(
                TipoEvento.RESERVA_ACTUALIZADA,
                "Abono #" + guardada.getId() + " reactivado",
                operador,
                "Reserva",
                guardada.getId(),
                null);
        return ReservaResponse.from(guardada);
    }

    @Transactional
    public ReservaResponse registrarPagoMensual(Long id, PagoMensualRequest request, Persona operador) {
        Reserva reserva = buscarReserva(id);

        if (reserva.getEstado() != EstadoReserva.ACTIVA
                && reserva.getEstado() != EstadoReserva.SUSPENDIDA) {
            throw new IllegalStateException("Solo se puede registrar pago en abonos activos o suspendidos");
        }

        MedioPago medioPago = request.getMedioPago();
        if (medioPago == null || medioPago == MedioPago.ABONADO) {
            throw new IllegalArgumentException("Indicá el medio de pago (efectivo, transferencia o QR)");
        }

        BigDecimal monto = reserva.getMontoMensual();
        BigDecimal recibido = request.getMontoRecibido();
        BigDecimal vuelto = null;
        String ref = request.getReferenciaComprobante() == null
                ? null
                : request.getReferenciaComprobante().trim();

        if (medioPago == MedioPago.EFECTIVO) {
            if (recibido == null) {
                recibido = monto;
            }
            if (recibido.compareTo(monto) < 0) {
                throw new IllegalArgumentException(
                        "El monto recibido ($" + recibido + ") es menor al abono ($" + monto + ")");
            }
            vuelto = recibido.subtract(monto);
        }

        if (medioPago == MedioPago.TRANSFERENCIA) {
            if (ref == null || ref.isBlank()) {
                throw new IllegalArgumentException("Indicá el N° o referencia del comprobante de transferencia");
            }
        }

        LocalDate hoy = LocalDate.now();
        LocalDate base = reserva.getFechaFin();
        if (base == null || base.isBefore(hoy)) {
            base = hoy;
        }
        reserva.setFechaFin(base.plusMonths(1));
        reserva.setEstado(EstadoReserva.ACTIVA);
        Reserva guardada = reservaRepository.save(reserva);

        StringBuilder desc = new StringBuilder();
        desc.append("Pago mensual (").append(medioPago.name()).append(") abono #")
                .append(guardada.getId())
                .append(" plaza ").append(guardada.getPlaza().getCodigo())
                .append(" — vigente hasta ").append(guardada.getFechaFin());
        if (medioPago == MedioPago.EFECTIVO) {
            desc.append(" | recibido $").append(recibido);
            if (vuelto != null && vuelto.compareTo(BigDecimal.ZERO) > 0) {
                desc.append(" | vuelto $").append(vuelto);
            } else {
                desc.append(" | pago exacto");
            }
        }
        if (ref != null && !ref.isBlank()) {
            desc.append(" | comprobante ").append(ref);
        }
        if (request.getMercadopagoId() != null && !request.getMercadopagoId().isBlank()) {
            desc.append(" | MP ").append(request.getMercadopagoId().trim());
        }

        historialService.registrar(
                TipoEvento.PAGO_MENSUAL,
                desc.toString(),
                operador,
                "Reserva",
                reserva.getId(),
                monto,
                medioPago);

        return ReservaResponse.from(guardada);
    }

    private Reserva buscarReserva(Long id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + id));
    }

    private void validarPlazaDisponible(Long plazaId, LocalDate fechaInicio) {
        reservaRepository.findActivaByPlazaId(plazaId, EstadoReserva.ACTIVA, fechaInicio, fechaInicio)
                .ifPresent(r -> {
                    throw new IllegalStateException("La plaza ya tiene una reserva activa");
                });
    }

    private void validarClienteSinReservaActiva(Long clienteId) {
        reservaRepository.findByClienteIdAndEstado(clienteId, EstadoReserva.ACTIVA)
                .ifPresent(r -> {
                    throw new IllegalStateException("El cliente ya tiene una reserva activa");
                });
    }

    private Set<Auto> cargarAutos(List<Long> autoIds, Cliente cliente) {
        Set<Auto> autos = new HashSet<>();
        for (Long autoId : autoIds) {
            Auto auto = autoRepository.findById(autoId)
                    .orElseThrow(() -> new IllegalArgumentException("Auto no encontrado: " + autoId));
            auto.setCliente(cliente);
            autos.add(autoRepository.save(auto));
        }
        return autos;
    }
}
