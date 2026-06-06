# Pokemon TCG Arena - Angular

Juego de cartas estilo Pokemon TCG Pocket con mano en arco, cartas holograficas, efectos de combate, audio, fondo 3D y batallas por turnos.

## Tecnologias

- Angular 21 + TypeScript
- Signals y componentes standalone
- GSAP para numeros flotantes
- Three.js para fondo dinamico
- Howler.js para audio
- Pokemon TCG API con fallback local

## Instalacion

```bash
npm install
npm start
```

Abrir:

```text
http://127.0.0.1:4200/
```

## API Key

La app funciona sin API key usando fallback local si la API falla. Para mayor limite de uso, crea o edita:

```ts
// src/environments/environment.ts
export const environment = {
  pokemonTcgApiKey: 'TU_API_KEY'
};
```

Puedes obtener una key gratis en Pokemon TCG Developers.

## Backend Spring Boot

La app tambien puede conectarse a la plataforma Java Spring Boot multi-servicio:

```text
game-service:     http://localhost:8081
realtime-service: http://localhost:8082
card-service:     http://localhost:8083
swagger:          http://localhost:8081/swagger-ui/index.html
```

Configurar URLs en:

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  gameServiceUrl: 'http://localhost:8081',
  cardServiceUrl: 'http://localhost:8083',
  realtimeServiceUrl: 'http://localhost:8082',
  wsUrl: 'http://localhost:8082/ws',
  pokemonTcgApiKey: ''
};
```

La UI incluye un panel de backend arriba a la derecha para:

- Login / registro contra `/api/auth`.
- Cargar mazos desde `/api/decks`.
- Crear partida con `POST /api/games`.
- Unirse/cargar partida existente.
- Sincronizar por WebSocket STOMP en `/topic/games/{gameId}/events`.

El interceptor HTTP agrega `Authorization: Bearer <token>` en requests REST al backend, excepto auth.

## Flujo de prueba backend

1. Levantar PostgreSQL, Redis y los tres servicios Java.
2. Verificar Swagger en `http://localhost:8081/swagger-ui/index.html`.
3. En la app Angular, hacer login o registro desde el panel.
4. Cargar mazos y seleccionar uno.
5. Crear partida o unirse con `gameId`.
6. Usar la mano para setup/acciones y los botones de arena para robar, atacar, confirmar setup o terminar turno.
7. Abrir dos navegadores con usuarios distintos para verificar eventos en tiempo real.

## Audio

Howler ya esta integrado. Para activar sonidos reales, coloca estos archivos en `public/assets/sounds/`:

```text
draw.mp3
attack.mp3
damage.mp3
heal.mp3
ko.mp3
win.mp3
lose.mp3
```

Si faltan archivos, el juego sigue funcionando sin bloquear la experiencia.

## Build

```bash
npm run build
```

## Deploy

### Vercel

```bash
npm run build
```

Configurar:

```text
Build Command: npm run build
Output Directory: dist/pokemon-pocket-angular/browser
```

### Netlify

Configurar:

```text
Build command: npm run build
Publish directory: dist/pokemon-pocket-angular/browser
```
