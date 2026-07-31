ALTER TABLE autos
    ADD COLUMN modelo VARCHAR(100) NOT NULL DEFAULT 'Sin especificar';

ALTER TABLE plazas
    ADD COLUMN piso   INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN pos_x  INTEGER,
    ADD COLUMN pos_y  INTEGER;

UPDATE plazas
SET pos_x = ((rn - 1) % 5),
    pos_y = ((rn - 1) / 5)
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM plazas
) AS numbered
WHERE plazas.id = numbered.id
  AND plazas.pos_x IS NULL;
