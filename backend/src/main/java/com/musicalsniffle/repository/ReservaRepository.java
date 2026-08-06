package com.musicalsniffle.repository;

import com.musicalsniffle.model.Cliente;
import com.musicalsniffle.model.EstadoReserva;
import com.musicalsniffle.model.Reserva;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    /**
     * Abono vigente para un auto: ya empezó ({@code hoy}) y no venció
     * (incluye gracia vía {@code fechaFinMinima} = hoy − días de gracia).
     */
    @Query("""
            SELECT r FROM Reserva r
            JOIN r.autos a
            WHERE a.id = :autoId
              AND r.estado = :estado
              AND r.fechaInicio <= :hoy
              AND (r.fechaFin IS NULL OR r.fechaFin >= :fechaFinMinima)
            """)
    Optional<Reserva> findActivaByAutoId(
            @Param("autoId") Long autoId,
            @Param("estado") EstadoReserva estado,
            @Param("hoy") LocalDate hoy,
            @Param("fechaFinMinima") LocalDate fechaFinMinima);

    List<Reserva> findByClienteId(Long clienteId);

    /**
     * Plaza con abono vigente. No usar la fecha de gracia para {@code fechaInicio}:
     * si no, abonos recién creados no aparecen en el mapa durante N días.
     */
    @Query("""
            SELECT r FROM Reserva r
            WHERE r.plaza.id = :plazaId
              AND r.estado = :estado
              AND r.fechaInicio <= :hoy
              AND (r.fechaFin IS NULL OR r.fechaFin >= :fechaFinMinima)
            """)
    Optional<Reserva> findActivaByPlazaId(
            @Param("plazaId") Long plazaId,
            @Param("estado") EstadoReserva estado,
            @Param("hoy") LocalDate hoy,
            @Param("fechaFinMinima") LocalDate fechaFinMinima);

    Optional<Reserva> findByClienteIdAndEstado(Long clienteId, EstadoReserva estado);

    List<Reserva> findByEstadoAndFechaFinBefore(EstadoReserva estado, LocalDate fecha);

    long countByEstado(EstadoReserva estado);

    boolean existsByPlazaId(Long plazaId);

    @Query("""
            SELECT DISTINCT r FROM Reserva r
            JOIN FETCH r.cliente
            JOIN FETCH r.plaza
            LEFT JOIN FETCH r.autos
            WHERE r.estado IN :estados
            """)
    List<Reserva> findParaCobrar(@Param("estados") List<EstadoReserva> estados);

    @Query("""
            SELECT DISTINCT r FROM Reserva r
            JOIN FETCH r.cliente
            JOIN FETCH r.plaza
            LEFT JOIN FETCH r.autos
            WHERE r.estado IN :estados
              AND r.fechaFin IS NOT NULL
              AND r.fechaFin <= :hasta
            ORDER BY r.fechaFin ASC
            """)
    List<Reserva> findParaCobrarHasta(
            @Param("estados") List<EstadoReserva> estados,
            @Param("hasta") LocalDate hasta);

    @Query("""
            SELECT r FROM Reserva r
            WHERE r.estado = :estado
              AND r.fechaFin IS NOT NULL
              AND r.fechaFin < :antesDe
            """)
    List<Reserva> findActivasConFinAntesDe(
            @Param("estado") EstadoReserva estado,
            @Param("antesDe") LocalDate antesDe);

    @Query("""
            SELECT r FROM Reserva r
            JOIN r.autos a
            WHERE a.id = :autoId
              AND r.estado = :estado
            """)
    Optional<Reserva> findByAutoIdAndEstado(
            @Param("autoId") Long autoId,
            @Param("estado") EstadoReserva estado);
}
