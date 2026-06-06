# Reporte de Estado del Frontend

Proyecto: **Pokemon TCG Arena - Angular**  
Ruta: `/Users/franciscorodriguezpons/Documents/New project/pokemon-pocket-angular`  
Fecha: 2026-05-30

## 1. Resumen Ejecutivo

El frontend es una aplicacion Angular moderna inspirada en Pokemon TCG Pocket. Actualmente cuenta con flujo de autenticacion, lobby, selector/constructor de mazos, arena de combate, cartas con efecto foil, mano en arco, efectos visuales avanzados, audio, fondo 3D y una capa de integracion preparada para backend Java Spring Boot multi-servicio.

La aplicacion compila correctamente y los tests base pasan. El servidor local esta configurado para ejecutarse en `http://127.0.0.1:4200/`.

## 2. Estado Actual

Estado general: **funcional en frontend, con integracion backend preparada**.

Implementado:

- Aplicacion Angular standalone con rutas lazy-loaded.
- Pantalla de login/registro.
- Lobby protegido por autenticacion.
- Selector de mazos.
- Constructor de mazos con catalogo, filtros y contador.
- Arena de combate.
- Mano de cartas en arco con drag & drop CDK.
- Carta visual premium con tilt 3D y foil.
- Capa global FX con canvas, GSAP y Lottie.
- Fondo dinamico 3D con Three.js.
- Audio con Howler.js.
- Notificaciones con ngx-toastr.
- WebSocket STOMP/SockJS para eventos realtime.
- Interceptor JWT.
- Guard de autenticacion.
- Servicios REST para auth, decks, cards y games.
- Fallback local para demo de cartas/juego si el backend no esta disponible.

Pendiente o dependiente del backend:

- Validar flujo completo con backend real levantado.
- Confirmar nombres exactos de eventos realtime y payloads.
- Reemplazar animaciones Lottie placeholder por animaciones finales.
- Agregar sonidos reales `.mp3` en `public/assets/sounds/`.
- Completar historial real de partidas si el backend expone endpoint.
- Ajustar constructor de mazos a reglas finales del backend.

## 3. Tecnologias Principales

Framework:

- Angular 21
- TypeScript 5.9
- Angular standalone components
- Angular Signals
- Angular Router
- Angular Forms / Reactive Forms

UI y estilos:

- SCSS
- Tailwind CSS 3.4
- PostCSS
- Glassmorphism custom
- CSS responsive
- CSS Houdini fallback para foil
- CDK DragDrop

Animacion y efectos:

- GSAP
- Lottie Web
- ngx-lottie
- Canvas 2D particles
- Three.js

Audio:

- Howler.js

Notificaciones:

- ngx-toastr

Networking:

- Angular HttpClient
- JWT interceptor
- STOMP WebSocket
- SockJS
- RxJS

Testing/build:

- Angular CLI
- Vitest
- jsdom

## 4. Arquitectura de Carpetas

Estructura principal:

```text
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── models/
│   │   └── services/
│   ├── features/
│   │   ├── arena/
│   │   ├── auth/
│   │   ├── card/
│   │   ├── fx-layer/
│   │   ├── game-over/
│   │   ├── hand/
│   │   ├── health-bar/
│   │   └── lobby/
│   ├── shared/
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── app.ts
├── environments/
└── styles.scss
```

Assets:

```text
public/
├── assets/
│   ├── animations/
│   ├── lottie/
│   └── sounds/       # pendiente de archivos reales
├── favicon.ico
└── foil-worklet.js
```

## 5. Rutas de la Aplicacion

Archivo: `src/app/app.routes.ts`

- `/auth`: login / registro.
- `/lobby`: lobby principal. Protegido por `authGuard`.
- `/arena`: pantalla de combate. Protegida por `authGuard`.
- `/`: redirecciona a `/lobby`.
- `**`: redirecciona a `/lobby`.

Las rutas estan cargadas con `loadComponent`, por lo que el bundle inicial queda mas liviano.

## 6. Modulos Funcionales

### 6.1 Autenticacion

Archivos:

- `src/app/features/auth/auth.component.ts`
- `src/app/core/services/auth.service.ts`
- `src/app/core/models/auth.model.ts`
- `src/app/core/guards/auth.guard.ts`
- `src/app/core/interceptors/auth.interceptor.ts`

Funcionalidad:

- Login.
- Registro.
- Persistencia de JWT en `localStorage`.
- Persistencia de `playerId` y username.
- Logout.
- Guard para proteger rutas privadas.
- Interceptor que agrega `Authorization: Bearer <token>` a requests backend.

Endpoints esperados:

- `POST /api/auth/login`
- `POST /api/auth/register`

### 6.2 Lobby

Archivos:

- `src/app/features/lobby/lobby.component.*`
- `src/app/features/lobby/components/sidebar/*`
- `src/app/features/lobby/components/deck-selector/*`
- `src/app/features/lobby/components/deck-builder/*`
- `src/app/features/lobby/components/match-history/*`

Funcionalidad:

- Sidebar premium.
- Selector de mazos.
- Constructor de mazos.
- Carga de catalogo XY1.
- Creacion de partida.
- Union a partida por `gameId`.
- Modal de historial placeholder.

### 6.3 Arena

Archivos:

- `src/app/features/arena/arena.component.*`
- `src/app/features/arena/background-3d.component.ts`
- `src/app/features/arena/components/energy-generator/*`
- `src/app/features/arena/components/energy-indicator/*`
- `src/app/features/hand/*`
- `src/app/features/health-bar/*`
- `src/app/features/game-over/*`

Funcionalidad:

- Zona del jugador.
- Zona del rival.
- Banca.
- Pokemon activo.
- Barra de vida.
- Mano en arco.
- Drag & drop de cartas.
- Energia visual.
- Controles de combate.
- Pantalla de fin de partida.
- Modo demo local si no hay backend.
- Modo real si existe partida cargada desde backend.

### 6.4 Cartas

Archivos:

- `src/app/features/card/card.component.*`
- `src/app/shared/directives/tilt.directive.ts`
- `public/foil-worklet.js`

Funcionalidad:

- Render visual de carta.
- Tilt 3D con mouse.
- Foil holografico.
- Imagen lazy-loaded.
- IDs estables para FX:
  - `card-${card.id}`
  - `card-img-${card.id}`

## 7. Servicios Core

Servicios principales:

- `AuthService`: login, registro, token, playerId.
- `DeckService`: CRUD de mazos.
- `CardApiService`: consumo de `card-service`.
- `CardCatalogService`: capa de catalogo sobre `CardApiService`.
- `GameApiService`: consumo de `game-service`.
- `WebSocketService`: conexion STOMP/SockJS.
- `RealGameService`: estado reactivo de partida real.
- `GameService`: modo demo/local.
- `FxService`: bus de eventos visuales.
- `AudioService`: reproduccion de sonidos.
- `PokemonTcgApiService`: fallback externo/local para demo.
- `HandLayoutService`: calculo de disposicion en arco.

## 8. Integracion Backend

Configuracion:

Archivo: `src/environments/environment.ts`

```ts
export const environment = {
  production: false,
  gameServiceUrl: 'http://localhost:8081',
  cardServiceUrl: 'http://localhost:8083',
  realtimeServiceUrl: 'http://localhost:8082',
  wsUrl: 'http://localhost:8082/ws',
  pokemonTcgApiKey: ''
};
```

Servicios esperados:

- `game-service`: `http://localhost:8081`
- `realtime-service`: `http://localhost:8082`
- `card-service`: `http://localhost:8083`

Endpoints principales integrados:

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Cards:
  - `GET /api/cards?q=set.id:xy1&pageSize=100`
  - `GET /api/cards/{id}`
- Decks:
  - `GET /api/decks`
  - `POST /api/decks`
  - `GET /api/decks/{deckId}`
  - `PUT /api/decks/{deckId}`
  - `DELETE /api/decks/{deckId}`
- Games:
  - `POST /api/games`
  - `POST /api/games/{gameId}/join`
  - `GET /api/games/{gameId}`
  - `GET /api/games/{gameId}/sync`
  - `GET /api/games/{gameId}/players/{playerId}/hand`
  - `POST /api/games/{gameId}/setup/place-active`
  - `POST /api/games/{gameId}/setup/place-bench`
  - `POST /api/games/{gameId}/setup/confirm`
  - `POST /api/games/{gameId}/actions`

Realtime:

- WebSocket/SockJS: `http://localhost:8082/ws`
- Topic: `/topic/games/{gameId}/events`

## 9. Capa Visual FX

Archivos:

- `src/app/core/services/fx.service.ts`
- `src/app/features/fx-layer/fx-layer.component.*`

Eventos soportados:

- `damage`
- `heal`
- `draw`
- `attack_start`
- `attack_impact`
- `energy_attach`
- `evolve`
- `retreat`
- `ko`
- `shake`
- `flash`
- `card_fly`
- `status_effect`

Efectos incluidos:

- Numeros flotantes.
- Particulas canvas.
- Flash de pantalla.
- Shake de elementos.
- Pulse de atacante.
- Glow de energia.
- Carta volando.
- Impactos elementales con Lottie.
- KO con explosion y overlay oscuro.
- Particulas de estado.

Nota: las animaciones Lottie actuales son placeholders ubicados en `public/assets/lottie/`. Se pueden reemplazar por animaciones finales sin tocar codigo.

## 10. Audio

Archivo:

- `src/app/core/services/audio.service.ts`

Sonidos esperados:

```text
public/assets/sounds/draw.mp3
public/assets/sounds/attack.mp3
public/assets/sounds/damage.mp3
public/assets/sounds/heal.mp3
public/assets/sounds/ko.mp3
public/assets/sounds/win.mp3
public/assets/sounds/lose.mp3
```

Si los archivos no existen, la app no se rompe, pero el navegador puede registrar errores 404 al intentar reproducirlos.

## 11. Estilos y UX

Sistema visual:

- Inspiracion Pokemon TCG Pocket.
- Glassmorphism.
- Fondos radiales.
- Cartas holograficas.
- Botones con brillo.
- Lobby con sidebar flotante.
- Auth con fondo Lottie.
- Arena con Three.js.
- Layout responsive.
- Overlay landscape para mobile vertical.

Tailwind:

- Configurado en `tailwind.config.js`.
- Version usada: `3.4.17`.
- Motivo: Tailwind 4 genero conflicto con el builder actual de Angular; se dejo Tailwind 3.4 por estabilidad.

## 12. Comandos

Instalacion:

```bash
npm install
```

Desarrollo:

```bash
npm start
```

Build:

```bash
npm run build
```

Tests:

```bash
npm test -- --watch=false
```

URL local:

```text
http://127.0.0.1:4200/
```

## 13. Verificacion Actual

Ultimas verificaciones realizadas:

```bash
npm run build
npm test -- --watch=false
```

Resultado:

- Build: correcto.
- Tests: correctos.

Warnings conocidos:

- Sass `@import` de `ngx-toastr/toastr` esta deprecado por Dart Sass, pero no bloquea.
- Algunas librerias se reportan como CommonJS:
  - `howler`
  - `@stomp/stompjs`
  - `sockjs-client`
  - `lottie-web`
- El bundle inicial puede acercarse al presupuesto por las librerias visuales, aunque se usa lazy loading en rutas y Lottie se carga de forma diferida para FX.

## 14. Riesgos y Consideraciones

Riesgos tecnicos:

- La integracion final depende de que el backend respete los contratos de endpoints y payloads.
- WebSocket requiere validar headers y formato real de eventos.
- Las acciones de juego reales pueden necesitar adaptar payloads segun reglas del backend.
- `lottie-web` y `howler` son dependencias pesadas/CommonJS.
- Faltan assets finales de audio y Lottie.

Consideraciones de UX:

- La aplicacion tiene modo demo para no quedar vacia sin backend.
- El flujo real debe probarse con dos usuarios y dos navegadores.
- El constructor de mazos debe ajustarse si el backend valida reglas estrictas de 60 cartas, cantidad maxima por carta, energia, etc.

## 15. Pendientes Recomendados

Prioridad alta:

1. Levantar backend y probar flujo real completo.
2. Confirmar contratos de eventos realtime.
3. Ajustar payloads de `sendAction`.
4. Agregar sonidos reales.
5. Reemplazar Lotties placeholder.

Prioridad media:

1. Crear toasts centralizados para errores de backend.
2. Agregar skeleton loaders en catalogo y mazos.
3. Agregar pantalla de loading global.
4. Crear historial real si backend expone endpoint.
5. Mejorar validacion del constructor de mazos.

Prioridad baja:

1. Optimizar bundle y presupuestos Angular.
2. Migrar import Sass de toastr si el paquete ofrece entrypoint compatible.
3. Agregar pruebas unitarias por servicio.
4. Agregar pruebas e2e de login/lobby/arena.

## 16. Conclusion

El frontend se encuentra en un estado avanzado de desarrollo visual y arquitectonico. Ya tiene una base profesional con rutas, autenticacion, lobby, arena, servicios backend, WebSocket, FX, audio y estilos premium. La siguiente fase deberia enfocarse en validar el flujo completo contra el backend Spring Boot real y reemplazar assets temporales por material definitivo.

