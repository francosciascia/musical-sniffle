package com.musicalsniffle.service;

import com.musicalsniffle.config.EstacionamientoProperties;
import com.musicalsniffle.dto.AutoRequest;
import com.musicalsniffle.dto.CalculoResponse;
import com.musicalsniffle.dto.CerrarEstadiaRequest;
import com.musicalsniffle.dto.EstadiaResponse;
import com.musicalsniffle.dto.PlazaEstadoResponse;
import com.musicalsniffle.dto.TicketResponse;
import com.musicalsniffle.model.Auto;
import com.musicalsniffle.model.Cliente;
import com.musicalsniffle.model.Estadia;
import com.musicalsniffle.model.EstadoEstadia;
import com.musicalsniffle.model.MedioPago;
import com.musicalsniffle.model.Persona;
import com.musicalsniffle.model.Plaza;
import com.musicalsniffle.model.Reserva;
import com.musicalsniffle.model.Ticket;
import com.musicalsniffle.model.TipoEvento;
import com.musicalsniffle.model.TipoVehiculo;
import com.musicalsniffle.repository.AutoRepository;
import com.musicalsniffle.repository.ClienteRepository;
import com.musicalsniffle.repository.EstadiaRepository;
import com.musicalsniffle.repository.PlazaRepository;
import com.musicalsniffle.repository.TicketRepository;
import java.math.BigDecimal;
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
    private final AjustesEstacionamientoService ajustesService;
    private final TicketRepository ticketRepository;

    @Transactional(readOnly = true)
    public List<Auto> listarAutos() {
        return autoRepository.findAllWithCliente();
    }

    @Transactional(readOnly = true)
    public List<Auto> listarAutosCliente(Long clienteId) {
        return autoRepository.findByClienteId(clienteId);
    }

    @Transactional(readOnly = true)
    public List<EstadiaResponse> listarEstadiasActivas() {
        return estadiaRepository.findByEstado(EstadoEstadia.ABIERTA).stream()
                // Abonados no usan ticket/estadía: solo visitantes
                .filter(estadia -> !estadia.isAbonado())
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
        List<EstadiaResponse> matches = buscarEstadiasActivasPorPatente(patente);
        if (matches.isEmpty()) {
            throw new IllegalArgumentException("No hay estadía activa para patente: " + patente);
        }
        return matches.get(0);
    }

    /**
     * Busca estadías abiertas por patente. Exacta primero; si no, parcial
     * (ej. "986" → varias patentes distintas que la contienen).
     */
    @Transactional(readOnly = true)
    public List<EstadiaResponse> buscarEstadiasActivasPorPatente(String patenteRaw) {
        String q = patenteRaw == null ? "" : patenteRaw.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");
        if (q.isEmpty()) {
            throw new IllegalArgumentException("Indicá la patente");
        }

        // Incluye exactas y parecidas (986 → 986, AA986BB, …). Unicidad al guardar es solo exacta.
        List<Estadia> candidatas =
                estadiaRepository.findByAuto_PatenteContainingIgnoreCaseAndEstado(q, EstadoEstadia.ABIERTA);

        return candidatas.stream()
                .filter(estadia -> !estadia.isAbonado())
                .sorted((a, b) -> {
                    boolean ae = a.getAuto().getPatente().equalsIgnoreCase(q);
                    boolean be = b.getAuto().getPatente().equalsIgnoreCase(q);
                    if (ae == be) {
                        return a.getAuto().getPatente().compareToIgnoreCase(b.getAuto().getPatente());
                    }
                    return ae ? -1 : 1;
                })
                .map(estadia -> {
                    TicketResponse ticket = ticketRepository.findByEstadiaId(estadia.getId())
                            .map(TicketResponse::from)
                            .orElse(null);
                    return EstadiaResponse.from(estadia, ticket);
                })
                .toList();
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
            List<Estadia> abiertas = estadiaRepository.findAllByPlazaAndEstado(plaza, EstadoEstadia.ABIERTA)
                    .stream()
                    // Abonados no se muestran como ocupación con patente
                    .filter(e -> !e.isAbonado())
                    .toList();
            var reservaPlaza = reservaService.buscarActivaPorPlaza(plaza.getId());

            List<String> patentes = abiertas.stream()
                    .map(e -> e.getAuto().getPatente())
                    .toList();
            boolean todasMotos = !abiertas.isEmpty()
                    && abiertas.stream().allMatch(e -> e.getAuto().getTipo() == TipoVehiculo.MOTO);
            int maxMotos = ajustesService.motosPorPlaza();
            boolean puedeOtraMoto = todasMotos && abiertas.size() < maxMotos;
            boolean ocupada = !abiertas.isEmpty() && !puedeOtraMoto;

            PlazaEstadoResponse.PlazaEstadoResponseBuilder builder = PlazaEstadoResponse.builder()
                    .id(plaza.getId())
                    .codigo(plaza.getCodigo())
                    .activa(plaza.isActiva())
                    .piso(plaza.getPiso())
                    .posX(plaza.getPosX())
                    .posY(plaza.getPosY())
                    .ocupada(ocupada)
                    .puedeOtraMoto(puedeOtraMoto)
                    .vehiculos(abiertas.size())
                    .patentes(patentes)
                    .patente(patentes.isEmpty() ? null : patentes.get(0))
                    .reservada(reservaPlaza.isPresent());
            if (!abiertas.isEmpty()) {
                builder.estadiaId(abiertas.get(0).getId());
            }
            reservaPlaza.ifPresent(reserva -> builder.reservaCliente(
                    reserva.getCliente().getNombre() + " " + reserva.getCliente().getApellido()));
            resultado.add(builder.build());
        }
        return resultado;
    }

    @Transactional
    public Auto crearAuto(AutoRequest request, Persona operador) {
        String patente = normalizarPatente(request.getPatente());
        if (autoRepository.existsByPatenteIgnoreCase(patente)) {
            throw new IllegalStateException("Ya existe un auto con patente: " + patente);
        }
        Auto auto = Auto.builder()
                .patente(patente)
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
        String patente = normalizarPatente(request.getPatente());
        if (autoRepository.existsByPatenteIgnoreCase(patente)) {
            throw new IllegalStateException("Ya existe un auto con patente: " + patente);
        }

        Auto auto = Auto.builder()
                .patente(patente)
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
        if (reservaActiva.isPresent()) {
            Plaza plazaAbono = reservaActiva.get().getPlaza();
            throw new IllegalStateException(
                    "Abonado con plaza "
                            + (plazaAbono != null ? plazaAbono.getCodigo() : "fija")
                            + ". No requiere ingreso ni ticket: estaciona en su lugar.");
        }

        Optional<Reserva> suspendida = reservaService.buscarSuspendidaPorAuto(autoId);
        if (suspendida.isPresent()) {
            if (ajustesService.isBloquearIngresoSiSuspendida()) {
                throw new IllegalStateException(
                        "Abono suspendido (plaza " + suspendida.get().getPlaza().getCodigo()
                                + "). Registrá el pago mensual o reactivá el abono.");
            }
        }

        Plaza plaza = resolverPlaza(plazaId, Optional.empty());
        validarPlazaLibre(plaza, auto);
        validarPlazaDisponibleParaAuto(plaza, Optional.empty());

        Cliente cliente = resolverCliente(clienteId, Optional.empty());

        Estadia estadia = Estadia.builder()
                .auto(auto)
                .plaza(plaza)
                .cliente(cliente)
                .reserva(null)
                .entrada(LocalDateTime.now())
                .estado(EstadoEstadia.ABIERTA)
                .abonado(false)
                .build();

        Estadia guardada = estadiaRepository.save(estadia);
        Ticket ticket = ticketService.emitir(guardada, cliente);

        historialService.registrar(
                TipoEvento.INGRESO,
                "Ingreso de " + auto.getPatente()
                        + (plaza != null ? " en plaza " + plaza.getCodigo() : "")
                        + " - ticket " + ticket.getCodigo(),
                operador,
                "Estadia",
                guardada.getId(),
                null);

        List<String> avisos = new ArrayList<>();
        if (suspendida.isPresent()) {
            avisos.add(
                    "Abono suspendido (plaza "
                            + suspendida.get().getPlaza().getCodigo()
                            + "). Conviene cobrar / reactivar. Ingreso como visitante.");
        }
        return EstadiaResponse.from(guardada, TicketResponse.from(ticket), avisos);
    }

    @Transactional(readOnly = true)
    public CalculoResponse previsualizarCobro(Long id) {
        Estadia estadia = estadiaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Estadia no encontrada: " + id));

        if (estadia.getEstado() == EstadoEstadia.CERRADA) {
            throw new IllegalStateException("La estadía ya está cerrada");
        }

        boolean abonado = estadia.isAbonado();
        if (!abonado) {
            Optional<Reserva> reservaActiva = reservaService.buscarActivaPorAuto(estadia.getAuto().getId());
            if (reservaActiva.isPresent()) {
                abonado = true;
            }
        }

        LocalDateTime salida = LocalDateTime.now();
        BigDecimal monto;
        if (abonado) {
            monto = BigDecimal.ZERO;
        } else {
            LocalDateTime salidaOriginal = estadia.getSalida();
            estadia.setSalida(salida);
            monto = calculoService.calcular(estadia);
            estadia.setSalida(salidaOriginal);
        }

        String ticketCodigo = ticketService.buscarPorEstadiaId(estadia.getId()).getCodigo();

        return CalculoResponse.builder()
                .estadiaId(estadia.getId())
                .patente(estadia.getAuto().getPatente())
                .tipoVehiculo(estadia.getAuto().getTipo().name())
                .monto(monto)
                .abonado(abonado)
                .ticketCodigo(ticketCodigo)
                .plazaCodigo(estadia.getPlaza() != null ? estadia.getPlaza().getCodigo() : null)
                .entrada(estadia.getEntrada())
                .salida(salida)
                .build();
    }

    @Transactional
    public CalculoResponse cerrarEstadia(Long id, Persona operador, CerrarEstadiaRequest request) {
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

        MedioPago medioPago;
        BigDecimal recibido = null;
        BigDecimal vuelto = null;
        String ref = null;
        if (estadia.isAbonado() || monto.compareTo(BigDecimal.ZERO) == 0) {
            medioPago = MedioPago.ABONADO;
        } else {
            if (request == null || request.getMedioPago() == null) {
                throw new IllegalArgumentException("Indicá el medio de pago");
            }
            if (request.getMedioPago() == MedioPago.ABONADO) {
                throw new IllegalArgumentException("Medio de pago inválido para un cobro");
            }
            medioPago = request.getMedioPago();
            ref = request.getReferenciaComprobante() == null
                    ? null
                    : request.getReferenciaComprobante().trim();
            recibido = request.getMontoRecibido();

            if (medioPago == MedioPago.EFECTIVO) {
                if (recibido == null) {
                    recibido = monto;
                }
                if (recibido.compareTo(monto) < 0) {
                    throw new IllegalArgumentException(
                            "El monto recibido ($" + recibido + ") es menor al cobro ($" + monto + ")");
                }
                vuelto = recibido.subtract(monto);
            }
            if (medioPago == MedioPago.TRANSFERENCIA) {
                if (ref == null || ref.isBlank()) {
                    throw new IllegalArgumentException(
                            "Indicá el N° o referencia del comprobante de transferencia");
                }
            }
        }

        historialService.registrar(
                TipoEvento.SALIDA,
                "Salida de " + estadia.getAuto().getPatente()
                        + (estadia.isAbonado() ? " (abonado)" : "")
                        + " · " + medioPago.name(),
                operador,
                "Estadia",
                estadia.getId(),
                null,
                medioPago);

        if (monto.compareTo(BigDecimal.ZERO) > 0) {
            StringBuilder desc = new StringBuilder();
            desc.append("Pago de $").append(monto)
                    .append(" (").append(medioPago.name()).append(") por estadía #")
                    .append(estadia.getId());
            if (medioPago == MedioPago.EFECTIVO && recibido != null) {
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
            if (request != null
                    && request.getMercadopagoId() != null
                    && !request.getMercadopagoId().isBlank()) {
                desc.append(" | MP ").append(request.getMercadopagoId().trim());
            }

            historialService.registrar(
                    TipoEvento.PAGO,
                    desc.toString(),
                    operador,
                    "Estadia",
                    estadia.getId(),
                    monto,
                    medioPago);
        }

        String ticketCodigo = ticketService.buscarPorEstadiaId(estadia.getId()).getCodigo();

        return CalculoResponse.builder()
                .estadiaId(estadia.getId())
                .patente(estadia.getAuto().getPatente())
                .tipoVehiculo(estadia.getAuto().getTipo().name())
                .monto(monto)
                .abonado(estadia.isAbonado())
                .ticketCodigo(ticketCodigo)
                .plazaCodigo(estadia.getPlaza() != null ? estadia.getPlaza().getCodigo() : null)
                .entrada(estadia.getEntrada())
                .salida(estadia.getSalida())
                .medioPago(medioPago)
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
            if (ajustesService.isPlazaObligatoria() || estacionamientoProperties.isPlazaObligatoria()) {
                throw new IllegalArgumentException("Debe indicar una plaza para visitantes");
            }
            return null;
        }

        return plazaRepository.findById(plazaId)
                .orElseThrow(() -> new IllegalArgumentException("Plaza no encontrada: " + plazaId));
    }

    private void validarPlazaLibre(Plaza plaza, Auto auto) {
        if (plaza == null) {
            return;
        }

        List<Estadia> abiertas = estadiaRepository.findAllByPlazaAndEstado(plaza, EstadoEstadia.ABIERTA);
        if (abiertas.isEmpty()) {
            return;
        }

        int maxMotos = ajustesService.motosPorPlaza();
        boolean entranteEsMoto = auto.getTipo() == TipoVehiculo.MOTO;
        boolean todasMotos = abiertas.stream().allMatch(e -> e.getAuto().getTipo() == TipoVehiculo.MOTO);

        if (entranteEsMoto && todasMotos && abiertas.size() < maxMotos) {
            return;
        }

        if (todasMotos && entranteEsMoto && abiertas.size() >= maxMotos) {
            throw new IllegalStateException(
                    "La plaza " + plaza.getCodigo() + " ya tiene " + abiertas.size()
                            + (maxMotos > 1 ? " motos (máximo " + maxMotos + ")" : " moto"));
        }

        if (todasMotos && !entranteEsMoto) {
            throw new IllegalStateException(
                    "La plaza " + plaza.getCodigo() + " tiene moto(s); solo admite otra moto"
                            + (maxMotos > 1 ? " (máx. " + maxMotos + ")" : ""));
        }

        throw new IllegalStateException("La plaza " + plaza.getCodigo() + " está ocupada");
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

        if (ajustesService.isPermitirVisitantePlazaAbonado()) {
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

    /** Letras/números, mayúsculas; min 3 max 8 (validado también en AutoRequest). */
    public static String normalizarPatente(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("Indicá la patente");
        }
        String patente = raw.trim().toUpperCase().replaceAll("[^A-Z0-9]", "");
        if (patente.length() < 3 || patente.length() > 8) {
            throw new IllegalArgumentException("La patente debe tener entre 3 y 8 caracteres (letras o números)");
        }
        return patente;
    }
}
