package com.musicalsniffle.repository;

import com.musicalsniffle.model.Auto;
import com.musicalsniffle.model.EstadoEstadia;
import com.musicalsniffle.model.Estadia;
import com.musicalsniffle.model.Plaza;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EstadiaRepository extends JpaRepository<Estadia, Long> {

    Optional<Estadia> findByPlazaAndEstado(Plaza plaza, EstadoEstadia estado);

    Optional<Estadia> findByAutoAndEstado(Auto auto, EstadoEstadia estado);

    List<Estadia> findByEstado(EstadoEstadia estado);

    Optional<Estadia> findByAuto_PatenteIgnoreCaseAndEstado(String patente, EstadoEstadia estado);
}
