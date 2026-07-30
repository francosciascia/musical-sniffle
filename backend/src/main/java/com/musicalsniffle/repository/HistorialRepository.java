package com.musicalsniffle.repository;

import com.musicalsniffle.model.Historial;
import com.musicalsniffle.model.TipoEvento;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HistorialRepository extends JpaRepository<Historial, Long> {

    List<Historial> findByFechaHoraBetweenOrderByFechaHoraDesc(
            LocalDateTime desde, LocalDateTime hasta);

    List<Historial> findByTipoEventoOrderByFechaHoraDesc(TipoEvento tipoEvento);

    @Query("""
            SELECT COALESCE(SUM(h.monto), 0) FROM Historial h
            WHERE h.tipoEvento IN :tipos
              AND h.fechaHora BETWEEN :desde AND :hasta
            """)
    BigDecimal sumMontosByTiposAndPeriodo(
            @Param("tipos") List<TipoEvento> tipos,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta);
}
