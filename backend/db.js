import pg from 'pg';
import 'dotenv/config';

const { Pool, types } = pg;

// OID 1700 corresponde a tipos NUMERIC / DECIMAL en PostgreSQL.
// Por defecto pg lo retorna como string para evitar pérdida de precisión;
// configuramos el parser para devolverlo como número nativo en JavaScript.
types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

if (!process.env.DATABASE_URL) {
  console.warn('⚠️  ADVERTENCIA: process.env.DATABASE_URL no está definido. Asegúrate de crear el archivo .env con tu cadena de conexión de Neon.');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
      ? { rejectUnauthorized: false }
      : false,
});
