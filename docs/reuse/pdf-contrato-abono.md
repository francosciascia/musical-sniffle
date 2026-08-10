# Reuse: PDF de contrato de abono

## Qué incluye
- `frontend/src/utils/contratoAbonoPdf.js`
- Dependencia: `jspdf`

## Cómo cablearlo
```bash
npm i jspdf
```
Tras crear el abono, llamá al helper con datos de reserva + cliente para descargar el PDF.

## Dónde está usado
`ReservasPage.jsx` al crear abono mensual.
