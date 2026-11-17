// URL base obtenida de las variables de entorno de Vite sin barra final
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

/**
 * Función auxiliar para procesar respuestas de la API y capturar errores de forma estandarizada.
 */
async function handleResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errorMsg = data?.error || `Error ${res.status}: ${res.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

/**
 * Obtiene la lista completa de productos.
 */
export async function listarProductos() {
  const res = await fetch(`${BASE_URL}/api/productos`);
  return handleResponse(res);
}

/**
 * Crea un nuevo producto.
 * @param {Object} producto - { codigo, nombre, categoria, precio, stock }
 */
export async function crearProducto(producto) {
  const res = await fetch(`${BASE_URL}/api/productos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      codigo: producto.codigo.trim(),
      nombre: producto.nombre.trim(),
      categoria: producto.categoria.trim(),
      precio: Number(producto.precio),
      stock: Number(producto.stock),
    }),
  });
  return handleResponse(res);
}

/**
 * Actualiza un producto existente por su ID.
 * @param {number|string} id 
 * @param {Object} producto - { codigo, nombre, categoria, precio, stock }
 */
export async function actualizarProducto(id, producto) {
  const res = await fetch(`${BASE_URL}/api/productos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      codigo: producto.codigo.trim(),
      nombre: producto.nombre.trim(),
      categoria: producto.categoria.trim(),
      precio: Number(producto.precio),
      stock: Number(producto.stock),
    }),
  });
  return handleResponse(res);
}

/**
 * Elimina un producto por su ID.
 * @param {number|string} id 
 */
export async function eliminarProducto(id) {
  const res = await fetch(`${BASE_URL}/api/productos/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}
