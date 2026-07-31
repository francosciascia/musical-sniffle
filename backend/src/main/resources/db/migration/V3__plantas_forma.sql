CREATE TABLE plantas (
    id     BIGSERIAL PRIMARY KEY,
    piso   INTEGER NOT NULL UNIQUE,
    celdas TEXT    NOT NULL DEFAULT '[]'
);
