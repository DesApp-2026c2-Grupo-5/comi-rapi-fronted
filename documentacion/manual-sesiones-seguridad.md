# Manual — Sistema de Sesiones y Seguridad (Comi-Rapi)

> Documento de referencia para analizar el comportamiento actual del sistema de
> autenticación/seguridad en futuras sesiones de desarrollo. Puede usarse como
> contexto junto con `resumen-arquitectura-auth.md` (versión corta).

---

## 1. Arquitectura general

El backend implementa **sesiones server-side** con **cookie HttpOnly** + **CSRF
double-submit**. El cliente **nunca** recibe tokens JWT ni persiste la sesión en
`localStorage`; solo conserva una cookie de sesión sin acceso (HttpOnly) y una
cookie CSRF (de solo lectura).

```
┌─ Frontend (React/Vite) ─────────────────────────────┐
│ user = state React (AuthContext)                     │
│ ▪ GET /api/auth/me      → hidratar sesión al montar  │
│ ▪ cookie comirapi.sid   → HttpOnly (enviada sola)    │
│ ▪ cookie csrf-token     → no HttpOnly (leída por JS) │
└───────────┬──────────────────────────────────────────┘
            │ fetch con credentials:'include'
            │ + header x-csrf-token (en POST/PUT/PATCH/DELETE)
            ▼
┌─ Backend (Express/Node 14) ─────────────────────────┐
│ logger → helmet → cors → compression → json →       │
│ urlencoded → cookieParser → sessionMiddleware →      │
│ csrfProtection → routes → errorHandler               │
│   │ sessionMiddleware: express-session +             │
│   │   connect-pg-simple → tabla `session` (Postgres) │
│   │ csrfProtection: cookie csrf-token === header     │
│   │   x-csrf-token (en métodos que cambian estado)   │
└───────────┬──────────────────────────────────────────┘
            ▼
        PostgreSQL (BD dev/test)
```

---

## 2. Ciclo de vida de la sesión

### 2.1 Registro (`POST /api/auth/registro`)
1. `authLimiter` (rate limit).
2. `validarRegistro` normaliza/valida: `email` (trim+minúsculas), `password` (≥6),
   `nombre`, `apellido`, `telefono`, `fechaNacimiento` (`YYYY-MM-DD`, opcional), `rol`.
3. Errores de validación/duplicado ⇒ **400 genérico** `"No se pudo completar la operación"`
   (no se revela si el email existe).
4. `db.Usuario.create(datos)`: el hook `beforeSave` hashea la password con
   **Argon2id** (solo si `changed('password')`).
5. `crearSesion()`: `req.session.regenerate()` (**anti session-fixation**) y
   guarda `req.session.usuarioId = usuario.id`.
6. Responde **201** con `usuario.datosPublicos()` (sin `password`).

### 2.2 Login (`POST /api/auth/login`)
1. `authLimiter`.
2. Normaliza email y busca `Usuario` por email.
3. **Error único e idéntico** `401 "Credenciales inválidas"` si: email no existe,
   password no coincide, o usuario inactivo (evita enumeración de usuarios).
4. Igual que registro: `regenerate()` + `session.usuarioId`.
5. Responde **200** con datos públicos.

### 2.3 Hidratación de sesión (`GET /api/auth/me`)
- Pasa por `verificarSesion`:
  - Sin `req.session.usuarioId` ⇒ **401**.
  - Carga `Usuario.findByPk`. Si no existe o está inactivo: destruye la sesión ⇒ 401.
  - Adjunta `req.usuario = usuario.datosPublicos()`.
- El frontend llama a `/me` al montar para reconstruir `user` en `AuthContext`
  (`hydrated`). **No hay `localStorage`**.

### 2.4 Logout (`POST /api/auth/logout`)
- `req.session.destroy()` (borra la fila en `session`) + `res.clearCookie('comirapi.sid')`.
- El frontend: `logout()` async → `setUser(null)` + limpiar carrito (silencioso) + navegar.

---

## 3. Cookies

| Cookie | Nombre | HttpOnly | SameSite | Secure | Uso |
|---|---|---|---|---|---|
| Sesión | `comirapi.sid` | ✅ sí | `lax` (config) | prod sí / dev no | Identifica la sesión server-side. El navegador la envía sola a la API. |
| CSRF | `csrf-token` | ❌ no (a propósito) | `lax` | igual que sesión | Double-submit: el JS del front la lee y la manda como header. |

- `maxAge` de la sesión = `SESSION_TTL_MIN` (default **480 min = 8 h**); la CSRF
  usa el mismo TTL.
- `sameSite: lax` evita que terceros envíen la cookie desde otros orígenes
  (mitigación extra de CSRF aparte del token).
- `secure` se activa en `production` o si `COOKIE_SECURE=true`; en ese caso
  `app.set('trust proxy', 1)` (requiere HTTPS/proxy tipo Heroku).

---

## 4. Protección CSRF (doble envío)

**Backend — `lib/middlewares/csrf.js`:**
- `GET /api/auth/csrf-token`: genera `crypto.randomBytes(32).toString('hex')`,
  lo setea como cookie `csrf-token` (no HttpOnly) y lo devuelve en el body.
- `csrfProtection`: para `POST/PUT/PATCH/DELETE` exige
  `cookie csrf-token === header x-csrf-token`; si falta o difiere ⇒ **403**.
- Métodos seguros (`GET/HEAD/OPTIONS`) no se validan.

**Frontend — `src/api/client.js`:**
- Todas las peticiones con `credentials: 'include'`.
- Antes de cada `POST/PUT/PATCH/DELETE` lee la cookie `csrf-token`; si no está,
  llama a `/auth/csrf-token` y luego agrega `headers['x-csrf-token']`.
- Se implementó **manualmente** (sin librería `csrf-csrf`) por compatibilidad con
  Node 14. Desviación aceptada: el token no es *single-use*.

---

## 5. Almacenamiento en base de datos

Tabla `session` (migración `20260914180000-create-session-table.js`):

| Columna | Tipo | Notas |
|---|---|---|
| `sid` | VARCHAR | PK (id de sesión de cookies) |
| `sess` | JSON | JSON serializado (guarda `usuarioId` dentro del req.session) |
| `expire` | TIMESTAMP(6) | Expiración (índice `IDX_session_expire`) |

Creada vía migración para que `connect-pg-simple@8` nunca ejecute su bloque de
auto-creación bajo **Jest 26** (resolver Node 14 no acepta el prefijo `node:path`).
La opción `createTableIfMissing: true` queda como respaldo. El Pool de sesión usa
misma BD que el resto (`config.db`) — en test, `SQL_TEST_DATABASE`.

---

## 6. Contraseñas (Argon2id)

- Hook `beforeSave` del modelo `Usuario` (`lib/models/usuario.js`): hashea sólo si
  `changed('password')` → nunca re-hashea un hash existente.
- Verificación: `usuario.verificarPassword(password)` con `argon2.verify`.
- `toJSON()` **elimina** `password`; los controllers responden con `datosPublicos()`.
- Seeder: `123456` hasheado con `argon2.hash(pw, { timeCost: 2 })`. Unificar
  `timeCost` no es crítico: Argon2 embebe los parámetros en el hash.

---

## 7. Autorización y seguridad perimetral

- `verificarSesion` (401) → `permitirRoles(...roles)` (403). Flujo idéntico en
  `verificarSesion/routes`.
- Rutas protegidas:
  - **Todo** `/api/usuarios`: sólo `ADMINISTRADOR`.
  - Escrituras (`POST/PUT/DELETE`) de `/api/productos` y `/api/categorias`: `ADMINISTRADOR`.
  - `GET` / `GET/:id` de catálogo: público.
  - `/api/auth/me`: `verificarSesion`.
- **Rate limit** (`authLimiter`, `lib/middlewares/rate_limit.js`): 20 req/15 min
  sobre `/registro` y `/login`; 429 `"Demasiados intentos..."`. Se desactiva en
  test (`RATE_LIMIT_ENABLED=false`).
- **helmet** (headers de seguridad) + **cors** con `origin` único y
  `credentials: true` (necesario para cookies).
- Mensajes de error genéricos (no filtrar existencia de emails).

---

## 8. Roles: backend vs frontend

| Backend (DB/DER) | Frontend (convenio app) |
|---|---|
| `CLIENTE` | `CLIENTE` |
| `ADMINISTRADOR` | `ADMIN` (normalizado en `src/api/auth.js`) |

`normalizarRol()` traduce `ADMINISTRADOR→ADMIN`; `AppRoutes`, `Navbar` y
`ProtectedRoute` siguen comparando contra `ADMIN`.

---

## 9. Configuración por entorno (`.env.*`)

Variables nuevas (ver `.env.example`):

| Variable | Default | Uso |
|---|---|---|
| `SESSION_SECRET` | value en `.env.development` | Firma de la cookie de sesión. **En prod debe ser secreto fuerte.** |
| `SESSION_TTL_MIN` | `480` | Duración de la sesión y de la cookie CSRF (minutos). |
| `COOKIE_SECURE` | `false` (dev) / `true` (prod) | Cookie solo por HTTPS. |
| `COOKIE_SAME_SITE` | `lax` | Política SameSite. |
| `RATE_LIMIT_ENABLED` | `true` | Activa/desactiva `authLimiter`. |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen permitido (front). |

El `config.js` carga automáticamente `.env.${NODE_ENV}` desde
`process.cwd()` (correr npm scripts desde la raíz del backend).

---

## 10. Compatibilidad con Node 14 (importante)

- Backend en Node v14.21.3: dependencias elegidas a propósito
  (`connect-pg-simple@8`, `express-session@1.19`, `argon2@0.30.2`,
  `express-rate-limit@6.11`) y soporte de Jest 26 vía migración para la tabla
  `session`. **No subir** `connect-pg-simple` a v9 (rompe Node 14) sin plan.
- Frontend: Vite 5 exige Node ≥18. Para `dev`/`build` local usar Node v22 del nvm
  (p. ej. `"C:\...\nvm\v22.23.2\node.exe" node_modules/vite/bin/vite.js`).

---

## 11. Verificación

- Tests: `npm test` → **27/27** (suites: producto, usuario model, auth controller,
  usuario controller). Correr con `--runInBand` y `NODE_ENV=test`.
- Smoke test manual validado: `csrf-token` → `registro` con datos completos → `login`
  → `me` → 403 (cliente sobre `/api/usuarios`) → `logout` → 401.
- Lint backend: `npm run lint` (eslint + prettier) = 0 errores. Frontend: `npm run
  lint` tiene ~190 avisos **preexistentes** en el repo (fuera de alcance).

---

## 12. Checklist para futuros cambios (reglas que NO deben romperse)

1. Nunca responder `password`/hash; usar siempre `datosPublicos()`/`toJSON()`.
2. Mantener mensajes de error genéricos en login/registro.
3. No guardar sesión ni usuario en `localStorage`.
4. Conservar el orden de middlewares en `app.js` (sesión antes de CSRF → rutas).
5. La cookie `csrf-token` debe seguir siendo **no HttpOnly** (el front la lee).
6. En prod: `COOKIE_SECURE=true`, `SESSION_SECRET` fuerte, `RATE_LIMIT_ENABLED=true`,
   y `trust proxy` ya configurado.
7. Si se agrega autenticación a rutas nuevas: `verificarSesion` (+`permitirRoles`),
   nunca loguear credenciales, y documentar en este manual.