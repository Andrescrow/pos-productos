-- POS de productos · Taller Vibe Coding (UNED)
-- Ejecutar en el SQL Editor de Neon (pegar todo y pulsar Run).
-- Es seguro ejecutarlo más de una vez: no duplica la tabla ni los productos.

CREATE TABLE IF NOT EXISTS productos (
  id             SERIAL PRIMARY KEY,
  codigo         VARCHAR(30)   NOT NULL UNIQUE,
  nombre         VARCHAR(120)  NOT NULL,
  categoria      VARCHAR(60)   NOT NULL,
  precio         NUMERIC(10,2) NOT NULL CHECK (precio > 0),
  stock          INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  creado_en      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Actualiza actualizado_en automáticamente en cada UPDATE
CREATE OR REPLACE FUNCTION set_actualizado_en() RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_productos_actualizado ON productos;
CREATE TRIGGER trg_productos_actualizado
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

-- Datos de ejemplo (precios en colones)
INSERT INTO productos (codigo, nombre, categoria, precio, stock) VALUES
  ('ABA001', 'Arroz 1 kg',               'Abarrotes', 1250, 40),
  ('ABA002', 'Frijoles negros 900 g',    'Abarrotes', 1650, 35),
  ('ABA003', 'Café molido 500 g',        'Abarrotes', 3200, 25),
  ('ABA004', 'Azúcar 2 kg',              'Abarrotes', 1900, 30),
  ('ABA005', 'Aceite vegetal 1 L',       'Abarrotes', 2100, 20),
  ('BEB001', 'Agua 600 ml',              'Bebidas',    600, 60),
  ('BEB002', 'Jugo de naranja 1 L',      'Bebidas',   1500, 24),
  ('BEB003', 'Refresco cola 2 L',        'Bebidas',   1800, 30),
  ('LAC001', 'Leche 1 L',                'Lácteos',   1100, 36),
  ('LAC002', 'Queso turrialba 500 g',    'Lácteos',   3500, 15),
  ('LIM001', 'Jabón de manos 250 ml',    'Limpieza',  1200, 18),
  ('LIM002', 'Papel higiénico 4 rollos', 'Limpieza',  2300, 22)
ON CONFLICT (codigo) DO NOTHING;

-- Verificación: debe devolver 12 filas
SELECT * FROM productos ORDER BY nombre;
