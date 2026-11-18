-- POS de productos · Usuarios para el inicio de sesión
-- Ejecutar en el SQL Editor de Neon (pegar todo y pulsar Run), después de schema.sql.
-- Es seguro ejecutarlo más de una vez: no duplica la tabla ni el usuario.

-- Extensión para cifrar contraseñas con bcrypt (disponible en Neon)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id             SERIAL PRIMARY KEY,
  usuario        VARCHAR(50)  NOT NULL UNIQUE,
  nombre         VARCHAR(120) NOT NULL,
  password_hash  TEXT         NOT NULL,
  activo         BOOLEAN      NOT NULL DEFAULT true,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Usuario de prueba (la contraseña se guarda cifrada)
-- Usuario: admin · Contraseña: Prueba123!  → cambiarla antes de un uso real.
INSERT INTO usuarios (usuario, nombre, password_hash)
VALUES ('admin', 'Administrador de prueba', crypt('Prueba123!', gen_salt('bf', 10)))
ON CONFLICT (usuario) DO NOTHING;

-- Verificación: debe mostrar admin con clave_correcta = true
SELECT usuario, nombre, activo,
       password_hash = crypt('Prueba123!', password_hash) AS clave_correcta
FROM usuarios;
