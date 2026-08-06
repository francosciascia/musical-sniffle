CREATE TABLE ajustes_estacionamiento (
    id                            SMALLINT PRIMARY KEY DEFAULT 1,
    plaza_obligatoria             BOOLEAN NOT NULL DEFAULT FALSE,
    permitir_dos_motos_por_plaza  BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ajustes_estacionamiento_singleton CHECK (id = 1)
);

INSERT INTO ajustes_estacionamiento (id, plaza_obligatoria, permitir_dos_motos_por_plaza)
VALUES (1, FALSE, FALSE);
