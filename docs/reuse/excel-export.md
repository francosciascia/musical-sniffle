# Reuse: exportar a Excel

## Qué incluye
- `frontend/src/utils/exportExcel.js`
- Dependencia: `xlsx` (SheetJS)

## Cómo cablearlo
```bash
npm i xlsx
```
```js
import { exportExcel } from './utils/exportExcel'
exportExcel(rows, 'historial.xlsx', 'Historial')
```

Reemplaza o complementa CSV (`exportCsv.js`) cuando el operador abre el archivo en Excel.

## Dónde está usado
Historial / caja (`HistorialPage.jsx`).
