# Resumen — Qué hace cada cosa (Sistema de autenticación/seguridad)

Versión corta de `manual-sesiones-seguridad.md`. Mapa archivo → función.

---

## Backend (`comi-rapi-backend`)

### Middlewares
| Archivo | Qué hace |
|---|---|
| `lib/middlewares/session.js` | Sesión server-side: `express-session` + `connect-pg-simple` guardando en tabla `session` (Postgres). Cookie `comirapi.sid` **HttpOnly**, `maxAge` = `SESSION_TTL_MIN`. Exporta `closeSessionPool()` para tests. |
| `lib/middlewares/csrf.js` | Anti-CSRF **double-submit**: `setCsrfCookie` (cookie `csrf-token` no HttpOnly) y `csrfProtection` (en POST/PUT/PATCH/DELETE exige `cookie === header x-csrf-token`; si no, 403). |
| `lib/middlewares/auth.js` | `verificarSesion`: 401 si no hay sesión o el usuario no existe/está inactivo; carga `req.usuario.datosPublicos()`. `permitirRoles(...)`: 403 si el rol no matchea. |
| `lib/middlewares/rate_limit.js` | `authLimiter`: 20 intentos / 15 min en registro y login (429). Se desactiva en test. |
| `lib/middlewares/error_handler.js` | Manejo central de errores (existente). |

### Controladores / rutas
| Archivo | Qué hace |
|---|---|
| `lib/controllers/auth_controller.js` | `registro` (valida datos, hashea password vía hook, regenera sesión, 201 con datos públicos), `login` (401 genérico `Credenciales inválidas`, anti-fixation), `logout` (destroy + clearCookie), `me` (devuelve `req.usuario`). |
| `lib/routes/auth.js` | Endpoints: `GET /csrf-token`, `POST /registro`, `POST /login`, `POST /logout`, `GET /me` (con `verificarSesion`). |
| `lib/routes/usuarios.js` | CRUD de usuarios (solo `ADMINISTRADOR`). |
| `lib/routes/productos.js`, `categorias.js` | Lectura pública; `POST/PUT/DELETE` solo admin. |
| `lib/routes/index.js` | Monta `/api/auth` y el resto de routers. |

### Modelo / infra
| Archivo | Qué hace |
|---|---|
| `lib/models/usuario.js` | `beforeSave` hashea password con **Argon2** (solo si cambió); `verificarPassword()`; `datosPublicos()`; `toJSON()` **elimina** `password`. Campos: nombre*, apellido, email*, password*, telefono, fechaNacimiento, rol, activo. |
| `lib/config/config.js` | Carga `.env.${NODE_ENV}`; expone `db`, `port`, `session` (secret/ttl/secure/sameSite), `cors.origin`, `rateLimit.enabled`. |
| `lib/app.js` | Orden de middlewares: helmet → cors(credentials) → compression → json → urlencoded → cookieParser → **session** → **csrf** → routes → errorHandler. `trust proxy` si secure. |
| `db/migrations/20260914180000-create-session-table.js` | Crea tabla `session` (sid PK, sess JSON, expire + índice). Evita que `connect-pg-simple@8` auto-cree la tabla bajo Jest 26. |
| `db/seeders/...-usuarios-proceres.js` | Crea admin@test.com y cliente@test.com con password `123456` hasheada. |
| `.env.development` / `.env.test` | `SESSION_SECRET`, `SESSION_TTL_MIN=480`, `COOKIE_SECURE=false`, `COOKIE_SAME_SITE=lax`, `RATE_LIMIT_ENABLED`, `CORS_ORIGIN=http://localhost:5173`. |
| Tests (`lib/controllers/auth_controller.test.js`, `usuario_controller.test.js`) | 27 casos: flujo auth completo, CSRF (403), sin password en respuestas, roles (401/403/200), limpieza de BD. |

---

## Frontend (`comi-rapi-fronted`)

| Archivo | Qué hace |
|---|---|
| `src/api/client.js` | Cliente HTTP con `credentials:'include'`; agrega `x-csrf-token` automáticamente en métodos que cambian estado (lee cookie `csrf-token` o la pide a `/auth/csrf-token`). |
| `src/api/auth.js` | Conexiones reales: `loginCliente`, `loginAdmin`, `registroCliente`, `registroAdmin`, `logout`, `getCurrentUser`. `normalizarRol()` traduce `ADMINISTRADOR→ADMIN`. |
| `src/context/AuthContext.jsx` | Estado global del usuario. **Sin localStorage**: al montar hidrata con `GET /me`. Expone `login`, `loginAdministrador`, `register`, `registerAdmin`, `logout`, `loading`, `hydrated`, `isAuthenticated`, `isAdmin`, `isCliente`. |
| `src/pages/comunes/Login.jsx` | Login de cliente: email + contraseña. |
| `src/pages/comunes/Registro.jsx` | Registro de cliente: nombre, apellido, email, teléfono, fecha de nacimiento (opcional), contraseña (≥6). |
| `src/pages/admin/AdminLogin.jsx` / `AdminRegister.jsx` | Login/registro de administradores (misma API, rol `ADMINISTRADOR`). |
| `src/components/comunes/Navbar.jsx` | Logout async: espera `logout()`, vacía carrito (silencioso) y navega a `/login`. |
| `src/context/CarritoContext.jsx` | `vaciarCarrito({silencioso:true})` para no alertar al cerrar sesión. |
| `src/components/comunes/ProtectedRoute.jsx` | Redirige si no hay sesión/rol (ahora basado en cookie/contexto). |

---

## Flujo en 5 líneas

1. Al abrir la app: `GET /api/auth/me` reconstruye el usuario (o nada) → `AuthContext.hydrated`.
2. Para mutar (`POST/PUT/PATCH/DELETE`): el front manda cookie de sesión + header con `x-csrf-token` (copiado de la cookie `csrf-token`).
3. Login/registro regeneran la sesión en el server (anti session-fixation) y la cookie HttpOnly queda en el navegador.
4. Las rutas protegidas pasan por `verificarSesion` (401) y `permitirRoles` (403).
5. Logout destruye la fila en `session` y borra la cookie.

Detalles y razones en `manual-sesiones-seguridad.md`.