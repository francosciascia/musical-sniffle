CREATE TABLE personas (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(255) NOT NULL,
    apellido    VARCHAR(255) NOT NULL,
    dni         VARCHAR(20)  NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    telefono    VARCHAR(30)  NOT NULL,
    password    VARCHAR(255) NOT NULL,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE clientes (
    persona_id BIGINT PRIMARY KEY REFERENCES personas (id)
);

CREATE TABLE operadores (
    persona_id BIGINT      PRIMARY KEY REFERENCES personas (id),
    legajo     VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE super_admins (
    persona_id BIGINT PRIMARY KEY REFERENCES personas (id)
);

CREATE TABLE autos (
    id         BIGSERIAL PRIMARY KEY,
    patente    VARCHAR(255) NOT NULL UNIQUE,
    tipo       VARCHAR(50)  NOT NULL,
    cliente_id BIGINT REFERENCES clientes (persona_id)
);

CREATE TABLE plazas (
    id     BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    activa BOOLEAN     NOT NULL DEFAULT TRUE
);

CREATE TABLE tarifas (
    id                      BIGSERIAL PRIMARY KEY,
    tipo_vehiculo           VARCHAR(50)   NOT NULL UNIQUE,
    precio_por_hora         NUMERIC(10,2) NOT NULL,
    monto_minimo            NUMERIC(10,2),
    minutos_para_media_hora INTEGER,
    activa                  BOOLEAN       NOT NULL DEFAULT TRUE
);

CREATE TABLE reservas (
    id             BIGSERIAL PRIMARY KEY,
    cliente_id     BIGINT        NOT NULL REFERENCES clientes (persona_id),
    plaza_id       BIGINT        NOT NULL REFERENCES plazas (id),
    fecha_inicio   DATE          NOT NULL,
    fecha_fin      DATE,
    monto_mensual  NUMERIC(10,2) NOT NULL,
    estado         VARCHAR(50)   NOT NULL,
    creada_en      TIMESTAMP     NOT NULL
);

CREATE TABLE reserva_autos (
    reserva_id BIGINT NOT NULL REFERENCES reservas (id),
    auto_id    BIGINT NOT NULL REFERENCES autos (id),
    PRIMARY KEY (reserva_id, auto_id)
);

CREATE TABLE estadias (
    id         BIGSERIAL PRIMARY KEY,
    auto_id    BIGINT        NOT NULL REFERENCES autos (id),
    plaza_id   BIGINT REFERENCES plazas (id),
    cliente_id BIGINT REFERENCES clientes (persona_id),
    reserva_id BIGINT REFERENCES reservas (id),
    entrada    TIMESTAMP     NOT NULL,
    salida     TIMESTAMP,
    estado     VARCHAR(50)   NOT NULL,
    monto      NUMERIC(10,2),
    abonado    BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE TABLE tickets (
    id         BIGSERIAL PRIMARY KEY,
    codigo     VARCHAR(30) NOT NULL UNIQUE,
    emitido_en TIMESTAMP   NOT NULL,
    estadia_id BIGINT      NOT NULL UNIQUE REFERENCES estadias (id),
    cliente_id BIGINT REFERENCES clientes (persona_id)
);

CREATE TABLE historial (
    id            BIGSERIAL PRIMARY KEY,
    tipo_evento   VARCHAR(50)   NOT NULL,
    fecha_hora    TIMESTAMP     NOT NULL,
    descripcion   VARCHAR(500)  NOT NULL,
    persona_id    BIGINT REFERENCES personas (id),
    entidad_tipo  VARCHAR(50),
    entidad_id    BIGINT,
    monto         NUMERIC(10,2)
);

CREATE INDEX idx_estadias_auto_estado ON estadias (auto_id, estado);
CREATE INDEX idx_estadias_plaza_estado ON estadias (plaza_id, estado);
CREATE INDEX idx_historial_fecha ON historial (fecha_hora);
CREATE INDEX idx_historial_tipo ON historial (tipo_evento);
