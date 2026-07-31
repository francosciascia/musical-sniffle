package com.musicalsniffle.service;

import com.musicalsniffle.dto.ReservaRequest;
import com.musicalsniffle.dto.ReservaResponse;
import com.musicalsniffle.model.Auto;
import com.musicalsniffle.model.Cliente;
import com.musicalsniffle.model.EstadoReserva;
import com.musicalsniffle.model.Persona;
import com.musicalsniffle.model.Plaza;
import com.musicalsniffle.model.Reserva;
import com.musicalsniffle.model.TipoEvento;
import com.musicalsniffle.repository.AutoRepository;
import com.musicalsniffle.repository.ClienteRepository;
import com.musicalsniffle.repository.PlazaRepository;
import com.musicalsniffle.repository.ReservaRepository;
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
        return reservaRepository.findActivaByAutoId(autoId, EstadoReserva.ACTIVA, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public Optional<Reserva> buscarActivaPorPlaza(Long plazaId) {
        return reservaRepository.findActivaByPlazaId(plazaId, EstadoReserva.ACTIVA, LocalDate.now());
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

    @Transactional
    public ReservaResponse registrarPagoMensual(Long id, Persona operador) {
        Reserva reserva = buscarReserva(id);

        if (reserva.getEstado() != EstadoReserva.ACTIVA) {
            throw new IllegalStateException("Solo se puede registrar pago mensual en reservas activas");
        }

        historialService.registrar(
                TipoEvento.PAGO_MENSUAL,
                "Pago mensual registrado para reserva #" + reserva.getId(),
                operador,
                "Reserva",
                reserva.getId(),
                reserva.getMontoMensual());

        return ReservaResponse.from(reserva);
    }

    private Reserva buscarReserva(Long id) {
        return reservaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + id));
    }

    private void validarPlazaDisponible(Long plazaId, LocalDate fechaInicio) {
        reservaRepository.findActivaByPlazaId(plazaId, EstadoReserva.ACTIVA, fechaInicio)
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
