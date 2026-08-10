# Musical Sniffle

Sistema de **estacionamiento** (operación diaria + abonos mensuales): mapa de plazas, ingresos/egresos, tarifas por bloques de 30 minutos, historial y cobros con Mercado Pago.

Monorepo:

```
musical-sniffle/
├── backend/                 Spring Boot 3 + Java 21 + PostgreSQL
├── frontend/                React + Vite + MUI + Konva
├── docker-compose.yml       PostgreSQL opcional (si no usás Postgres nativo)
└── README.md
```

## Stack

| Capa | Tecnología |
|------|------------|
| API | Java 21, Spring Boot 3.4, Spring Security (JWT), Flyway, SpringDoc |
| DB | PostgreSQL 16 |
| Front | React 19, Vite, MUI, React Konva, Axios, React Router |
| Pagos | Mercado Pago (Checkout Pro: preferencias, polling, webhook) |

## Requisitos

- **Java 21**
- **Node.js** (LTS)
- **PostgreSQL** (instalado en la máquina **o** vía Docker)
- Maven no hace falta instalar: está `backend/mvnw`

## Arranque rápido

### 1. Base de datos

Podés usar **Postgres nativo** (como en Windows con el servicio `postgresql-x64-…`) **o** Docker. No hace falta los dos.

#### Opción A — Postgres instalado (lo más común en local)

1. Servicio Postgres corriendo en el puerto `5432`
2. Creá la base si no existe: `musical_sniffle`
3. En `application-local.yml` poné el usuario/password de **tu** instalación (ej. `postgres` / `1234`)

#### Opción B — Docker

```powershell
docker compose up -d
```

| | |
|--|--|
| Host | `localhost:5432` |
| DB | `musical_sniffle` |
| User | `postgres` |
| Password | `postgres` (la del `docker-compose.yml`) |

Si usás Docker, el password de `application-local.yml` tiene que ser `postgres` (o el que definas en el compose).

### 2. Secretos locales (obligatorio)

```powershell
copy backend\src\main\resources\application-local.yml.example backend\src\main\resources\application-local.yml
```

Editá `application-local.yml`:

- `spring.datasource.password` → la de tu Postgres (nativo o Docker)
- `app.jwt.secret` → string ≥ 32 caracteres
- `app.mercadopago.access-token` → Access Token de MP (opcional al principio)

`application-local.yml` **no se sube a Git**.

### 3. Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

- API: http://localhost:8080  
- Swagger: http://localhost:8080/swagger-ui.html  

### 4. Frontend

```powershell
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173  
- El Vite proxy manda `/api` → `http://127.0.0.1:8080`

### Login inicial

| Email | Password | Rol |
|-------|----------|-----|
| `admin@musicalsniffle.com` | `admin123` | Administrador |

Se crea solo al primer arranque (`AdminDataInitializer`). Cambiá esa clave en cuanto no sea solo local.

## Qué hace el sistema

### Operación
- **Mapa** por piso: plazas libres / reservadas (abonado) / ocupadas
- **Ingreso** con patente + modelo (plaza opcional); emite **ticket de entrada**
- **Egreso** con cobro: efectivo (vuelto), transferencia (comprobante) o QR Mercado Pago
- Cobro visitante por **bloques de 30 minutos** (fracción iniciada)

### Abonos
- Cliente + plaza fija + patentes autorizadas
- Pago mensual (efectivo / transferencia / QR)
- Listado “a cobrar”, suspensión, reglas de gracia/avisos en Configuración

### Roles
| Rol | Uso |
|-----|-----|
| `ADMINISTRADOR` | Todo: clientes, abonos, tarifas, reglas, operadores, mapa |
| `USUARIO` | Operación: mapa, estadías, historial |
| Cliente | Solo dato (no login) |

## Mercado Pago (opcional)

Flujo resumido:

1. Tu API crea una **preferencia** (`POST` a MP) con `external_reference` (`reserva:{id}` o `estadia:{id}`)
2. El cliente paga en el **checkout**
3. Tu API se entera por **polling** (`GET .../mercadopago-estado`) y/o **webhook** (`POST /api/webhooks/mercadopago`)
4. Si el **payment** está `approved`, registra el abono o cierra el egreso sola

En local el **polling** alcanza. El webhook necesita URL pública (`notification-url`, ej. ngrok).

Config en `application-local.yml`:

```yaml
app:
  mercadopago:
    enabled: true
    sandbox: true          # pruebas
    access-token: "..."    # Pruebas o Producción
```

## Variables útiles

Definibles por entorno o en `application-local.yml` (ver `application.yml`):

| Variable | Uso |
|----------|-----|
| `DB_PASSWORD` / password local | Postgres |
| `JWT_SECRET` | Firma de tokens |
| `MP_ACCESS_TOKEN` | Mercado Pago |
| `MP_ENABLED` | `true`/`false` |
| `MP_SANDBOX` | Modo prueba |
| `MP_NOTIFICATION_URL` | Webhook público |
| `SPRING_PROFILES_ACTIVE` | Default: `local` |

## Desarrollo

```powershell
# Tests backend
cd backend
.\mvnw.cmd test

# Build frontend
cd frontend
npm run build
```

Más detalle del front: [`frontend/README.md`](frontend/README.md).

## Notas

- No commitees `application-local.yml`, `.env` ni Access Tokens.
- Si rotás el token de MP, actualizá solo tu archivo local.
- El password de `application-local.yml` tiene que coincidir con el Postgres que estés usando (nativo o Docker).
- Docker es **opcional**: si ya tenés Postgres en Windows/macOS/Linux, usalo directo.
