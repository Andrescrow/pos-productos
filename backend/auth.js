import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import 'dotenv/config';

// Duración de la sesión: 8 horas (una jornada de trabajo)
const DURACION_SESION_MS = 8 * 60 * 60 * 1000;

// Clave para firmar los tokens. Debe definirse AUTH_SECRET en producción;
// si falta, se genera una temporal y las sesiones se pierden al reiniciar el servidor.
let SECRET = process.env.AUTH_SECRET;
if (!SECRET) {
  SECRET = randomBytes(32).toString('hex');
  console.warn(
    '⚠️  ADVERTENCIA: process.env.AUTH_SECRET no está definido. Se usa una clave temporal: ' +
      'las sesiones se cerrarán cada vez que se reinicie el servidor.'
  );
}

function firmar(datos) {
  return createHmac('sha256', SECRET).update(datos).digest('base64url');
}

/**
 * Genera un token firmado con los datos del usuario y su fecha de expiración.
 * Formato: <payload en base64url>.<firma HMAC-SHA256>
 */
export function crearToken(usuario) {
  const payload = Buffer.from(
    JSON.stringify({
      id: usuario.id,
      usuario: usuario.usuario,
      nombre: usuario.nombre,
      exp: Date.now() + DURACION_SESION_MS,
    })
  ).toString('base64url');
  return `${payload}.${firmar(payload)}`;
}

/**
 * Verifica la firma y la expiración del token. Devuelve los datos del usuario o null.
 */
export function verificarToken(token) {
  if (typeof token !== 'string') return null;
  const [payload, firma] = token.split('.');
  if (!payload || !firma) return null;

  const esperada = Buffer.from(firmar(payload));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    return null;
  }

  try {
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof datos.exp !== 'number' || datos.exp < Date.now()) return null;
    return datos;
  } catch {
    return null;
  }
}

/**
 * Middleware de Express: exige un token válido en el encabezado
 * Authorization: Bearer <token>
 */
export function requireAuth(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  const usuario = tipo === 'Bearer' ? verificarToken(token) : null;

  if (!usuario) {
    return res
      .status(401)
      .json({ error: 'Tu sesión expiró o no es válida. Inicia sesión nuevamente.' });
  }

  req.usuario = usuario;
  next();
}
