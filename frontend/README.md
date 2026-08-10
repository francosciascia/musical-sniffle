# Frontend — Musical Sniffle

UI del estacionamiento: mapa operativo, ingresos/egresos, abonos, clientes e historial.

## Stack

| Librería | Para qué |
|----------|----------|
| React 19 | UI |
| Vite | Dev server + build |
| Material UI | Layout y formularios |
| React Konva | Mapa / grilla de plazas |
| Axios | HTTP al backend (`/api`) |
| React Router | Rutas |

## Cómo correrlo

1. Backend arriba (Postgres nativo o Docker + `spring-boot:run`)
2. En esta carpeta:

```powershell
npm install
npm run dev
```

Abrí http://localhost:5173

Login seed: `admin@musicalsniffle.com` / `admin123`

## Scripts

| Comando | |
|---------|--|
| `npm run dev` | Desarrollo (proxy `/api` → `:8080`) |
| `npm run build` | Build producción |
| `npm run preview` | Preview del build |

## Estructura

```
src/
├── api/client.js           Axios + JWT
├── components/             Mapa, diálogos, paneles
├── pages/                  Pantallas por ruta
├── utils/                  Auth, patentes, eventos, etc.
├── App.jsx                 Rutas
└── main.jsx                Entrada
```

Ver el [README raíz](../README.md) para el flujo completo del sistema y Mercado Pago.
