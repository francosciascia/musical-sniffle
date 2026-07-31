package com.musicalsniffle.service;

import com.musicalsniffle.config.EstacionamientoProperties;
import com.musicalsniffle.dto.AutoRequest;
import com.musicalsniffle.dto.CalculoResponse;
import com.musicalsniffle.dto.EstadiaResponse;
import com.musicalsniffle.dto.PlazaEstadoResponse;
import com.musicalsniffle.dto.TicketResponse;
import com.musicalsniffle.model.Auto;
import com.musicalsniffle.model.Cliente;
import com.musicalsniffle.model.Estadia;
import com.musicalsniffle.model.EstadoEstadia;
import com.musicalsniffle.model.Persona;
import com.musicalsniffle.model.Plaza;
import com.musicalsniffle.model.Reserva;
import com.musicalsniffle.model.Ticket;
import com.musicalsniffle.model.TipoEvento;
import com.musicalsniffle.repository.AutoRepository;
import com.musicalsniffle.repository.ClienteRepository;
import com.musicalsniffle.repository.EstadiaRepository;
import com.musicalsniffle.repository.PlazaRepository;
import com.musicalsniffle.repository.TicketRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EstacionamientoService {

    private final AutoRepository autoRepository;
    private final EstadiaRepository estadiaRepository;
    private final PlazaRepository plazaRepository;
    private final CalculoEstacionamientoService calculoService;
    private final ReservaService reservaService;
    private final HistorialService historialService;
    private final TicketService ticketService;
    private final ClienteRepository clienteRepository;
    private final EstacionamientoProperties estacionamientoProperties;
    private final TicketRepository ticketRepository;

    @Transactional(readOnly = true)
    public List<Auto> listarAutos() {
        return autoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Auto> listarAutosCliente(Long clienteId) {
        return autoRepository.findByClienteId(clienteId);
    }

    @Transactional(readOnly = true)
    public List<EstadiaResponse> listarEstadiasActivas() {
        return estadiaRepository.findByEstado(EstadoEstadia.ABIERTA).stream()
                .map(estadia -> {
                    TicketResponse ticket = ticketRepository.findByEstadiaId(estadia.getId())
                            .map(TicketResponse::from)
                            .orElse(null);
                    return EstadiaResponse.from(estadia, ticket);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public EstadiaResponse buscarEstadiaActivaPorPatente(String patente) {
        Estadia estadia = estadiaRepository
                .findByAuto_PatenteIgnoreCaseAndEstado(patente, EstadoEstadia.ABIERTA)
                .orElseThrow(() -> new IllegalArgumentException("No hay estadía activa para patente: " + patente));
        TicketResponse ticket = ticketRepository.findByEstadiaId(estadia.getId())
                .map(TicketResponse::from)
                .orElse(null);
        return EstadiaResponse.from(estadia, ticket);
    }

    @Transactional(readOnly = true)
    public EstadiaResponse buscarEstadiaActivaPorTicket(String codigo) {
        Estadia estadia = ticketRepository.findByCodigo(codigo)
                .orElseThrow(() -> new IllegalArgumentException("Ticket no encontrado: " + codigo))
                .getEstadia();
        if (estadia.getEstado() != EstadoEstadia.ABIERTA) {
            throw new IllegalStateException("La estadía del ticket ya está cerrada");
        }
        return EstadiaResponse.from(estadia, TicketResponse.from(ticketRepository.findByCodigo(codigo).orElseThrow()));
    }

    @Transactional(readOnly = true)
    public List<PlazaEstadoResponse> listarEstadoPlazas(Integer piso) {
        List<PlazaEstadoResponse> resultado = new ArrayList<>();
        for (Plaza plaza : plazaRepository.findAll()) {
            if (piso != null && plaza.getPiso() != piso) {
                continue;
            }
            var estadiaAbierta = estadiaRepository.findByPlazaAndEstado(plaza, EstadoEstadia.ABIERTA);
            var reservaPlaza = reservaService.buscarActivaPorPlaza(plaza.getId());

            PlazaEstadoResponse.PlazaEstadoResponseBuilder builder = PlazaEstadoResponse.builder()
                    .id(plaza.getId())
                    .codigo(plaza.getCodigo())
                    .activa(plaza.isActiva())
                    .piso(plaza.getPiso())
                    .posX(plaza.getPosX())
                    .posY(plaza.getPosY())
                    .ocupada(estadiaAbierta.isPresent())
                    .reservada(reservaPlaza.isPresent());
            estadiaAbierta.ifPresent(estadia -> builder
                    .patente(estadia.getAuto().getPatente())
                    .estadiaId(estadia.getId()));
            reservaPlaza.ifPresent(reserva -> builder.reservaCliente(
                    reserva.getCliente().getNombre() + " " + reserva.getCliente().getApellido()));
            resultado.add(builder.build());
        }
        return resultado;
    }

    @Transactional
    public Auto crearAuto(AutoRequest request, Persona operador) {
        if (autoRepository.existsByPatenteIgnoreCase(request.getPatente())) {
            throw new IllegalStateException("Ya existe un auto con patente: " + request.getPatente());
        }
        Auto auto = Auto.builder()
                .patente(request.getPatente())
                .tipo(request.getTipo())
                .modelo(request.getModelo().trim())
                .build();
        Auto guardado = autoRepository.save(auto);

        historialService.registrar(
                TipoEvento.AUTO_REGISTRADO,
                "Auto registrado: " + guardado.getPatente(),
                operador,
                "Auto",
                guardado.getId(),
                null);

        return guardado;
    }

    @Transactional
    public Auto registrarAutoCliente(AutoRequest request, Cliente cliente) {
        if (autoRepository.existsByPatenteIgnoreCase(request.getPatente())) {
            throw new IllegalStateException("Ya existe un auto con patente: " + request.getPatente());
        }

        Auto auto = Auto.builder()
                .patente(request.getPatente().toUpperCase())
                .tipo(request.getTipo())
                .modelo(request.getModelo().trim())
                .cliente(cliente)
                .build();

        return autoRepository.save(auto);
    }

    @Transactional
    public EstadiaResponse registrarIngreso(Long autoId, Long plazaId, Long clienteId, Persona operador) {
        Auto auto = autoRepository.findById(autoId)
                .orElseThrow(() -> new IllegalArgumentException("Auto no encontrado: " + autoId));

        validarAutoSinEstadiaAbierta(auto);
        Optional<Reserva> reservaActiva = reservaService.buscarActivaPorAuto(autoId);
        Plaza plaza = resolverPlaza(plazaId, reservaActiva);
        validarPlazaLibre(plaza);
        validarPlazaDisponibleParaAuto(plaza, reservaActiva);

        boolean abonado = reservaActiva.isPresent();
        Cliente cliente = resolverCliente(clienteId, reservaActiva);

        Estadia estadia = Estadia.builder()
                .auto(auto)
                .plaza(plaza)
                .cliente(cliente)
                .reserva(reservaActiva.orElse(null))
                .entrada(LocalDateTime.now())
                .estado(EstadoEstadia.ABIERTA)
                .abonado(abonado)
                .build();

        Estadia guardada = estadiaRepository.save(estadia);
        Ticket ticket = ticketService.emitir(guardada, cliente);

        historialService.registrar(
                TipoEvento.INGRESO,
                "Ingreso de " + auto.getPatente()
                        + (plaza != null ? " en plaza " + plaza.getCodigo() : "")
                        + " - ticket " + ticket.getCodigo()
                        + (abonado ? " (abonado)" : ""),
                operador,
                "Estadia",
                guardada.getId(),
                null);

        return EstadiaResponse.from(guardada, TicketResponse.from(ticket));
    }

    @Transactional
    public CalculoResponse cerrarEstadia(Long id, Persona operador) {
        Estadia estadia = estadiaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Estadia no encontrada: " + id));

        if (estadia.getEstado() == EstadoEstadia.CERRADA) {
            throw new IllegalStateException("La estadía ya está cerrada");
        }

        estadia.setSalida(LocalDateTime.now());
        estadia.setEstado(EstadoEstadia.CERRADA);

        if (!estadia.isAbonado()) {
            Optional<Reserva> reservaActiva = reservaService.buscarActivaPorAuto(estadia.getAuto().getId());
            if (reservaActiva.isPresent()) {
                estadia.setAbonado(true);
                estadia.setReserva(reservaActiva.get());
                estadia.setCliente(reservaActiva.get().getCliente());
            }
        }

        BigDecimal monto = calculoService.calcular(estadia);
        estadia.setMonto(monto);
        estadiaRepository.save(estadia);

        historialService.registrar(
                TipoEvento.SALIDA,
                "Salida de " + estadia.getAuto().getPatente()
                        + (estadia.isAbonado() ? " (abonado)" : ""),
                operador,
                "Estadia",
                estadia.getId(),
                null);

        if (monto.compareTo(BigDecimal.ZERO) > 0) {
            historialService.registrar(
                    TipoEvento.PAGO,
                    "Pago de $" + monto + " por estadía #" + estadia.getId(),
                    operador,
                    "Estadia",
                    estadia.getId(),
                    monto);
        }

        String ticketCodigo = ticketService.buscarPorEstadiaId(estadia.getId()).getCodigo();

        return CalculoResponse.builder()
                .estadiaId(estadia.getId())
                .patente(estadia.getAuto().getPatente())
                .tipoVehiculo(estadia.getAuto().getTipo().name())
                .monto(monto)
                .abonado(estadia.isAbonado())
                .ticketCodigo(ticketCodigo)
                .build();
    }

    private Cliente resolverCliente(Long clienteId, Optional<Reserva> reservaActiva) {
        if (reservaActiva.isPresent()) {
            return reservaActiva.get().getCliente();
        }

        if (clienteId == null) {
            return null;
        }

        return clienteRepository.findById(clienteId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado: " + clienteId));
    }

    private Plaza resolverPlaza(Long plazaId, Optional<Reserva> reservaActiva) {
        if (reservaActiva.isPresent()) {
            return reservaActiva.get().getPlaza();
        }

        if (plazaId == null) {
            if (estacionamientoProperties.isPlazaObligatoria()) {
                throw new IllegalArgumentException("Debe indicar una plaza para visitantes");
            }
            return null;
        }

        return plazaRepository.findById(plazaId)
                .orElseThrow(() -> new IllegalArgumentException("Plaza no encontrada: " + plazaId));
    }

    private void validarPlazaLibre(Plaza plaza) {
        if (plaza == null) {
            return;
        }

        estadiaRepository.findByPlazaAndEstado(plaza, EstadoEstadia.ABIERTA)
                .ifPresent(e -> {
                    throw new IllegalStateException("La plaza " + plaza.getCodigo() + " está ocupada");
                });
    }

    private void validarPlazaDisponibleParaAuto(Plaza plaza, Optional<Reserva> reservaAuto) {
        if (plaza == null) {
            return;
        }

        Optional<Reserva> reservaPlaza = reservaService.buscarActivaPorPlaza(plaza.getId());
        if (reservaPlaza.isEmpty()) {
            return;
        }

        if (reservaAuto.isPresent() && reservaPlaza.get().getId().equals(reservaAuto.get().getId())) {
            return;
        }

        throw new IllegalStateException(
                "La plaza " + plaza.getCodigo() + " está reservada para un abonado");
    }

    private void validarAutoSinEstadiaAbierta(Auto auto) {
        estadiaRepository.findByAutoAndEstado(auto, EstadoEstadia.ABIERTA)
                .ifPresent(e -> {
                    throw new IllegalStateException(
                            "El auto " + auto.getPatente() + " ya tiene una estadía abierta (#" + e.getId() + ")");
                });
    }
}
