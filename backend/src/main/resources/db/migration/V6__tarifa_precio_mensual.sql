ALTER TABLE tarifas
    ADD COLUMN IF NOT EXISTS precio_mensual NUMERIC(10, 2);

UPDATE tarifas SET precio_mensual = 30000 WHERE tipo_vehiculo = 'MOTO' AND precio_mensual IS NULL;
UPDATE tarifas SET precio_mensual = 45000 WHERE tipo_vehiculo = 'AUTO' AND precio_mensual IS NULL;
UPDATE tarifas SET precio_mensual = 50000 WHERE tipo_vehiculo = 'CAMIONETA' AND precio_mensual IS NULL;
UPDATE tarifas SET precio_mensual = 80000 WHERE tipo_vehiculo = 'CAMION' AND precio_mensual IS NULL;
