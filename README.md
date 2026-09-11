# NASS Ciudadano

**Sistema de Atención y Seguridad Ciudadana** — plataforma de respuesta a emergencias para Quibdó, Chocó.

> La ciudadanía reporta. La tecnología conecta. El territorio responde.

Aplicación funcional con backend, autenticación, tiempo real, mapas y despacho. El flujo completo
**ciudadano → pánico → C4 → despacho → GPS → chat → atención → cierre → KPI** funciona de punta a punta.

---

## Arranque rápido

```bash
npm install
cp .env.example .env.local   # y rellena NEXT_PUBLIC_CARTO_API_KEY
npm run dev                  # http://localhost:3000
```

### Clave del mapa

Los basemaps de CARTO **requieren clave**: sin ella las teselas se sirven con la marca de agua
`API KEY REQUIRED`. Consíguela en [carto.com](https://carto.com/) y ponla en `.env.local`:

```
NEXT_PUBLIC_CARTO_API_KEY=tu_clave
```

> **Define la clave antes de compilar.** Las variables `NEXT_PUBLIC_*` se incrustan en el paquete
> durante `npm run build`; si la añades después, el mapa seguirá saliendo con marca de agua hasta
> que vuelvas a compilar. Si tras recompilar aún la ves, fuerza un refresco del navegador: tanto el
> navegador como la CDN de CARTO cachean teselas.

La clave viaja al navegador, como toda clave de mapa del lado del cliente. No se protege
ocultándola sino **restringiéndola por dominio** desde el panel de CARTO.

Toda la configuración de teselas vive en `src/lib/mapTiles.ts`. Cambiar de proveedor
(MapTiler, Mapbox, teselas propias) es reescribir ese archivo: los cuatro mapas lo consumen.

Para la demostración conviene el modo producción (más rápido y estable):

```bash
npm run build && npm start
```

**Desde el celular:** conecta el teléfono a la misma red Wi-Fi del portátil y abre
`http://<IP-del-portátil>:3000`. La IP aparece en la consola al arrancar (línea `Network`).

> La geolocalización del navegador exige HTTPS salvo en `localhost`. Para usar el GPS real del
> celular en una red local, expón el puerto con un túnel HTTPS (`ngrok http 3000` o similar).
> Sin eso, el botón de pánico igual funciona: usa la última ubicación conocida o la del simulador.

---

## Cuentas de demostración

Contraseña para todas: **`nass2026`**

| Rol | Correo | Entra a |
|---|---|---|
| Ciudadano | `ciudadano@demo.nass.co` | `/ciudadano` — botón de pánico |
| Operador C4 | `operador@nass.gov.co` | `/dashboard` — centro de despacho |
| Supervisor | `supervisor@nass.gov.co` | `/dashboard` |
| Super Admin | `admin@nass.gov.co` | `/dashboard` + auditoría y simulador |
| Unidad | `pol-031@nass.gov.co` … `seg-022@nass.gov.co` | `/unidad` — panel en calle |

La pantalla de acceso tiene botones de entrada directa para los cuatro perfiles principales.

---

## Guion de demostración (5 minutos)

1. **Celular** — entra como ciudadano. Autoriza la ubicación. Pulsa **SOS**, confirma, cuenta regresiva.
2. **Portátil** — el centro de despacho suena, muestra la alerta y la pinta en el mapa.
   *(Toca la pantalla del portátil una vez antes de empezar: el navegador exige un gesto para permitir audio.)*
3. **Operador** — abre el incidente desde la cola, pulsa **Tomar caso**.
4. **Operador** — despacha la unidad marcada como **Protocolo** (la institución que corresponde al tipo).
5. **Mapa** — la unidad acepta a los 6 segundos y empieza a moverse en tiempo real hacia el lugar.
6. **Chat** — escribe desde el celular; el mensaje aparece en el panel del operador y al revés.
7. **Llegada** — al llegar, el incidente pasa solo a **EN EL SITIO**.
8. **Cierre** — el operador marca **En atención → Resuelta → Cerrar incidente**.
9. **Analítica** — el KPI de tiempo de respuesta y el mapa de calor ya incluyen el caso.
10. **Auditoría** — cada paso quedó registrado con actor, hora, estado anterior y nuevo.

**Sin celular a mano:** el panel **Simulador** (solo super admin) genera incidentes en cualquier punto
del mapa con el tipo y la prioridad que elijas. Es el plan B si falla la red o el GPS.

---

## Las cuatro aplicaciones

### 1. App ciudadana — `/ciudadano`
Diseñada para actuar en segundos, no para explorar menús.

- Botón de pánico con doble confirmación y cuenta regresiva cancelable de 5 s
- Captura de GPS con precisión y compartición periódica mientras la emergencia está activa
- Estado de la atención paso a paso y datos de la unidad asignada
- Chat con el centro de atención e interfaz de llamada (ver *VOIP* más abajo)
- Reporte de incidentes no urgentes con 13 categorías
- Historial de alertas propias

### 2. Centro de despacho C4 — `/dashboard`, `/mapa`, `/incidencias`
- Cola de atención ordenada por prioridad y antigüedad
- Mapa Leaflet con incidentes, unidades por institución y línea de despacho
- Alerta sonora sintetizada y notificación al entrar una emergencia
- Panel de despacho: unidades candidatas ordenadas por **protocolo + cercanía**, con distancia real
- Control completo de la máquina de estados, chat y trazabilidad por incidente
- Barra de flota: disponibilidad por institución en todo momento

### 3. Panel de unidad — `/unidad`
- Disponibilidad, compartición del GPS del dispositivo
- Recepción del despacho, aceptación, navegación al lugar
- Reporte de llegada, inicio de atención y finalización del servicio
- Chat con el centro de despacho

### 4. Administración — `/usuarios`, `/analitica`, `/auditoria`, `/simulador`
- Gestión de usuarios con los 5 roles del sistema
- Analítica: 10 KPIs, serie diaria, horas pico, mapa de calor geográfico y semanal, zonas, categorías
- Auditoría inmutable con actor, acción, recurso, metadatos e IP
- Simulador de emergencias para demostraciones

---

## Arquitectura

```
Navegador (ciudadano · unidad · C4)
        │  fetch /api/*            ← REST
        │  EventSource /api/events ← tiempo real (SSE)
        ▼
Next.js App Router  ·  route handlers en runtime Node
        ▼
src/server/
  db.ts          Almacén y operaciones de dominio  ← ÚNICA frontera con la persistencia
  auth.ts        scrypt + sesión firmada (HMAC) en cookie httpOnly
  bus.ts         Bus de eventos que alimenta el canal SSE
  geo.ts         Haversine, rumbo, desplazamiento, zona más cercana
  analytics.ts   KPIs, series y agregación del mapa de calor
  simulator.ts   GPS de unidades sin hardware real
  seed.ts        Datos de demostración deterministas
```

**Decisiones tomadas y por qué:**

- **SSE en lugar de WebSockets.** El contrato de eventos es el del documento técnico
  (`incident.created`, `unit.location.updated`, `message.created`…). SSE atraviesa proxies sin
  configuración, reconecta solo y no añade dependencias. Migrar a Socket.IO no cambia el frontend.
- **Almacén en memoria en lugar de PostgreSQL.** Toda la persistencia está detrás de `src/server/db.ts`.
  El modelo de datos ya es relacional (usuarios, unidades, incidentes, historial de estados,
  mensajes, auditoría, con identificadores propios y relaciones explícitas). Cambiar a PostgreSQL es
  reimplementar ese módulo; las rutas y el frontend quedan igual.
  **Los datos se reinician al reiniciar el servidor** — es lo correcto para demostrar, no para producción.
- **Sin dependencias de autenticación externas.** scrypt y HMAC vienen en Node. Menos superficie, menos
  cosas que fallen en una demostración.

---

## API

Todas las rutas bajo `/api`. La sesión viaja en cookie `httpOnly`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Registro público (solo crea ciudadanos) |
| POST | `/auth/login` | Inicio de sesión |
| POST | `/auth/logout` | Cierre de sesión |
| GET | `/auth/me` | Sesión actual y unidad asociada |
| GET | `/incidents` | Lista filtrada por rol (ver *Privacidad*) |
| POST | `/incidents` | Crea alerta o reporte |
| GET | `/incidents/:id` | Detalle, unidad, mensajes y unidades candidatas |
| PATCH | `/incidents/:id/status` | Cambio de estado validado contra la máquina de estados |
| POST | `/incidents/:id/dispatch` | Despacha una unidad |
| GET/POST | `/incidents/:id/messages` | Chat del incidente |
| POST | `/incidents/:id/location` | Ubicación del ciudadano durante la emergencia |
| GET | `/units` | Flota con posición y disponibilidad |
| POST | `/units/location` | Ping de GPS de una unidad |
| PATCH | `/units/:id/status` | Disponibilidad de la unidad |
| POST | `/units/:id/accept` | La unidad acepta el servicio |
| GET | `/analytics/summary` | KPIs y series (`?days=`) |
| GET | `/analytics/heatmap` | Celdas del mapa de calor |
| GET | `/audit` | Auditoría (super admin y supervisor) |
| GET/POST | `/users` | Usuarios del sistema |
| GET | `/events` | Canal de eventos en tiempo real (SSE) |

---

## Máquina de estados

```
nueva → recibida → en_validación → asignada → en_camino → en_sitio → atendiendo → resuelta → cerrada
   └──────────────────────────────── cancelada ────────────────────────────────┘
```

Las transiciones se validan en el servidor. Cada cambio genera un evento inmutable en la línea de
tiempo del incidente y una entrada de auditoría con actor, hora, estado anterior y nuevo.

---

## Seguridad y privacidad

- Contraseñas con **scrypt** y sal por usuario. Nunca en texto plano, nunca en el repositorio.
- Sesión firmada con **HMAC-SHA256** en cookie `httpOnly`, `sameSite=lax`, `secure` en producción.
- **RBAC** en cada ruta: el centro de despacho está cerrado en el servidor, no solo en la interfaz.
- **Control de acceso por incidente:** el ciudadano solo ve los suyos, la unidad solo el que tiene
  asignado, el C4 ve el territorio.
- Validación y límites de tamaño en toda entrada; **rate limiting** en acceso, registro y creación de alertas.
- La ubicación del ciudadano solo se registra mientras la emergencia está activa; al cerrarla, el
  servidor rechaza nuevas posiciones.
- El mapa de calor agrega en celdas de ~165 m: nunca expone la posición exacta de una persona.

Configura `NASS_AUTH_SECRET` antes de desplegar (ver `.env.example`).

---

## Puntos de integración pendientes

Están implementados como interfaz y arquitectura, con el punto de conexión marcado en el código.
No hay integraciones falsas presentadas como reales.

| Módulo | Estado | Dónde |
|---|---|---|
| **VOIP / WebRTC** | Interfaz y máquina de estados de llamada (CALLING → RINGING → CONNECTED → ENDED/FAILED). Falta señalización y STUN/TURN. **No transmite audio.** | `src/components/shared/VoiceCallButton.tsx` |
| **GPS real de unidades** | `POST /api/units/location` acepta posiciones reales. El simulador mueve las unidades que no tienen equipo. | `src/server/simulator.ts` |
| **Base de datos** | Modelo relacional completo en memoria. | `src/server/db.ts` |
| **Evidencia multimedia** | Modelo con hash para cadena de custodia definido; falta almacenamiento y carga. | `src/types/incident.types.ts` |
| **Notificaciones push / SMS** | Alerta sonora y notificación en pantalla funcionando; falta el proveedor externo. | `src/lib/alertSound.ts` |

---

## Notas de operación

- **Audio:** el navegador bloquea el sonido hasta que hay un gesto del usuario. Un aviso lo recuerda;
  basta tocar la pantalla una vez al abrir el centro de despacho.
- **Mapas:** las teselas vienen de CARTO sobre OpenStreetMap. Requiere conexión a internet.
- **Velocidad de las unidades simuladas:** ajustable con `NASS_SIM_SPEED_KMH` (por defecto 55 km/h).
  Súbela para demostraciones más cortas.

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript estricto · Tailwind CSS v4 · shadcn/ui ·
TanStack Query · Zustand · Leaflet + OpenStreetMap/CARTO · Recharts · Sonner
