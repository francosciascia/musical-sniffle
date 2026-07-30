package com.musicalsniffle.repository;

import com.musicalsniffle.model.Estadia;
import com.musicalsniffle.model.Ticket;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByCodigo(String codigo);

    Optional<Ticket> findByEstadia(Estadia estadia);

    Optional<Ticket> findByEstadiaId(Long estadiaId);
}
