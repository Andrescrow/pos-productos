// URL base obtenida de las variables de entorno de Vite sin barra final
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

const CLAVE_SESION = 'pos-sesion';

/**
 * Devuelve la sesión guardada ({ token, usuario }) o null.
 */
export function obtenerSesion() {
  try {
    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION));
    return sesion?.token ? sesion : null;
  } catch {
    return null;
  }
}

function guardarSesion(sesion) {
  try {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  } catch {
    // Sin almacenamiento disponible: la sesión dura solo mientras la página esté abierta
  }
}

export function cerrarSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    // Ignorar
  }
}

/**
 * Inicia sesión y guarda el token recibido.
 * @returns {Promise<{ token: string, usuario: Object }>}
 */
export async function iniciarSesion(usuario, password) {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: usuario.trim(), password }),
  });
  const sesion = await handleResponse(res);
  guardarSesion(sesion);
  return sesion;
}

/**
 * fetch que agrega el token de la sesión. Si el servidor responde 401,
 * cierra la sesión y avisa a la aplicación para volver al login.
 */
async function fetchAutenticado(url, opciones = {}) {
  const sesion = obtenerSesion();
  const res = await fetch(url, {
    ...opciones,
    headers: {
      ...opciones.headers,
      ...(sesion ? { Authorization: `Bearer ${sesion.token}` } : {}),
    },
  });

  if (res.status === 401) {
    cerrarSesion();
    window.dispatchEvent(new Event('sesion-expirada'));
  }

  return res;
}

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
  const res = await fetchAutenticado(`${BASE_URL}/api/productos`);
  return handleResponse(res);
}

/**
 * Crea un nuevo producto.
 * @param {Object} producto - { codigo, nombre, categoria, precio, stock }
 */
export async function crearProducto(producto) {
  const res = await fetchAutenticado(`${BASE_URL}/api/productos`, {
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
  const res = await fetchAutenticado(`${BASE_URL}/api/productos/${id}`, {
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
  const res = await fetchAutenticado(`${BASE_URL}/api/productos/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res);
}
