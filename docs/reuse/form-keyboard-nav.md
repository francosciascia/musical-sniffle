# Reuse: navegación de formularios con teclado

## Qué incluye
- `frontend/src/hooks/useFormArrowNav.js` — ↑/↓ entre inputs (no interfiere si hay listbox abierto)
- Patrón: envolver el diálogo en `<form onSubmit>` + botón `type="submit"` para **Enter**
- Cancelar / botones secundarios con `type="button"` (importante dentro de un form)

## Cómo cablearlo
1. Copiá el hook.
2. En el contenedor de campos: `onKeyDown={useFormArrowNav()}`.
3. Envolvé título + content + actions en `<form onSubmit={(e)=>{ e.preventDefault(); guardar() }}>`.
4. Autocomplete/Select: Enter elige opción si el menú está abierto; si no, envía el form.

## Ejemplo mínimo
```jsx
const onFormArrowNav = useFormArrowNav()
<form onSubmit={(e) => { e.preventDefault(); if (ok) save() }}>
  <DialogContent onKeyDown={onFormArrowNav}>...</DialogContent>
  <DialogActions>
    <Button type="button" onClick={onClose}>Cancelar</Button>
    <Button type="submit" disabled={!ok}>Guardar</Button>
  </DialogActions>
</form>
```

## Dónde está usado en musical-sniffle
Clientes, Operadores, Reservas, Ingreso, Egreso, Pago abono.
