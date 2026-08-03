package com.musicalsniffle.repository;

import com.musicalsniffle.model.Auto;
import com.musicalsniffle.model.EstadoEstadia;
import com.musicalsniffle.model.Estadia;
import com.musicalsniffle.model.Plaza;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EstadiaRepository extends JpaRepository<Estadia, Long> {

    Optional<Estadia> findByPlazaAndEstado(Plaza plaza, EstadoEstadia estado);

    Optional<Estadia> findByAutoAndEstado(Auto auto, EstadoEstadia estado);

    List<Estadia> findByEstado(EstadoEstadia estado);

    Optional<Estadia> findByAuto_PatenteIgnoreCaseAndEstado(String patente, EstadoEstadia estado);

    long countByEstado(EstadoEstadia estado);

    @Query("""
            SELECT e FROM Estadia e
            JOIN FETCH e.auto
            WHERE e.entrada BETWEEN :desde AND :hasta
            """)
    List<Estadia> findByEntradaBetweenWithAuto(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta);

    @Query("""
            SELECT e FROM Estadia e
            JOIN FETCH e.auto
            WHERE e.estado = :estado
              AND e.salida IS NOT NULL
              AND e.salida BETWEEN :desde AND :hasta
            """)
    List<Estadia> findCerradasEnPeriodo(
            @Param("estado") EstadoEstadia estado,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta);
}
