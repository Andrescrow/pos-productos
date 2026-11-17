import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { pool } from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Configuración de CORS con process.env.CORS_ORIGIN
// Acepta una o varias URLs separadas por coma (ej. producción + preview de Vercel).
// Se quita la barra final para evitar el error más común al copiar la URL.
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
  })
);

// Middleware para parsear JSON en el cuerpo de las peticiones
app.use(express.json());

/**
 * Normaliza y formatea los datos del producto retornando el precio como número.
 */
function formatProducto(row) {
  return {
    id: Number(row.id),
    codigo: row.codigo,
    nombre: row.nombre,
    categoria: row.categoria,
    precio: Number(row.precio),
    stock: Number(row.stock),
  };
}

/**
 * Valida los datos requeridos para crear o actualizar un producto.
 * Valida campos obligatorios, precio > 0 y stock entero >= 0.
 */
function validateProductoPayload(body) {
  const { codigo, nombre, categoria, precio, stock } = body;

  if (
    codigo === undefined ||
    nombre === undefined ||
    categoria === undefined ||
    precio === undefined ||
    stock === undefined ||
    typeof codigo !== 'string' ||
    codigo.trim() === '' ||
    typeof nombre !== 'string' ||
    nombre.trim() === '' ||
    typeof categoria !== 'string' ||
    categoria.trim() === '' ||
    precio === null ||
    precio === '' ||
    stock === null ||
    stock === ''
  ) {
    return {
      isValid: false,
      error: 'Todos los campos son obligatorios: codigo, nombre, categoria, precio y stock',
    };
  }

  const numPrecio = Number(precio);
  if (isNaN(numPrecio) || numPrecio <= 0) {
    return {
      isValid: false,
      error: 'El precio debe ser un número mayor a 0',
    };
  }

  const numStock = Number(stock);
  if (!Number.isInteger(numStock) || numStock < 0) {
    return {
      isValid: false,
      error: 'El stock debe ser un número entero mayor o igual a 0',
    };
  }

  return {
    isValid: true,
    data: {
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      categoria: categoria.trim(),
      precio: numPrecio,
      stock: numStock,
    },
  };
}

// ==========================================
// Rutas de la API
// ==========================================

// GET /api/health
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// GET /api/productos - Listar todos los productos (ordenados por nombre, RF-01)
app.get('/api/productos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, codigo, nombre, categoria, precio, stock FROM productos ORDER BY nombre ASC'
    );
    const productos = result.rows.map(formatProducto);
    res.status(200).json(productos);
  } catch (error) {
    console.error('Error al listar productos:', error);
    res.status(500).json({ error: 'Error inesperado al obtener los productos' });
  }
});

// GET /api/productos/:id - Obtener un producto por ID
app.get('/api/productos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  try {
    const result = await pool.query(
      'SELECT id, codigo, nombre, categoria, precio, stock FROM productos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.status(200).json(formatProducto(result.rows[0]));
  } catch (error) {
    console.error('Error al obtener producto por ID:', error);
    res.status(500).json({ error: 'Error inesperado al consultar el producto' });
  }
});

// POST /api/productos - Crear un nuevo producto
app.post('/api/productos', async (req, res) => {
  const validation = validateProductoPayload(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }

  const { codigo, nombre, categoria, precio, stock } = validation.data;

  try {
    const query = `
      INSERT INTO productos (codigo, nombre, categoria, precio, stock)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, codigo, nombre, categoria, precio, stock
    `;
    const result = await pool.query(query, [codigo, nombre, categoria, precio, stock]);
    res.status(201).json(formatProducto(result.rows[0]));
  } catch (error) {
    // Código de violación de restricción UNIQUE en PostgreSQL: 23505
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El código del producto ya existe' });
    }
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error inesperado al crear el producto' });
  }
});

// PUT /api/productos/:id - Actualizar un producto existente
app.put('/api/productos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const validation = validateProductoPayload(req.body);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }

  const { codigo, nombre, categoria, precio, stock } = validation.data;

  try {
    const query = `
      UPDATE productos
      SET codigo = $1, nombre = $2, categoria = $3, precio = $4, stock = $5
      WHERE id = $6
      RETURNING id, codigo, nombre, categoria, precio, stock
    `;
    const result = await pool.query(query, [codigo, nombre, categoria, precio, stock, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.status(200).json(formatProducto(result.rows[0]));
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El código del producto ya existe' });
    }
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error inesperado al actualizar el producto' });
  }
});

// DELETE /api/productos/:id - Eliminar un producto
app.delete('/api/productos/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  try {
    const query = `
      DELETE FROM productos
      WHERE id = $1
      RETURNING id, codigo, nombre, categoria, precio, stock
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.status(200).json({
      message: 'Producto eliminado exitosamente',
      producto: formatProducto(result.rows[0]),
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error inesperado al eliminar el producto' });
  }
});

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
