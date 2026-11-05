/* Reproduce: ¿llega el badge de reclamos por WebSocket al panel del negocio? */
const { chromium } = require('playwright-core');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:5173';

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function loginPanel(page, email) {
  await page.goto(`${BASE}/admin-login`, { waitUntil: 'networkidle' });
  await page.fill('#admin-login-email', email);
  await page.fill('#admin-password', '123456');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(superadmin\/panel|admin\/dashboard)/, { timeout: 20000 });
}

async function loginApi(request, email) {
  const csrfRes = await request.get(`${BASE}/api/auth/csrf-token`);
  const { csrfToken } = (await csrfRes.json()).data;
  const login = await request.post(`${BASE}/api/auth/login`, {
    headers: { 'x-csrf-token': csrfToken },
    data: { email, password: '123456' },
  });
  if (login.status() !== 200) throw new Error(`login ${login.status()}`);
}

async function csrf(request) {
  const r = await request.get(`${BASE}/api/auth/csrf-token`);
  return (await r.json()).data.csrfToken;
}

const badgeReclamos = async (page) => {
  const enlace = page.locator('a[href="/admin/quejas"]').first();
  const badge = enlace.locator('.carrito-badge');
  const n = await badge.count();
  return n ? (await badge.first().innerText()).trim() : 'sin badge';
};

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  const ctxAdmin = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-AR' });
  const pageAdmin = await ctxAdmin.newPage();
  const errores = [];
  pageAdmin.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  pageAdmin.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
  const ws = [];
  pageAdmin.on('websocket', (sock) => {
    ws.push('abierto');
    sock.on('framereceived', (f) => {
      const payload = typeof f.payload === 'string' ? f.payload : f.payload.toString('utf8');
      if (payload.includes('queja')) ws.push(`RECIBIDO ${payload.slice(0, 120)}`);
    });
  });

  await loginPanel(pageAdmin, 'superadmin@test.com');
  await pageAdmin.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
  await esperar(2500);
  const antes = await badgeReclamos(pageAdmin);
  console.log('BADGE ANTES:', antes);
  console.log('WEBSOCKETS:', ws.length ? ws.join(' | ') : 'ninguno');

  // Cliente crea un reclamo en otro contexto (otra sesión).
  const ctxCliente = await browser.newContext({ locale: 'es-AR' });
  const apiCliente = ctxCliente.request;
  await loginApi(apiCliente, 'cliente@test.com');
  const token = await csrf(apiCliente);
  const res = await apiCliente.post(`${BASE}/api/quejas`, {
    headers: { 'x-csrf-token': token },
    data: {
      pedidoId: 224,
      motivo: 'OTRO',
      detalle: 'Prueba automatica de notificacion en tiempo real.',
    },
  });
  console.log('CREAR QUEJA:', res.status(), (await res.text()).slice(0, 120));

  await esperar(4000);
  const despues = await badgeReclamos(pageAdmin);
  console.log('BADGE DESPUES:', despues);
  console.log('WEBSOCKETS:', ws.length ? ws.join(' | ') : 'ninguno');
  console.log('ERRORES CONSOLA:', errores.length ? JSON.stringify(errores) : 'ninguno');

  await browser.close();
})().catch((e) => {
  console.error('FALLO:', e.message);
  process.exit(1);
});
