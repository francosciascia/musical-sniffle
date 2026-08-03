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

    @Query("""
            SELECT r FROM Reserva r
            JOIN r.autos a
            WHERE a.id = :autoId
              AND r.estado = :estado
              AND r.fechaInicio <= :fecha
              AND (r.fechaFin IS NULL OR r.fechaFin >= :fecha)
            """)
    Optional<Reserva> findActivaByAutoId(
            @Param("autoId") Long autoId,
            @Param("estado") EstadoReserva estado,
            @Param("fecha") LocalDate fecha);

    List<Reserva> findByClienteId(Long clienteId);

    @Query("""
            SELECT r FROM Reserva r
            WHERE r.plaza.id = :plazaId
              AND r.estado = :estado
              AND r.fechaInicio <= :fecha
              AND (r.fechaFin IS NULL OR r.fechaFin >= :fecha)
            """)
    Optional<Reserva> findActivaByPlazaId(
            @Param("plazaId") Long plazaId,
            @Param("estado") EstadoReserva estado,
            @Param("fecha") LocalDate fecha);

    Optional<Reserva> findByClienteIdAndEstado(Long clienteId, EstadoReserva estado);

    List<Reserva> findByEstadoAndFechaFinBefore(EstadoReserva estado, LocalDate fecha);

    long countByEstado(EstadoReserva estado);
}
