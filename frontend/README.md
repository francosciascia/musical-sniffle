# Frontend — Musical Sniffle

App React del estacionamiento.

## Stack

| Librería | Para qué |
|----------|----------|
| **React** | UI con componentes |
| **Vite** | Dev server + build |
| **Material UI** | Botones, formularios, layout |
| **React Konva** | Dibujar el mapa de plazas |
| **Axios** | Llamadas HTTP al backend |
| **React Router** | Navegación entre pantallas |

## Cómo correrlo

1. Levantá el backend (`docker compose up -d` + `.\mvnw.cmd spring-boot:run` en `backend/`)
2. En esta carpeta:

```powershell
npm run dev
```

Abrí http://localhost:5173

Login de prueba: `admin@musicalsniffle.com` / `admin123`

## Estructura

```
src/
├── api/client.js          → Axios configurado
├── components/ParkingMap  → Dibujos Konva
├── pages/LoginPage        → /login
├── pages/MapaPage         → /mapa
├── App.jsx                → Rutas + tema MUI
└── main.jsx               → Entrada de React
```
