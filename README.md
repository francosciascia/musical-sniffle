# Musical Sniffle

Proyecto full-stack: backend en Java/Spring Boot y frontend en React (próximamente).

## Estructura

```
musical-sniffle/
├── backend/          → API REST (Java 21 + Spring Boot 3 + PostgreSQL)
├── frontend/         → App React (pendiente)
└── docker-compose.yml → PostgreSQL local
```

## Requisitos

- Java 21
- Docker (para PostgreSQL)

No hace falta instalar Maven: el proyecto incluye `mvnw`.

## Cómo levantar el proyecto

### 1. Base de datos

```powershell
docker compose up -d
```

Esto levanta PostgreSQL en el puerto `5432` con:
- Base: `musical_sniffle`
- Usuario: `postgres`
- Contraseña: `postgres`

### 2. Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

La API queda en `http://localhost:8080`.

### Endpoints de ejemplo

| Método | URL | Descripción |
|--------|-----|-------------|
| GET | `/api/songs` | Lista canciones |
| POST | `/api/songs` | Crea una canción |

Ejemplo POST:

```json
{
  "title": "Bohemian Rhapsody",
  "artist": "Queen",
  "album": "A Night at the Opera"
}
```

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Java 21, Spring Boot 3.4, Spring Data JPA |
| Base de datos | PostgreSQL 16 |
| Frontend | React (pendiente) |
