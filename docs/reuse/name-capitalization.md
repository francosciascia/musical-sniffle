# Reuse: capitalizar nombres

## Qué incluye
- Backend: `backend/src/main/java/com/musicalsniffle/util/TextoNormalizer.java`
- Frontend: `frontend/src/utils/texto.js` (`capitalizarNombre`)

## Comportamiento
`"juan CARLOS"` → `"Juan Carlos"` (trim, espacios colapsados, cada palabra con mayúscula inicial).

## Cómo cablearlo
- Al persistir en el servicio (`PersonaService` o equivalente), normalizá `nombre`/`apellido` con `TextoNormalizer.capitalizarNombre`.
- En el frontend, aplicá `capitalizarNombre` al armar el payload (feedback inmediato en UI).

Normalizar en backend es la fuente de verdad (cualquier cliente queda consistente).
