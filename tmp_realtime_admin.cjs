/* Reproduce: badge de reclamos en el panel del ADMIN (no superadmin). */
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
  const ws = [];
  pageAdmin.on('websocket', (sock) => {
    sock.on('framereceived', (f) => {
      const payload = typeof f.payload === 'string' ? f.payload : f.payload.toString('utf8');
      if (payload.includes('queja')) ws.push(`RECIBIDO ${payload.slice(0, 120)}`);
    });
    sock.on('framesent', (f) => {
      const payload = typeof f.payload === 'string' ? f.payload : f.payload.toString('utf8');
      if (payload.includes('40')) ws.push(`ENVIADO ${payload.slice(0, 80)}`);
    });
  });

  await loginPanel(pageAdmin, 'admin@jmderosas.com');
  await pageAdmin.goto(`${BASE}/admin/dashboard`, { waitUntil: 'networkidle' });
  await esperar(2500);
  console.log('BADGE ANTES:', await badgeReclamos(pageAdmin));

  const ctxCliente = await browser.newContext({ locale: 'es-AR' });
  const apiCliente = ctxCliente.request;
  await loginApi(apiCliente, 'xinci@demo.com');
  const token = await csrf(apiCliente);
  const res = await apiCliente.post(`${BASE}/api/quejas`, {
    headers: { 'x-csrf-token': token },
    data: {
      pedidoId: 219,
      motivo: 'DEMORA_EN_LA_ENTREGA',
      detalle: 'Prueba automatica del badge del administrador.',
    },
  });
  console.log('CREAR QUEJA:', res.status(), (await res.text()).slice(0, 100));

  await esperar(4000);
  console.log('BADGE DESPUES:', await badgeReclamos(pageAdmin));
  console.log('FRAMES:', ws.length ? ws.join(' | ') : 'ninguno');

  await browser.close();
})().catch((e) => {
  console.error('FALLO:', e.message);
  process.exit(1);
});
