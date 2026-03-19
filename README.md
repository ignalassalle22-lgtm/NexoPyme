# NexoPyME

Plataforma integral de gestión para pequeñas y medianas empresas argentinas.

## Módulos

- **Hub** — Dashboard con KPIs, tipo de cambio, cobros y pagos pendientes
- **Ventas** — Facturas, presupuestos, remitos, cobranzas y presupuesto IA desde mensaje/PDF
- **Comercial** — Calendario con Google Calendar, bloc de notas y asistente IA
- **Compras** — Facturas a pagar, proveedores y listas de precios con doble moneda
- **Inventario** — Stock, importación masiva desde Excel, edición de artículos
- **Logística** — Planificación de rutas con optimización IA y Google Maps
- **Métricas** — Gráficos, drill-down, rankings y exportación a Excel

## Stack

- React 18 + Vite
- SheetJS (xlsx) para importación/exportación de Excel
- Claude API para IA comercial, optimización de rutas y presupuestos automáticos

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy

O desde CLI:
```bash
npm install -g vercel
vercel
```
