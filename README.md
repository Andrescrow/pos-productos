# POS · Productos

Mini punto de venta (CRUD de productos) del **Taller Vibe Coding**.

| Capa | Tecnología | Nube | Carpeta |
|---|---|---|---|
| Frontend | React + Vite | Vercel | `frontend/` |
| API | Node.js + Express + pg | Render | `backend/` |
| Base de datos | PostgreSQL | Neon | `database/schema.sql` |

```
Navegador → Vercel (frontend) → Render (API) → Neon (Postgres)
```

---

## 1. Neon (base de datos)

1. [console.neon.tech](https://console.neon.tech) → **New Project** → nombre `pos-productos`.
2. **SQL Editor** → pegar todo `database/schema.sql` → **Run**. Debe mostrar 12 productos.
3. **Connect** → activar *Connection pooling* → copiar la cadena. Esa es la `DATABASE_URL`.

## 2. Render (backend)

**New → Web Service** → conectar este repositorio.

| Campo | Valor |
|---|---|
| Name | `pos-productos-api` |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | Free |
| Health Check Path | `/api/health` |

**Environment Variables**

| Variable | Valor |
|---|---|
| `DATABASE_URL` | cadena de Neon |
| `CORS_ORIGIN` | URL de Vercel (se agrega en el paso 4) |

> No definir `PORT`: lo asigna Render.

Probar: `https://<tu-api>.onrender.com/api/health` → `{"status":"ok"}`
y `https://<tu-api>.onrender.com/api/productos` → 12 productos.

## 3. Vercel (frontend)

**Add New → Project** → importar este repositorio.

| Campo | Valor |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite (automático) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Env `VITE_API_URL` | `https://<tu-api>.onrender.com` (sin `/` final ni `/api`) |

> Las variables `VITE_*` se incrustan al construir: si se cambian, hacer **Redeploy**.

## 4. Cerrar el círculo (CORS)

En Render → Environment → `CORS_ORIGIN` = `https://<tu-app>.vercel.app` → **Save, rebuild and deploy**.
Se pueden poner varias URLs separadas por coma (ej. producción y preview).

---

## Desarrollo local

```bash
# Terminal 1 — API
cd backend
cp .env.example .env        # pegar DATABASE_URL de Neon
npm install
npm run dev                 # http://localhost:4000/api/health

# Terminal 2 — Frontend
cd frontend
cp .env.example .env.local  # VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:5173
```

## API

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/health` | `{ status: "ok" }` |
| GET | `/api/productos` | lista ordenada por nombre |
| GET | `/api/productos/:id` | producto o 404 |
| POST | `/api/productos` | 201, 400 (validación) o 409 (código repetido) |
| PUT | `/api/productos/:id` | 200, 400, 404 o 409 |
| DELETE | `/api/productos/:id` | 200 o 404 |

## Problemas comunes

| Síntoma | Solución |
|---|---|
| Error de CORS | `CORS_ORIGIN` en Render debe ser exactamente la URL de Vercel (https, sin `/` final) |
| "Failed to fetch" en Vercel | Falta `VITE_API_URL` o no se hizo Redeploy |
| Primera carga tarda ~50 s | Render Free estaba dormido; es normal |
| "Cannot find package.json" | Root Directory = `backend` (Render) / `frontend` (Vercel) |
| "relation productos does not exist" | Ejecutar `database/schema.sql` en el mismo proyecto de Neon |
| Error SSL / autenticación | Usar la cadena con `sslmode=require`; si falla, quitar `&channel_binding=require` |
