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
  admin: { email: 'ws-ui-admin@test.com', rol: 'ADMINISTRADOR' },
  cliente: { email: 'ws-ui-cliente@test.com', rol: 'CLIENTE' },
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
  provincia: 'Buenos Aires',
  localidad: 'CABA',
  codigoPostal: 'C1043',
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
    get sid() {
      return tarro[COOKIE_SESION] || null;
    },
  };
};

/**
 * Sesión válida del rol indicado.
 *
 * Busca primero el email en la cache del backend (mismo `sid`, ya firmado por
 * el servidor) y, si no está, registra el usuario y guarda el resultado para
 * que la próxima corrida no vuelva a pegarle al rate limiter.
 */
const sesionDe = async (rol) => {
  const { email, rol: rolUsuario } = USUARIOS[rol];
  const cache = leerCache();
  const guardado = cache[email];

  if (guardado?.sid) {
    const cliente = crearClienteREST({
      [COOKIE_SESION]: guardado.sid,
      [CSRF_COOKIE]: crypto.randomBytes(32).toString('hex'),
    });
    if ((await cliente.get('/api/productos')).status === 200) return cliente;
  }

  const cliente = crearClienteREST({
    [CSRF_COOKIE]: crypto.randomBytes(32).toString('hex'),
  });
  const registro = await cliente.post('/api/auth/registro', {
    nombre: 'Verificacion UI',
    email,
    password: '123456',
    rol: rolUsuario,
  });
  if (!cliente.sid) {
    await cliente.post('/api/auth/login', { email, password: '123456' });
  }
  if (!cliente.sid) {
    throw new Error(
      `No se pudo iniciar sesión como ${rol} (registro ${registro.status}). ` +
        'Puede ser el rate limiter de auth: esperá unos minutos.'
    );
  }
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

  const admin = await sesionDe('admin');
  const cliente = await sesionDe('cliente');
  const productoId = (await cliente.get('/api/productos')).body.data[0].id;
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

  const nuevoPedido = async () => {
    const res = await cliente.post('/api/pedidos', {
      productos: [{ productoId, cantidad: 1 }],
      direccionEntrega,
    });
    return res.body.data;
  };
  const confirmar = (id) =>
    cliente.patch(`/api/pedidos/${id}/estado`, {
      estado: 'confirmado',
      medioPago: 'TARJETA',
    });

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
    const pedidosAdm = [];
    pAdm.on('request', (r) => {
      if (/\/api\/pedidos(\?|$)/.test(r.url())) pedidosAdm.push(Date.now());
    });

    // Pedido base: confirmado, para que el cliente pueda verlo en Mis Pedidos.
    const pedido = await nuevoPedido();
    await confirmar(pedido.id);

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
