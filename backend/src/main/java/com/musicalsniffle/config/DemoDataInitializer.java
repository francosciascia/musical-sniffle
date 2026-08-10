package com.musicalsniffle.config;

import com.musicalsniffle.dto.ReservaRequest;
import com.musicalsniffle.model.Auto;
import com.musicalsniffle.model.Cliente;
import com.musicalsniffle.model.Estadia;
import com.musicalsniffle.model.EstadoEstadia;
import com.musicalsniffle.model.EstadoReserva;
import com.musicalsniffle.model.Operador;
import com.musicalsniffle.model.Plaza;
import com.musicalsniffle.model.TipoVehiculo;
import com.musicalsniffle.repository.AutoRepository;
import com.musicalsniffle.repository.ClienteRepository;
import com.musicalsniffle.repository.EstadiaRepository;
import com.musicalsniffle.repository.OperadorRepository;
import com.musicalsniffle.repository.PersonaRepository;
import com.musicalsniffle.repository.PlazaRepository;
import com.musicalsniffle.repository.ReservaRepository;
import com.musicalsniffle.service.EstacionamientoService;
import com.musicalsniffle.service.ReservaService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Lote grande de datos de prueba. Activar con {@code app.demo-data=true}.
 * Sin {@code @Transactional} envolvente: si un alta falla, no tumba el arranque.
 */
@Component
@Order(10)
@ConditionalOnProperty(name = "app.demo-data", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class DemoDataInitializer implements CommandLineRunner {

    public static final String OPERADOR_EMAIL = "operador.demo@musicalsniffle.com";
    public static final String OPERADOR_PASSWORD = "demo123";
    public static final String OPERADOR2_EMAIL = "operador2.demo@musicalsniffle.com";
    public static final String OPERADOR2_PASSWORD = "demo123";
    /** Marcador del lote ampliado (~30 autos / 12 clientes / 10 abonos). */
    public static final String MARKER_EMAIL = "seed.lote-grande@demo.com";

    private static final String[][] CLIENTES = {
            {"Juan", "Pérez", "28444555", "juan.perez@demo.com", "1144445555"},
            {"María", "López", "29555666", "maria.lopez@demo.com", "1166667777"},
            {"Carlos", "Gómez", "30666777", "carlos.gomez@demo.com", "1177778888"},
            {"Ana", "Martínez", "31777888", "ana.martinez@demo.com", "1188889999"},
            {"Luis", "Fernández", "32888999", "luis.fernandez@demo.com", "1199990000"},
            {"Sofía", "Rodríguez", "33999000", "sofia.rodriguez@demo.com", "1100001111"},
            {"Diego", "Sánchez", "34000111", "diego.sanchez@demo.com", "1111112222"},
            {"Valentina", "Torres", "35111222", "valentina.torres@demo.com", "1122223333"},
            {"Martín", "Ramírez", "36222333", "martin.ramirez@demo.com", "1133334444"},
            {"Camila", "Flores", "37333444", "camila.flores@demo.com", "1144446666"},
            {"Pablo", "Acosta", "38444555", "pablo.acosta@demo.com", "1155557777"},
            {"Lucía", "Benítez", "39555666", "lucia.benitez@demo.com", "1166668888"},
    };

    private static final String[] MODELOS_AUTO = {
            "Toyota Corolla", "VW Gol", "Ford Focus", "Chevrolet Onix", "Renault Sandero",
            "Peugeot 208", "Fiat Cronos", "Honda Civic", "Toyota Etios", "VW Polo"
    };
    private static final String[] MODELOS_CAMIONETA = {
            "VW Amarok", "Toyota Hilux", "Ford Ranger", "Chevrolet S10", "Nissan Frontier"
    };
    private static final String[] MODELOS_MOTO = {
            "Honda Wave", "Yamaha Crypton", "Motomel Skua", "Zanella RX", "Gilera Smash"
    };

    private final PersonaRepository personaRepository;
    private final OperadorRepository operadorRepository;
    private final ClienteRepository clienteRepository;
    private final AutoRepository autoRepository;
    private final PlazaRepository plazaRepository;
    private final ReservaRepository reservaRepository;
    private final EstadiaRepository estadiaRepository;
    private final PasswordEncoder passwordEncoder;
    private final ReservaService reservaService;
    private final EstacionamientoService estacionamientoService;

    @Override
    public void run(String... args) {
        if (personaRepository.existsByEmail(MARKER_EMAIL)) {
            log.info(
                    "Datos de prueba (lote grande) ya cargados. Operador: {} / {}",
                    OPERADOR_EMAIL,
                    OPERADOR_PASSWORD);
            return;
        }

        try {
            seed();
        } catch (Exception ex) {
            log.error("Demo data: falló el seeder (el backend sigue). Causa: {}", ex.getMessage(), ex);
        }
    }

    private void seed() {
        ensurePlazas(30);
        List<Plaza> plazas = plazaRepository.findAll().stream()
                .filter(p -> p.getCodigo() != null && p.getCodigo().matches("A\\d+"))
                .sorted((a, b) -> Integer.compare(numCodigo(a.getCodigo()), numCodigo(b.getCodigo())))
                .toList();

        if (plazas.size() < 20) {
            log.warn(
                    "Demo data: se necesitan al menos 20 plazas A1… (hay {}). Creá plazas en el editor o reiniciá con DB limpia.",
                    plazas.size());
            return;
        }

        Operador operador = ensureOperador(
                OPERADOR_EMAIL, OPERADOR_PASSWORD, "Lucía", "Operadora", "30111222", "DEMO-001", "1155550001");
        ensureOperador(
                OPERADOR2_EMAIL, OPERADOR2_PASSWORD, "Marcos", "Cajero", "30222333", "DEMO-002", "1155550002");

        List<Cliente> clientes = new ArrayList<>();
        for (String[] c : CLIENTES) {
            clientes.add(ensureCliente(c[0], c[1], c[2], c[3], c[4]));
        }

        List<Auto> autosAbono = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            Cliente cli = clientes.get(i);
            TipoVehiculo tipo = i % 5 == 0 ? TipoVehiculo.CAMIONETA : TipoVehiculo.AUTO;
            String modelo = tipo == TipoVehiculo.CAMIONETA
                    ? MODELOS_CAMIONETA[i % MODELOS_CAMIONETA.length]
                    : MODELOS_AUTO[i % MODELOS_AUTO.length];
            autosAbono.add(ensureAuto(patenteAbonado(i), tipo, modelo, cli));
            if (i % 2 == 0) {
                ensureAuto(patenteAbonadoExtra(i), TipoVehiculo.MOTO, MODELOS_MOTO[i % MODELOS_MOTO.length], cli);
            }
        }

        List<Auto> visitantes = new ArrayList<>();
        for (int i = 0; i < 15; i++) {
            TipoVehiculo tipo = i % 4 == 0
                    ? TipoVehiculo.MOTO
                    : (i % 7 == 0 ? TipoVehiculo.CAMIONETA : TipoVehiculo.AUTO);
            String modelo = switch (tipo) {
                case MOTO -> MODELOS_MOTO[i % MODELOS_MOTO.length];
                case CAMIONETA -> MODELOS_CAMIONETA[i % MODELOS_CAMIONETA.length];
                default -> MODELOS_AUTO[i % MODELOS_AUTO.length];
            };
            visitantes.add(ensureAuto(patenteVisitante(i), tipo, modelo, null));
        }

        ensureAuto("ZZ100AA", TipoVehiculo.AUTO, "Chevrolet Cruze", clientes.get(10));
        ensureAuto("ZZ200BB", TipoVehiculo.AUTO, "Renault Logan", clientes.get(11));
        ensureAuto("ZZ300CC", TipoVehiculo.MOTO, "Honda XR", clientes.get(11));

        LocalDate hoy = LocalDate.now();
        int abonosCreados = 0;
        for (int i = 0; i < 10; i++) {
            Plaza plaza = plazas.get(i);
            Cliente cli = clientes.get(i);
            Auto auto = autosAbono.get(i);

            if (reservaRepository.findByClienteIdAndEstado(cli.getId(), EstadoReserva.ACTIVA).isPresent()) {
                continue;
            }
            if (reservaRepository
                    .findActivaByPlazaId(plaza.getId(), EstadoReserva.ACTIVA, hoy, hoy)
                    .isPresent()) {
                continue;
            }

            try {
                ReservaRequest req = new ReservaRequest();
                req.setClienteId(cli.getId());
                req.setPlazaId(plaza.getId());
                req.setAutoIds(List.of(auto.getId()));
                req.setFechaInicio(hoy.minusDays(5 + i));
                LocalDate fin = switch (i % 3) {
                    case 0 -> hoy.plusDays(20);
                    case 1 -> hoy.plusDays(2);
                    default -> hoy;
                };
                req.setFechaFin(fin);
                req.setMontoMensual(BigDecimal.valueOf(40000 + (i * 1500L)));
                req.setEstado(EstadoReserva.ACTIVA);
                reservaService.crear(req, operador);
                abonosCreados++;
            } catch (Exception ex) {
                log.warn("Demo data: abono omitido para {}: {}", cli.getEmail(), ex.getMessage());
            }
        }

        int estadias = 0;
        for (int i = 0; i < 5; i++) {
            Auto auto = autosAbono.get(i);
            Plaza plaza = plazas.get(i);
            if (estadiaRepository.findByAutoAndEstado(auto, EstadoEstadia.ABIERTA).isPresent()) {
                continue;
            }
            if (!estadiaRepository.findAllByPlazaAndEstado(plaza, EstadoEstadia.ABIERTA).isEmpty()) {
                continue;
            }
            try {
                var r = estacionamientoService.registrarIngreso(
                        auto.getId(), plaza.getId(), clientes.get(i).getId(), operador);
                retrocederEntrada(r.getId(), 20 + i * 15);
                estadias++;
            } catch (Exception ex) {
                log.warn("Demo data: estadía abonado omitida ({}): {}", auto.getPatente(), ex.getMessage());
            }
        }

        int plazaVisitaIdx = 10;
        for (int i = 0; i < Math.min(8, visitantes.size()); i++) {
            if (plazaVisitaIdx >= plazas.size()) {
                break;
            }
            Auto auto = visitantes.get(i);
            Plaza plaza = plazas.get(plazaVisitaIdx);
            plazaVisitaIdx++;
            if (estadiaRepository.findByAutoAndEstado(auto, EstadoEstadia.ABIERTA).isPresent()) {
                continue;
            }
            if (!estadiaRepository.findAllByPlazaAndEstado(plaza, EstadoEstadia.ABIERTA).isEmpty()) {
                continue;
            }
            // no meter visita en plaza con abono activo
            if (reservaRepository
                    .findActivaByPlazaId(plaza.getId(), EstadoReserva.ACTIVA, hoy, hoy)
                    .isPresent()) {
                continue;
            }
            try {
                var r = estacionamientoService.registrarIngreso(auto.getId(), plaza.getId(), null, operador);
                retrocederEntrada(r.getId(), 35 + i * 20);
                estadias++;
            } catch (Exception ex) {
                log.warn("Demo data: estadía visitante omitida ({}): {}", auto.getPatente(), ex.getMessage());
            }
        }

        ensureCliente("Seed", "LoteGrande", "39999999", MARKER_EMAIL, "1100000000");

        log.info(
                """
                Datos de prueba (lote grande) listos.
                  Logins:
                    admin@musicalsniffle.com / admin123
                    {} / {}
                    {} / {}
                  Clientes: {} | Autos: {} | Abonos creados ahora: {} | Estadías nuevas: {}
                """,
                OPERADOR_EMAIL,
                OPERADOR_PASSWORD,
                OPERADOR2_EMAIL,
                OPERADOR2_PASSWORD,
                clienteRepository.count(),
                autoRepository.count(),
                abonosCreados,
                estadias);
    }

    private void ensurePlazas(int cantidad) {
        for (int i = 1; i <= cantidad; i++) {
            String codigo = "A" + i;
            if (plazaRepository.existsByCodigo(codigo)) {
                continue;
            }
            int index = i - 1;
            plazaRepository.save(Plaza.builder()
                    .codigo(codigo)
                    .activa(true)
                    .piso(1)
                    .posX(index % 6)
                    .posY(index / 6)
                    .build());
        }
    }

    private Operador ensureOperador(
            String email, String password, String nombre, String apellido, String dni, String legajo, String tel) {
        return personaRepository
                .findByEmail(email)
                .filter(Operador.class::isInstance)
                .map(Operador.class::cast)
                .orElseGet(() -> operadorRepository.save(Operador.builder()
                        .nombre(nombre)
                        .apellido(apellido)
                        .dni(dni)
                        .email(email)
                        .telefono(tel)
                        .password(passwordEncoder.encode(password))
                        .legajo(legajo)
                        .activo(true)
                        .build()));
    }

    private Cliente ensureCliente(String nombre, String apellido, String dni, String email, String tel) {
        return personaRepository
                .findByEmail(email)
                .filter(Cliente.class::isInstance)
                .map(Cliente.class::cast)
                .orElseGet(() -> clienteRepository.save(Cliente.builder()
                        .nombre(nombre)
                        .apellido(apellido)
                        .dni(dni)
                        .email(email)
                        .telefono(tel)
                        .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .activo(true)
                        .build()));
    }

    private Auto ensureAuto(String patente, TipoVehiculo tipo, String modelo, Cliente cliente) {
        return autoRepository
                .findByPatenteIgnoreCase(patente)
                .orElseGet(() -> autoRepository.save(Auto.builder()
                        .patente(patente)
                        .tipo(tipo)
                        .modelo(modelo)
                        .cliente(cliente)
                        .build()));
    }

    private static String patenteAbonado(int i) {
        return String.format("AB%03dCD", 100 + i);
    }

    private static String patenteAbonadoExtra(int i) {
        return String.format("M%03dAB", 200 + i);
    }

    private static String patenteVisitante(int i) {
        return String.format("VV%03dAA", 300 + i);
    }

    private static int numCodigo(String codigo) {
        try {
            return Integer.parseInt(codigo.substring(1));
        } catch (Exception e) {
            return 0;
        }
    }

    private void retrocederEntrada(Long estadiaId, int minutos) {
        Estadia estadia = estadiaRepository.findById(estadiaId).orElse(null);
        if (estadia == null) {
            return;
        }
        estadia.setEntrada(LocalDateTime.now().minusMinutes(minutos));
        estadiaRepository.save(estadia);
    }
}
