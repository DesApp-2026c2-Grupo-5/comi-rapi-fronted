/**
 * Verificación del canal de tiempo real contra la UI real (Chromium).
 *
 * Los tests de `lib/realtime/conexion.test.js` (backend) fijan el contrato del
 * servidor, pero no detectan que el frontend deje de escuchar: si alguien rompe
 * el `useEffect` de `PedidoContext.jsx`, esos tests siguen en verde.
 * Esto lo cubre mirando lo que pasa de verdad en el navegador: si se abre el
 * WebSocket, si la UI se actualiza sola y si el polling desapareció.
 *
 * Requisitos: backend (`:3000`) y frontend (`:5173`) levantados.
 * Uso: `npm run test:tiempo-real`
 *
 * La primera vez hay que bajar el navegador: `npx playwright install chromium`.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { chromium } from 'playwright-core';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.WS_TEST_API || 'http://localhost:3000';
const FRONT = process.env.WS_TEST_FRONT || 'http://localhost:5173';

/**
 * Repo del backend, para poder borrar al final los pedidos que creó esta corrida.
 *
 * Los pedidos se crean por la API, que no tiene `DELETE /api/pedidos`, y el
 * listado del admin los muestra todos: sin esta limpieza el panel de pedidos
 * queda lleno de datos de prueba. Se puede desactivar con WS_TEST_LIMPIAR=0.
 */
const REPO_BACKEND =
  process.env.WS_TEST_BACKEND || path.resolve(AQUI, '..', '..', 'comi-rapi-backend');

const limpiarPedidosDePrueba = () => {
  if (process.env.WS_TEST_LIMPIAR === '0') {
    console.log('\n(Limpieza desactivada con WS_TEST_LIMPIAR=0)');
    return;
  }
  const script = path.join(REPO_BACKEND, 'scripts', 'limpiar-pedidos-de-prueba.js');
  if (!fs.existsSync(script)) {
    console.log(`\n(No se limpiaron los pedidos: no encontré ${script})`);
    console.log('Se puede indicar con la variable WS_TEST_BACKEND.');
    return;
  }
  try {
    const salida = execFileSync(process.execPath, [script], {
      cwd: REPO_BACKEND,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log(salida.trim());
  } catch (error) {
    console.log(`\n(No se pudo limpiar: ${error.message})`);
  }
};

const COOKIE_SESION = 'comirapi.sid';
const CSRF_COOKIE = 'csrf-token';

const USUARIOS = {
  // El registro público siempre crea CLIENTE, así que los roles de gestión se
  // crean/promueven directo en la base con scripts/crear-usuario-de-prueba.js
  // del backend. La sucursal del admin se pasa al invocar el script (es la del
  // pedido de prueba, ver más abajo).
  admin: { email: 'ws-ui-admin@test.com', rol: 'ADMINISTRADOR', viaScript: true },
  cliente: { email: 'ws-ui-cliente@test.com', rol: 'CLIENTE' },
  super: {
    email: 'ws-ui-super@test.com',
    rol: 'SUPERADMINISTRADOR',
    viaScript: true,
  },
};
const ARCHIVO_SESIONES = path.join(AQUI, '.sesiones-tiempo-real.json');

/**
 * Dirección de los usuarios de prueba.
 *
 * `POST /api/direcciones` es solo para CLIENTE, así que el admin de prueba no
 * tiene (ni puede tener) una. Es idempotente: si ya había direcciones de una
 * corrida anterior, se reutiliza la primera.
 */
const DIRECCION = {
  calle: 'Av. Corrientes',
  altura: 1234,
  // Con "Buenos Aires" el service exige el partido (departamento); con CABA no.
  // Mismo dato que usan los tests del backend (GEO_CABA / DATOS_CABA).
  provincia: 'Ciudad Autónoma de Buenos Aires',
  localidad: 'CABA',
  codigoPostal: '1043',
  referencia: 'Puerta 2, timbre 3',
  alias: 'Casa',
};

// Se reutilizan las sesiones del backend si existen: registrar usuarios en cada
// corrida choca rápido con el rate limiter de auth (20 req / 15 min).
const leerCache = () => {
  try {
    return JSON.parse(fs.readFileSync(ARCHIVO_SESIONES, 'utf8'));
  } catch {
    return {};
  }
};

const crearClienteREST = (cookieInicial = {}) => {
  const tarro = { ...cookieInicial };
  const cabecera = () =>
    Object.entries(tarro)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

  const pedir = async (metodo, ruta, cuerpo) => {
    const headers = { 'Content-Type': 'application/json', Cookie: cabecera() };
    if (tarro[CSRF_COOKIE]) headers['x-csrf-token'] = tarro[CSRF_COOKIE];
    const res = await fetch(API + ruta, {
      method: metodo,
      headers,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    for (const cookie of res.headers.getSetCookie()) {
      const match = cookie.match(/^([^=]+)=([^;]*)/);
      if (match) tarro[match[1]] = match[2];
    }
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };
  return {
    get: (ruta) => pedir('GET', ruta),
    post: (ruta, cuerpo) => pedir('POST', ruta, cuerpo),
    patch: (ruta, cuerpo) => pedir('PATCH', ruta, cuerpo),
    put: (ruta, cuerpo) => pedir('PUT', ruta, cuerpo),
    get sid() {
      return tarro[COOKIE_SESION] || null;
    },
  };
};

/**
 * Sesión válida del rol indicado.
 *
 * Busca primero el email en la cache del backend (mismo `sid`, ya firmado por
 * el servidor) y valida con `/api/auth/me` que la sesión siga teniendo el rol
 * esperado — un sid cacheado de cuando el usuario era CLIENTE ya no sirve.
 * Los roles de gestión no se pueden registrar por la API: se crean con
 * scripts/crear-usuario-de-prueba.js y luego se entra por login.
 */
const sesionDe = async (rol, sucursalId) => {
  const { email, rol: rolUsuario, viaScript } = USUARIOS[rol];
  const cache = leerCache();
  const guardado = cache[email];

  if (guardado?.sid) {
    const cliente = crearClienteREST({
      [COOKIE_SESION]: guardado.sid,
      [CSRF_COOKIE]: crypto.randomBytes(32).toString('hex'),
    });
    const me = await cliente.get('/api/auth/me');
    const datos = me.body && me.body.data;
    const rolOk = me.status === 200 && datos && datos.rol === rolUsuario;
    const sucursalOk =
      !sucursalId || (datos && Number(datos.sucursalId) === Number(sucursalId));
    if (rolOk && sucursalOk) return cliente;
  }

  let registroStatus = '(sin registro)';
  if (viaScript) {
    const script = path.join(
      REPO_BACKEND,
      'scripts',
      'crear-usuario-de-prueba.js'
    );
    const args = [script, email, '123456', rolUsuario];
    if (sucursalId) args.push(String(sucursalId));
    execFileSync(process.execPath, args, {
      cwd: REPO_BACKEND,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } else {
    const cliente = crearClienteREST({
      [CSRF_COOKIE]: crypto.randomBytes(32).toString('hex'),
    });
    const registro = await cliente.post('/api/auth/registro', {
      nombre: 'Verificacion UI',
      email,
      password: '123456',
      rol: rolUsuario,
    });
    registroStatus = registro.status;
    if (cliente.sid) {
      return guardarSesion(email, cache, cliente);
    }
  }

  const cliente = crearClienteREST({
    [CSRF_COOKIE]: crypto.randomBytes(32).toString('hex'),
  });
  await cliente.post('/api/auth/login', { email, password: '123456' });
  if (!cliente.sid) {
    throw new Error(
      `No se pudo iniciar sesión como ${rol} (registro ${registroStatus}). ` +
        'Puede ser el rate limiter de auth: esperá unos minutos.'
    );
  }
  return guardarSesion(email, cache, cliente);
};

/** Guarda el sid en la cache para reusarlo en la próxima corrida. */
const guardarSesion = (email, cache, cliente) => {
  fs.writeFileSync(
    ARCHIVO_SESIONES,
    JSON.stringify({ ...cache, [email]: { sid: cliente.sid } }, null, 2)
  );
  return cliente;
};

/** Dirección guardada del cliente, creándola si no tiene ninguna. */
const asegurarDireccion = async (cliente) => {
  const existentes = await cliente.get('/api/direcciones');
  if (existentes.status === 200 && Array.isArray(existentes.body.data)) {
    if (existentes.body.data.length > 0) return existentes.body.data[0];
  }
  const creada = await cliente.post('/api/direcciones', DIRECCION);
  if (creada.status !== 201) {
    throw new Error(
      `No se pudo crear la dirección del usuario de prueba: HTTP ${creada.status}`
    );
  }
  return creada.body.data;
};

let fallas = 0;
const check = (nombre, condicion, razon) => {
  if (condicion) {
    console.log(`  OK     ${nombre}`);
  } else {
    console.log(`  FALLA  ${nombre}${razon ? ` -> ${razon}` : ''}`);
    fallas += 1;
  }
};
const seccion = (nombre) => console.log(`\n${nombre}`);
const texto = (page) => page.evaluate(() => document.body.innerText);
const noRecargo = (page) =>
  page.evaluate(() => performance.getEntriesByType('navigation').length === 1);

/**
 * Estados de los pedidos tal como los muestra la lista.
 *
 * Se leen los `.badge` y no el texto de la página a propósito: las etiquetas
 * de los estados ("En preparación", "Confirmado") también aparecen en el
 * desplegable de filtros, así que buscar en el bodyInnerText daría un OK falso
 * aunque la lista no se hubiera actualizado.
 */
const estadosEnPantalla = (page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('.badge')).map((b) => b.textContent.trim())
  );

/** Texto de los banners de notificación visibles (BannersNotificaciones). */
const bannersEnPantalla = (page) =>
  page.evaluate(() =>
    Array.from(document.querySelectorAll('.batch-notificacion-mensaje')).map((e) =>
      e.textContent.trim()
    )
  );

/**
 * Cuántos spinners de react-bootstrap hay en pantalla.
 *
 * Sirve para comprobar que una actualización en el lugar no re-enciende el
 * indicador de carga de toda la sección.
 */
const spinnersEnPantalla = (page) =>
  page.evaluate(() => document.querySelectorAll('.spinner-border').length);

/**
 * Arma un observador que cuenta los spinners que APARECIERON en la página.
 *
 * `spinnersEnPantalla` es una foto: si el spinner se prende y se apaga entre dos
 * mediciones (justo lo que pasa con un `cargar()` rápido) no lo ve. Acá se
 * instala un MutationObserver sobre todo el documento y se acumula cada aparición.
 * También marca el nodo de la tabla para comprobar después que siguió siendo el
 * mismo (es decir, que no se desmontó y volvió a montar).
 */
const observarSpinners = async (page) => {
  await page.evaluate(() => {
    window.__spinnersAparecidos = 0;
    window.__observadorSpinners = new MutationObserver(() => {
      if (document.querySelector('.spinner-border')) window.__spinnersAparecidos += 1;
    });
    window.__observadorSpinners.observe(document.body, { childList: true, subtree: true });
    const tabla = document.querySelector('table');
    if (tabla) tabla.dataset.viva = '1';
  });
};

const spinnersAparecidos = (page) =>
  page.evaluate(() => window.__spinnersAparecidos || 0);

/** ¿La tabla sigue siendo el mismo nodo que se marcó en `observarSpinners`? */
const tablaViva = (page) =>
  page.evaluate(
    () =>
      document.querySelector('table')?.dataset.viva === '1' &&
      window.__observadorSpinners !== undefined
  );

/**
 * Fila de una tabla de 5 columnas (…) x (Sucursal, Producto, Cantidad, …)
 * cuya celda "Producto" contiene el nombre dado. Devuelve la cantidad mostrada.
 */
const cantidadEnTabla = (page, nombreProducto) =>
  page.evaluate((nombre) => {
    for (const fila of document.querySelectorAll('tbody tr')) {
      const celdas = fila.querySelectorAll('td');
      if (celdas.length > 2 && celdas[1]?.textContent.includes(nombre)) {
        const input = celdas[2]?.querySelector('input');
        return Number(input ? input.value : celdas[2].textContent.trim());
      }
    }
    return null;
  }, nombreProducto);

/** Abre un contexto de navegador con la sesión ya iniciada. */
const contextoConSesion = async (browser, sid) => {
  const ctx = await browser.newContext();
  await ctx.addCookies([
    { name: COOKIE_SESION, value: sid, domain: 'localhost', path: '/' },
    {
      name: CSRF_COOKIE,
      value: crypto.randomBytes(32).toString('hex'),
      domain: 'localhost',
      path: '/',
    },
  ]);
  return ctx;
};

(async () => {
  console.log('\nCanal de tiempo real — verificación en navegador');
  console.log('===============================================');

  const cliente = await sesionDe('cliente');
  const lista = await cliente.get('/api/productos');
  if (lista.status !== 200 || !lista.body.data?.length) {
    throw new Error(
      `No se pudieron listar los productos: HTTP ${lista.status} ${JSON.stringify(lista.body).slice(0, 200)}`
    );
  }
  const direccion = await asegurarDireccion(cliente);

  // El backend espera `direccionEntrega` con `ciudad`, no `localidad`. Es el
  // mismo mapeo que hace `payloadBackend` en src/api/pedidos.js.
  const direccionEntrega = {
    calle: direccion.calle,
    altura: direccion.altura,
    ciudad: direccion.localidad,
    codigoPostal: direccion.codigoPostal,
    referencia: direccion.referencia,
  };

  // El producto de prueba no se elige a ciegas. La limpieza de cada corrida borra
  // los pedidos pero NO repone el stock que descontaron, así que con varias
  // corridas seguidas el primero de la lista puede estar en 0 y el create
  // responde 422. Se recorren los productos hasta encontrar uno con stock: los
  // rechazos no crean pedidos ni consumen nada, así que no dejan basura.
  let producto = null;
  let productoId = null;
  let pedido = null;

  const nuevoPedido = async (idProducto = productoId) => {
    // El backend resuelve las coordenadas del snapshot desde la Dirección
    // persistida (`direccionId`), igual que hace payloadBackend en
    // src/api/pedidos.js: el payload textual solo es retro-compatibilidad.
    const res = await cliente.post('/api/pedidos', {
      productos: [{ productoId: idProducto, cantidad: 1 }],
      direccionId: direccion.id,
      direccionEntrega,
    });
    if (res.status !== 201 || !res.body.data) {
      throw new Error(
        `No se pudo crear el pedido de prueba: HTTP ${res.status} ${JSON.stringify(res.body)}`
      );
    }
    return res.body.data;
  };
  const confirmar = (id) =>
    cliente.patch(`/api/pedidos/${id}/estado`, {
      estado: 'confirmado',
      medioPago: 'TARJETA',
    });

  // Pedido base (confirmado) ANTES de armar el navegador: la sucursal a la que
  // se asigna define el ADMINISTRADOR de prueba, que tiene que ser de ese local
  // para poder avanzar estados.
  for (const candidato of lista.body.data) {
    const res = await cliente.post('/api/pedidos', {
      productos: [{ productoId: candidato.id, cantidad: 1 }],
      direccionId: direccion.id,
      direccionEntrega,
    });
    if (res.status === 201 && res.body.data) {
      producto = candidato;
      productoId = candidato.id;
      pedido = res.body.data;
      break;
    }
    console.log(`  (sin stock: ${candidato.nombre} -> HTTP ${res.status})`);
  }
  if (!pedido) {
    throw new Error(
      'Ningún producto del catálogo tiene stock: no se pudo armar el pedido base. ' +
        'Reponé el stock (panel de stock o un UPDATE "Stocks") y volvé a correr.'
    );
  }
  console.log(`Producto de prueba: ${producto.nombre} (id ${productoId})`);
  await confirmar(pedido.id);
  const admin = await sesionDe('admin', pedido.sucursalId);

  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    console.error(
      '\nNo se pudo abrir Chromium. La primera vez hay que bajarlo:\n' +
        '  npx playwright install chromium\n'
    );
    throw error;
  }

  try {
    const ctxCli = await contextoConSesion(browser, cliente.sid);
    const ctxAdm = await contextoConSesion(browser, admin.sid);
    const pCli = await ctxCli.newPage();
    const pAdm = await ctxAdm.newPage();

    const websockets = { cliente: [], admin: [] };
    const pedidosCli = [];
    pCli.on('websocket', (s) => {
      if (s.url().includes(':3000')) websockets.cliente.push(s.url());
    });
    pAdm.on('websocket', (s) => {
      if (s.url().includes(':3000')) websockets.admin.push(s.url());
    });
    pCli.on('request', (r) => {
      if (/\/api\/pedidos(\?|$)/.test(r.url())) pedidosCli.push(Date.now());
    });
    const productosCli = [];
    pCli.on('request', (r) => {
      // El catálogo ya no refetchea la colección entera: ante un cambio relee
      // sólo el producto afectado (`/api/productos/<id>`). Se capturan las dos
      // formas para poder comprobar que llegó el dato.
      if (/\/api\/productos(\/\d+)?(\?|$)/.test(r.url())) productosCli.push(Date.now());
    });
    const pedidosAdm = [];
    pAdm.on('request', (r) => {
      if (/\/api\/pedidos(\?|$)/.test(r.url())) pedidosAdm.push(Date.now());
    });

    await pCli.goto(`${FRONT}/cliente/mis-pedidos`, { waitUntil: 'networkidle' });
    await pAdm.goto(`${FRONT}/admin/pedidos`, { waitUntil: 'networkidle' });
    await pCli.waitForTimeout(3500);
    await pAdm.waitForTimeout(3500);

    seccion('1. El WebSocket se abre en las dos vistas');
    check('se abre en la vista del cliente', websockets.cliente.length > 0,
      JSON.stringify(websockets.cliente));
    check('se abre en la vista del admin', websockets.admin.length > 0,
      JSON.stringify(websockets.admin));

    seccion('2. El polling de 3 s desapareció');
    const antes = pedidosCli.length;
    await pCli.waitForTimeout(9000);
    const nuevas = pedidosCli.slice(antes);
    check('9 s sin peticiones periódicas a /api/pedidos', nuevas.length === 0,
      `llegaron ${nuevas.length}`);

    seccion('3. El cliente ve su pedido avanzar sin recargar');
    const estadosIniciales = await estadosEnPantalla(pCli);
    check('el pedido aparece confirmado en Mis Pedidos',
      estadosIniciales.includes('Confirmado'),
      JSON.stringify(estadosIniciales));
    const avance = await admin.patch(`/api/pedidos/${pedido.id}/estado`, {
      estado: 'en_preparacion',
    });
    check('el admin avanza el estado por REST', avance.status === 200,
      `HTTP ${avance.status}`);
    await pCli.waitForTimeout(3000);
    const estadosFinales = await estadosEnPantalla(pCli);
    check('la lista se actualizó sola',
      estadosIniciales.join('|') !== estadosFinales.join('|'),
      `${JSON.stringify(estadosIniciales)} -> ${JSON.stringify(estadosFinales)}`);
    check('el badge del pedido pasó a "En preparación"',
      estadosFinales.includes('En preparación'),
      JSON.stringify(estadosFinales));
    check('la página no se recargó', await noRecargo(pCli));

    seccion('4. El admin no se entera al crearse, solo al confirmarse');
    const pedidosAntes = pedidosAdm.length;
    const pedido2 = await nuevoPedido();
    check('el segundo pedido se crea', !!pedido2?.id);
    await pAdm.waitForTimeout(3000);
    check('el admin NO refetchea al crearse',
      pedidosAdm.length === pedidosAntes,
      `llamadas: ${pedidosAdm.length - pedidosAntes}`);
    const estadosAdmin = await estadosEnPantalla(pAdm);
    check('el pendiente no aparece en la vista del admin',
      !new RegExp(`#?\\s*${pedido2.id}\\b`).test(await texto(pAdm)),
      `id=${pedido2.id}`);

    await confirmar(pedido2.id);
    await pAdm.waitForTimeout(3000);
    check('el admin refetchea al confirmarse', pedidosAdm.length > pedidosAntes);
    const estadosAdminDespues = await estadosEnPantalla(pAdm);
    check('el pedido nuevo aparece confirmado para el admin',
      estadosAdminDespues.length > estadosAdmin.length,
      `${JSON.stringify(estadosAdmin)} -> ${JSON.stringify(estadosAdminDespues)}`);
    check('la página del admin no se recargó', await noRecargo(pAdm));

    seccion('5. El cliente recibe avisos de un pedido que ya conoce');
    // El cliente solo escucha los pedidos que tiene en su lista: al crear uno,
    // `crearPedido` lo inserta y el efecto lo suscribe. Por eso acá se recarga
    // la lista (lo que hace la app al crear) y se verifica el aviso en vivo.
    // OJO: un pedido creado en OTRA pestaña no se descubre solo, porque no hay
    // evento de creación. Ver "límites conocidos" en docs/webSocketContext.md.
    const pedido3 = await nuevoPedido();
    await confirmar(pedido3.id);
    await pCli.reload({ waitUntil: 'networkidle' });
    await pCli.waitForTimeout(3000);
    const antesDelAvance = await estadosEnPantalla(pCli);
    const enPreparacion = (estados) =>
      estados.filter((e) => /en preparaci/i.test(e)).length;
    const confirmados = (estados) =>
      estados.filter((e) => /confirmado/i.test(e)).length;
    check('el pedido nuevo entra en la lista del cliente',
      confirmados(antesDelAvance) > 0,
      JSON.stringify(antesDelAvance));

    const avance3 = await admin.patch(`/api/pedidos/${pedido3.id}/estado`, {
      estado: 'en_preparacion',
    });
    check('el admin avanza el estado por REST', avance3.status === 200,
      `HTTP ${avance3.status}`);
    await pCli.waitForTimeout(3000);
    const despuesDelAvance = await estadosEnPantalla(pCli);
    check('llega el aviso del pedido nuevo',
      enPreparacion(despuesDelAvance) === enPreparacion(antesDelAvance) + 1,
      `${enPreparacion(antesDelAvance)} -> ${enPreparacion(despuesDelAvance)}`);
    check('el cliente no recargó la página', await noRecargo(pCli));

    seccion('6. Catálogo: el cliente ve la edición de un producto sin recargar');
    // El CRUD de productos es del SUPERADMINISTRADOR, y el registro público
    // siempre crea CLIENTE: el superadmin se crea directo en la base con
    // scripts/crear-usuario-de-prueba.js del backend.
    const superadmin = await sesionDe('super');
    // `producto` sale del listado del principio; no hace falta re-pedirlo.
    const nombreOriginal = producto.nombre;
    const nombreNuevo = `${nombreOriginal} WS`;

    const wsCliAntes = websockets.cliente.length;
    await pCli.goto(`${FRONT}/cliente/catalogo`, { waitUntil: 'networkidle' });
    await pCli.waitForTimeout(3500);
    check('el WebSocket se abre también en el catálogo',
      websockets.cliente.length > wsCliAntes,
      JSON.stringify(websockets.cliente));

    const catalogosAntes = productosCli.length;
    const editado = await superadmin.put(`/api/productos/${productoId}`, {
      nombre: nombreNuevo,
    });
    check('el superadmin edita el producto por REST', editado.status === 200,
      `HTTP ${editado.status}`);
    await pCli.waitForTimeout(3000);
    check('el catálogo del cliente relee el producto por REST',
      productosCli.length > catalogosAntes,
      `llamadas: ${productosCli.length - catalogosAntes}`);
    check('el nombre nuevo aparece en la grilla',
      (await texto(pCli)).includes(nombreNuevo));
    check('la página del catálogo no se recargó', await noRecargo(pCli));

    const restaurado = await superadmin.put(`/api/productos/${productoId}`, {
      nombre: nombreOriginal,
    });
    check('se restaura el nombre original', restaurado.status === 200,
      `HTTP ${restaurado.status}`);
    await pCli.waitForTimeout(3000);
    check('la restauración también llega por el mismo canal',
      (await texto(pCli)).includes(nombreOriginal) &&
        !(await texto(pCli)).includes(nombreNuevo));

    seccion('7. El superadmin no recibe los avisos del cliente');
    // El superadmin está en la room `admins` y recibe `pedido_actualizado` de
    // TODO el sistema, pero no opera una sucursal ni es dueño de un pedido: no
    // debe ver los banners de cliente ("Tu pedido …"). Antes los recibía porque
    // `detectarCambios` caía en la rama de no-admin (isAdmin es igualdad estricta
    // a ADMINISTRADOR, así que es false para el superadmin). Su panel sí refresca
    // las métricas con su propio listener, y eso tiene que seguir pasando.
    const ctxSup = await contextoConSesion(browser, superadmin.sid);
    const pSup = await ctxSup.newPage();
    const resumenSup = [];
    pSup.on('request', (r) => {
      if (/\/api\/superadmin\/resumen/.test(r.url())) resumenSup.push(Date.now());
    });
    await pSup.goto(`${FRONT}/superadmin/panel`, { waitUntil: 'networkidle' });
    await pSup.waitForTimeout(3000);

    // Pedido que el superadmin ya conoce confirmado: así la transición a
    // en_camino tiene un estado previo con el que comparar (si no, no avisaría
    // ni siquiera al cliente).
    const pedido4 = await nuevoPedido();
    await confirmar(pedido4.id);
    await pSup.waitForTimeout(2500);
    const resumenAntes = resumenSup.length;

    const avanzar = (id, estado) =>
      admin.patch(`/api/pedidos/${id}/estado`, { estado });
    await avanzar(pedido4.id, 'en_preparacion');
    await avanzar(pedido4.id, 'listo_para_entregar');
    await avanzar(pedido4.id, 'en_camino');
    await pSup.waitForTimeout(3000);

    const avisosSup = await bannersEnPantalla(pSup);
    check('el superadmin no ve el banner "Tu pedido …"',
      !avisosSup.some((b) => /tu pedido/i.test(b)), JSON.stringify(avisosSup));
    check('el superadmin sigue en su panel (no navega)',
      pSup.url().endsWith('/superadmin/panel'), pSup.url());
    check('el panel del superadmin sí refresca las métricas',
      resumenSup.length > resumenAntes,
      `resumen: ${resumenAntes} -> ${resumenSup.length}`);

    await avanzar(pedido4.id, 'cancelado');
    await pSup.waitForTimeout(2500);
    const avisosSupCancel = await bannersEnPantalla(pSup);
    check('tampoco ve el banner de cancelación del cliente',
      !avisosSupCancel.some((b) => /tu pedido/i.test(b)),
      JSON.stringify(avisosSupCancel));
    check('sigue en su panel tras la cancelación',
      pSup.url().endsWith('/superadmin/panel'), pSup.url());

    seccion('8. El cliente sí sigue viendo sus avisos');
    // Regression: la supresión es solo para el superadmin. El cliente tiene que
    // seguir recibiendo el aviso de "en camino" de sus propios pedidos.
    const pedido5 = await nuevoPedido();
    await confirmar(pedido5.id);
    await pCli.goto(`${FRONT}/cliente/mis-pedidos`, { waitUntil: 'networkidle' });
    await pCli.waitForTimeout(2500);
    const avisosCliAntes = await bannersEnPantalla(pCli);
    await avanzar(pedido5.id, 'en_preparacion');
    await avanzar(pedido5.id, 'listo_para_entregar');
    await avanzar(pedido5.id, 'en_camino');
    await pCli.waitForTimeout(3000);
    const avisosCli = await bannersEnPantalla(pCli);
    check('el cliente ve el banner "Tu pedido … está en camino"',
      avisosCli.some((b) => /tu pedido .*en camino/i.test(b)),
      JSON.stringify({ antes: avisosCliAntes, despues: avisosCli }));

    seccion('9. La tabla de gestión se actualiza en el lugar');
    // `ListaProductos` (vista /superadmin/productos) escucha
    // `catalogo_actualizado` y relee SOLO el producto afectado, sin spinner de
    // carga y sin re-pedir la colección entera. Es el mismo patrón que ya usaba
    // `GestionStock` con el stock.
    const pGestion = await ctxSup.newPage();
    const productosGestion = [];
    const coleccionGestion = [];
    pGestion.on('request', (r) => {
      if (/\/api\/productos\/\d+(\?|$)/.test(r.url())) productosGestion.push(Date.now());
      if (/\/api\/productos(\?|$)/.test(r.url())) coleccionGestion.push(Date.now());
    });
    await pGestion.goto(`${FRONT}/superadmin/productos`, { waitUntil: 'networkidle' });
    await pGestion.waitForTimeout(3500);
    check('el producto aparece en la tabla de gestión',
      (await texto(pGestion)).includes(nombreOriginal));

    const filasAntes = productosGestion.length;
    const coleccionAntes = coleccionGestion.length;
    const editadoTabla = await superadmin.put(`/api/productos/${productoId}`, {
      nombre: nombreNuevo,
    });
    check('el superadmin edita el producto por REST', editadoTabla.status === 200,
      `HTTP ${editadoTabla.status}`);
    await pGestion.waitForTimeout(3000);
    check('la tabla relee sólo el producto afectado',
      productosGestion.length > filasAntes,
      `items: ${filasAntes} -> ${productosGestion.length}`);
    check('la tabla NO re-pide la colección entera',
      coleccionGestion.length === coleccionAntes,
      `coleccion: ${coleccionAntes} -> ${coleccionGestion.length}`);
    check('la fila muestra el nombre nuevo',
      (await texto(pGestion)).includes(nombreNuevo));
    check('la tabla no re-enciende el spinner de carga',
      (await spinnersEnPantalla(pGestion)) === 0,
      `spinners: ${await spinnersEnPantalla(pGestion)}`);
    check('la página de gestión no se recargó', await noRecargo(pGestion));

    const restauradoTabla = await superadmin.put(`/api/productos/${productoId}`, {
      nombre: nombreOriginal,
    });
    check('se restaura el nombre original', restauradoTabla.status === 200,
      `HTTP ${restauradoTabla.status}`);
    await pGestion.waitForTimeout(3000);
    check('la restauración también se aplica en el lugar',
      (await texto(pGestion)).includes(nombreOriginal) &&
        !(await texto(pGestion)).includes(nombreNuevo));

    // Una categoría renombrada cambia el nombre de categoría de TODOS los
    // productos, así que ahí el refresh silencioso de la colección entera sigue
    // siendo la opción correcta (no se puede parchear una fila con el dato
    // viejo). Tiene que actualizarse sin spinner ni recarga.
    const categorias = await cliente.get('/api/categorias');
    const categoriaId = categorias.body.data?.[0]?.id;
    if (!categoriaId) {
      check('hay una categoría para probar el refresh silencioso', false,
        'el catálogo no devolvió categorías');
    } else {
      const categoria = (await cliente.get(`/api/categorias/${categoriaId}`)).body.data;
      const catNombreOriginal = categoria.nombre;
      const catNombreNuevo = `${catNombreOriginal} WS`;
      const collectionAntes2 = coleccionGestion.length;
      const catEditada = await superadmin.put(`/api/categorias/${categoriaId}`, {
        nombre: catNombreNuevo,
      });
      check('el superadmin renombra la categoría por REST', catEditada.status === 200,
        `HTTP ${catEditada.status}`);
      await pGestion.waitForTimeout(3000);
      check('la tabla se refresca con el nuevo nombre de categoría',
        (await texto(pGestion)).includes(catNombreNuevo),
        'no aparece el nombre nuevo de la categoría');
      check('el refresh no re-enciende el spinner', (await spinnersEnPantalla(pGestion)) === 0);
      check('la página de gestión no se recargó con el cambio de categoría',
        await noRecargo(pGestion));
      check('el refresh silencioso re-pide la colección',
        coleccionGestion.length > collectionAntes2,
        `coleccion: ${collectionAntes2} -> ${coleccionGestion.length}`);
      const catRestaurada = await superadmin.put(`/api/categorias/${categoriaId}`, {
        nombre: catNombreOriginal,
      });
      check('se restaura el nombre de la categoría', catRestaurada.status === 200,
        `HTTP ${catRestaurada.status}`);
      await pGestion.waitForTimeout(2500);
      check('la restauración de la categoría también llega',
        (await texto(pGestion)).includes(catNombreOriginal));
    }

    seccion('10. El stock de la sucursal del admin se actualiza en el lugar');
    // El cliente hace un pedido por API (sin tocar el navegador del admin): eso
    // descuenta stock y dispara `stock_actualizado {sucursalId, productoIds}`,
    // que sólo va a la room de esa sucursal. La fila de /admin/stock tiene que
    // bajar de N a N-1 con la tabla viva, sin spinner y sin re-pedir toda la
    // colección. `pAdm` quedó libre desde la sección 4.
    const matrizStock = (await admin.get('/api/stock')).body.data;
    // Un combo no tiene celda editable y su cantidad la deriva de la receta (baja
    // con el stock de los componentes, no en un paso de uno), así que "bajó de
    // N a N-1" sólo se puede afirmar sobre un producto simple. Y se elige de la
    // matriz real de la sucursal: el producto que usa el resto del script puede
    // ser un combo o directamente no tener fila cargada.
    const filasDeLaSucursal = Array.isArray(matrizStock) ? matrizStock : [];
    const filaStock =
      filasDeLaSucursal.find((f) => f.tipo !== 'COMBO' && Number(f.cantidad) >= 2) ||
      filasDeLaSucursal.find((f) => f.tipo !== 'COMBO');

    if (!filaStock) {
      check('hay un producto simple con fila de stock en la sucursal del admin',
        false, 'la matriz de /api/stock no trae ninguna fila que no sea combo');
    } else {
      check('la fila pertenece a la sucursal del admin',
        Number(filaStock.sucursalId) === Number(pedido.sucursalId),
        `${filaStock.sucursalId} != ${pedido.sucursalId}`);
      const idProductoStock = Number(filaStock.productoId);
      const nombreEnStock = filaStock.producto;
      const cantidadOriginal = Number(filaStock.cantidad);
      // Las corridas seguidas vacían el stock: cada verificación crea pedidos de
      // 1 unidad. Con menos de 2 no hay "N-1" que comprobar, así que se sube y
      // se restaura el valor original al final.
      const huboReposicion = cantidadOriginal < 2;
      if (huboReposicion) {
        const subida = await admin.put(
          `/api/stock/${filaStock.sucursalId}/${idProductoStock}`,
          { cantidad: 10 }
        );
        check('se repone el stock agotado para poder medir el descuento',
          subida.status === 200, `HTTP ${subida.status}`);
      }

      const pedidosStockLista = [];
      const pedidosStockFila = [];
      pAdm.on('request', (r) => {
        // `/api/stock/12/5` (fila) y `/api/stock?…` (colección) se distinguen
        // porque la variante con query no tiene nada después de `stock`.
        if (/\/api\/stock\/\d+\/\d+(\?|$)/.test(r.url())) pedidosStockFila.push(Date.now());
        else if (/\/api\/stock(\?|$)/.test(r.url())) pedidosStockLista.push(Date.now());
      });

      await pAdm.goto(`${FRONT}/admin/stock`, { waitUntil: 'networkidle' });
      await pAdm.waitForSelector('table', { timeout: 15000 });
      await pAdm.waitForTimeout(2000); // deja terminar la carga inicial
      await observarSpinners(pAdm);

      const cantidadAntes = await cantidadEnTabla(pAdm, nombreEnStock);
      check('la fila del producto se ve en la tabla de stock',
        Number.isFinite(cantidadAntes), `cantidad=${cantidadAntes}`);

      const listaAntes = pedidosStockLista.length;
      const pedido6 = await nuevoPedido(idProductoStock);
      check('se crea el pedido que descuenta stock', !!pedido6?.id);
      await pAdm.waitForTimeout(4000);

      const cantidadDespues = await cantidadEnTabla(pAdm, nombreEnStock);
      check('la cantidad bajó de N a N-1', cantidadDespues === cantidadAntes - 1,
        `antes=${cantidadAntes} después=${cantidadDespues}`);
      check('la tabla siguió viva (mismo nodo, sin desmontar)', await tablaViva(pAdm));
      check('no apareció ningún spinner en el camino',
        (await spinnersAparecidos(pAdm)) === 0,
        `spinners: ${await spinnersAparecidos(pAdm)}`);
      check('no re-pidió la colección de stock',
        pedidosStockLista.length === listaAntes,
        `lista: ${listaAntes} -> ${pedidosStockLista.length}`);
      check('sí relee la fila afectada', pedidosStockFila.length > 0,
        `filas re-leidas: ${pedidosStockFila.length}`);
      check('la página de stock no se recargó', await noRecargo(pAdm));

      if (huboReposicion) {
        const restauracion = await admin.put(
          `/api/stock/${filaStock.sucursalId}/${idProductoStock}`,
          { cantidad: cantidadOriginal }
        );
        check('se restaura el stock original', restauracion.status === 200,
          `HTTP ${restauracion.status}`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\n${fallas === 0 ? 'TODO OK' : `${fallas} FALLA(S)`}`);
  limpiarPedidosDePrueba();
  process.exit(fallas === 0 ? 0 : 1);
})().catch((error) => {
  limpiarPedidosDePrueba();
  console.error(`\nError inesperado: ${error.message}`);
  process.exit(1);
});
