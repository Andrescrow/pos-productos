# POS · Productos — Frontend

React + Vite. Consume la API definida en `VITE_API_URL`.

```bash
cp .env.example .env.local   # VITE_API_URL=http://localhost:4000
npm install
npm run dev                  # http://localhost:5173
```

En Vercel: Root Directory `frontend`, variable `VITE_API_URL` = URL de Render (sin `/` final ni `/api`).
