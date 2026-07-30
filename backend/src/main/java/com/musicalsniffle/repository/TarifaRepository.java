package com.musicalsniffle.repository;

import com.musicalsniffle.model.Tarifa;
import com.musicalsniffle.model.TipoVehiculo;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TarifaRepository extends JpaRepository<Tarifa, Long> {

    Optional<Tarifa> findByTipoVehiculoAndActivaTrue(TipoVehiculo tipoVehiculo);

    Optional<Tarifa> findByTipoVehiculo(TipoVehiculo tipoVehiculo);
}
