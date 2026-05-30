# NASS Admin Panel

**National Advanced Security System** — Panel de administración web para el monitoreo y gestión de emergencias ciudadanas en Quibdó, Chocó, Colombia.

Diseñado para uso operacional en alta presión: claridad visual extrema, modo oscuro permanente, datos en tiempo real (mock) y flujo de estado inmutable por incidencia.

---

## Capturas de pantalla

| Dashboard | Mapa en tiempo real |
|---|---|
| KPIs + tendencia 7 días + alertas críticas | Leaflet dark tiles + marcadores por estado |

| Analítica | Gestión de Incidencias |
|---|---|
| 9 secciones · heatmap 7×24 · donut · radial · funnel | Tabla filtrable + línea de tiempo por incidencia |

---

## Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Lenguaje | TypeScript strict | 5.x |
| Estilos | Tailwind CSS v4 + CSS variables | 4.x |
| Estado cliente | Zustand | 5.x |
| Cache / fetching | TanStack Query | 5.x |
| Mapas | React-Leaflet + CartoDB DarkMatter | 5.x |
| Gráficos | Recharts | 3.x |
| UI primitivos | shadcn/ui (Base UI) | — |
| Iconos | Lucide React | — |
| Notificaciones | Sonner | 2.x |
| Runtime | React 19 | 19.x |

---

## Paneles

### 1. Dashboard General `/dashboard`
Vista de comando operacional con KPIs en tiempo real.

- **Incidencias activas** — total fuera de estado cerrada/cancelada
- **Reportadas hoy** — filtradas por fecha local
- **Agentes disponibles** — ratio sobre total de agentes
- **Tiempo promedio de respuesta** — valor mock estático
- Gráfico de tendencia 7 días (AreaChart)
- Distribución por estado (BarChart agrupado)
- Lista de alertas críticas activas (severidad ≥ 4)

### 2. Mapa en Tiempo Real `/mapa`
Leaflet cargado exclusivamente en cliente (`dynamic({ ssr: false })`).

- Tiles oscuros: CartoDB DarkMatter
- Centro: `lat 5.6919, lng -76.6583` (Quibdó)
- **Marcadores de incidencia** — círculo SVG coloreado por estado; `atendiendo` tiene anillo `animate-ping`
- **Marcadores de agente** — pin coloreado por rol
- Filtros de estado en barra superior (chips toggle)
- **Panel de detalle** — Sheet deslizante desde la derecha al seleccionar un marcador
- Z-index corregido para aparecer sobre los controles de Leaflet (z-1001 / z-1002)

### 3. Gestión de Incidencias `/incidencias`
Tabla completa con filtros combinables.

- Filtros: estado, severidad, zona, rango de fechas
- Columnas: ID · Título · Categoría · Estado · Severidad · Zona · Fecha
- Ordenación por columna, paginación
- Vista de detalle `/incidencias/[id]`:
  - Stepper de 5 pasos mostrando la máquina de estados
  - Metadata completa (categoría, zona, dirección, coordenadas)
  - **Línea de tiempo inmutable** — lista append-only de `TimelineEvent`

### 4. Gestión de Usuarios `/usuarios`
CRUD completo en memoria.

- Tabla con `RoleBadge`, toggle de estado activo/suspendido
- Filtro por rol y estado
- **Dialog de creación/edición** — nombre, email, rol, zona, estado
- Mutaciones en Zustand store → invalidación de cache TanStack Query → UI reactiva sin recarga

### 5. Analítica `/analitica`
Página de scroll único con 9 secciones. Sin tabs.

1. **Header** — toggle de rango 7D / 14D / 30D
2. **KPI cards con sparklines** — MetricCard + mini AreaChart embebido + flecha de tendencia
3. **Serie temporal multi-línea** — nuevas / cerradas / críticas (AreaChart apilado)
4. **Categoría + Severidad** — PieChart donut con leyenda inline · RadialBarChart con barras de progreso
5. **Ranking por zona** — barras de progreso con gradiente y porcentaje
6. **Horas pico + Tiempo de respuesta** — BarChart 0–23h con colores por intensidad · ComposedChart actual vs anterior
7. **Heatmap 7×24** — grid CSS con codificación tri-color (azul/naranja/rojo) y leyenda
8. **Distribución de estados + Funnel** — barras de porcentaje · visualización de embudo reportadas→cerradas
9. **Tendencia semanal por categoría** — LineChart multi-serie (Robo, Agresión, Hurto, Otro)

### 6. Historial de Auditoría `/auditoria`
Registro de solo lectura, inmutable.

- 50 entradas mock ordenadas descendente por timestamp
- Búsqueda por actor, recurso o tipo de acción
- Columnas: Timestamp · Actor (nombre + rol) · Acción · Recurso · IP
- Sin controles de mutación — icono de candado en header

---

## Arquitectura de datos

```
mocks/*.mock.ts          ← Fuente de datos estáticos (30 incidencias, 15 usuarios, 10 agentes, 50 auditorías)
        ↓
store/*.store.ts         ← Zustand: estado mutable en memoria, funciones de mutación
        ↓
hooks/use*.ts            ← TanStack Query: queryFn lee el store, staleTime 30s
        ↓
components/**            ← Consumen los hooks, renders reactivos
```

**Patrón de mutación:**
```typescript
// 1. Mutación en el store
useIncidentsStore.getState().updateStatus(id, 'cerrada')

// 2. Invalidar cache → re-fetch desde store actualizado
queryClient.invalidateQueries({ queryKey: ['incidents'] })

// 3. UI actualiza sin recarga de página
```

Cuando exista el backend Laravel, solo cambia `queryFn` — el resto de la arquitectura permanece igual.

---

## Máquina de estados — Incidencias

```
nueva ──→ aceptada ──→ en_camino ──→ atendiendo ──→ cerrada
  └──────────────────────────────────────────────→ cancelada
```

| Estado | Color |
|---|---|
| `nueva` | Gris |
| `aceptada` | Azul |
| `en_camino` | Amarillo |
| `atendiendo` | Naranja (+ ping animado en mapa) |
| `cerrada` | Verde |
| `cancelada` | Rojo |

Cada transición genera un `TimelineEvent` en la línea de tiempo de la incidencia. El historial es **append-only** — nunca se modifica ni elimina.

---

## Tokens de diseño

Definidos en `src/app/globals.css` como variables CSS, expuestos en Tailwind vía `@theme inline`. Modo oscuro permanente (clase `dark` en `<html>`).

```css
/* Estados */
--status-nueva:      oklch(0.55 0 0)      /* gris    */
--status-aceptada:   oklch(0.60 0.18 250) /* azul    */
--status-en-camino:  oklch(0.75 0.18 85)  /* amarillo*/
--status-atendiendo: oklch(0.70 0.18 45)  /* naranja */
--status-cerrada:    oklch(0.65 0.18 145) /* verde   */
--status-cancelada:  oklch(0.55 0.22 25)  /* rojo    */

/* Severidad (1=baja → 5=extrema) */
--severity-1: oklch(0.65 0.18 145)  /* verde   */
--severity-2: oklch(0.75 0.18 85)   /* amarillo*/
--severity-3: oklch(0.70 0.18 45)   /* naranja */
--severity-4: oklch(0.55 0.22 25)   /* rojo    */
--severity-5: oklch(0.45 0.22 10)   /* carmesí */

/* Roles */
--role-admin:   oklch(0.60 0.20 290) /* púrpura */
--role-lider:   oklch(0.60 0.18 250) /* azul    */
--role-partner: oklch(0.55 0 0)      /* neutro  */
```

---

## Zonas geográficas — Quibdó

| Zona | Lat | Lng |
|---|---|---|
| Centro | 5.6942 | -76.6601 |
| Cristo Rey | 5.6870 | -76.6520 |
| Huapango | 5.7010 | -76.6480 |
| San Vicente | 5.6880 | -76.6700 |
| Kennedy | 5.6960 | -76.6640 |
| La Yesca | 5.6830 | -76.6560 |
| Chambacú | 5.7050 | -76.6550 |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── globals.css              # Tokens de diseño (status, severity, role, surface)
│   ├── layout.tsx               # <html lang="es" class="dark">
│   ├── providers.tsx            # QueryClientProvider + Sonner
│   └── (admin)/
│       ├── layout.tsx           # AdminShell: Sidebar + TopBar + outlet
│       ├── dashboard/page.tsx
│       ├── mapa/page.tsx
│       ├── incidencias/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx
│       ├── usuarios/page.tsx
│       ├── analitica/page.tsx
│       └── auditoria/page.tsx
│
├── components/
│   ├── layout/                  # AdminShell · Sidebar · TopBar
│   ├── shared/                  # KpiCard · StatusBadge · SeverityDot · PageHeader · EmptyState
│   ├── dashboard/               # CriticalAlertsList · IncidentsTrendChart · IncidentsByStatusChart
│   ├── map/                     # RealtimeMap · IncidentDetailPanel · MapFiltersBar
│   ├── incidencias/             # IncidentTable · IncidentFilters · IncidentStatusFlow · IncidentTimeline
│   ├── usuarios/                # UserFormDialog · RoleBadge
│   └── ui/                      # shadcn/ui — nunca editados a mano
│
├── types/                       # incident · user · agent · audit
├── mocks/                       # incidents (30) · users (15) · agents (10) · audit (50)
├── hooks/                       # useIncidents · useUsers · useAgents · useAuditLog
├── store/                       # ui.store · incidents.store · users.store
└── lib/
    ├── constants.ts             # STATUS_CONFIG · SEVERITY_CONFIG · ZONE_LIST · QUIBDO_CENTER
    ├── date.ts                  # formatDate · formatDateTime (locale es-CO)
    └── utils.ts                 # cn() = clsx + tailwind-merge
```

---

## Instalación y desarrollo

**Requisitos:** Node.js 20+, npm 10+

```bash
# Clonar
git clone git@github.com:Bello2005/NASS.git
cd NASS/nass-admin

# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — redirige automáticamente a `/dashboard`.

```bash
# Build de producción
npm run build

# Verificar tipos
npx tsc --noEmit
```

---

## Notas técnicas importantes

**Leaflet y SSR**
Leaflet accede a `window` en tiempo de importación. El componente `RealtimeMap` se carga exclusivamente en cliente:
```typescript
const RealtimeMap = dynamic(
  () => import("@/components/map/RealtimeMap").then(m => ({ default: m.RealtimeMap })),
  { ssr: false }
)
```

**Tailwind v4**
Configuración CSS-first. Los colores personalizados se definen en `globals.css` vía `@theme inline`, no en `tailwind.config.ts`.

**@base-ui/react**
Este proyecto usa Base UI en lugar de Radix UI como capa primitiva de shadcn. No existe la prop `asChild` — los triggers reciben `className` directamente.

**Z-index y Leaflet**
Los controles de Leaflet alcanzan z-index 1000. El Sheet de detalle usa `z-[1001]` (overlay) y `z-[1002]` (panel) para aparecer encima del mapa.

---

## Roadmap

- [ ] Integración con API Laravel (reemplazar `queryFn` mock → fetch real)
- [ ] Autenticación con roles (admin / líder / partner)
- [ ] WebSocket para actualizaciones en tiempo real
- [ ] Exportación de incidencias a SIEDCO
- [ ] Notificaciones push por incidencias críticas
- [ ] PWA para uso offline parcial

---

## Contexto del proyecto

NASS es una plataforma de seguridad ciudadana desarrollada para Quibdó, capital del departamento de Chocó, Colombia (~120.000 habitantes). Este panel web es usado por administradores de sede central para:

- Monitorear emergencias entrantes en tiempo real
- Coordinar la asignación de agentes de campo
- Analizar patrones de incidencia por zona, hora y categoría
- Mantener un registro de auditoría inmutable de todas las acciones del sistema

---

*Construido con Next.js 15 · Tailwind CSS v4 · Recharts · React-Leaflet*
