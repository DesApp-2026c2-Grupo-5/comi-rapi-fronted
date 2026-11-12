/**
 * Verificación funcional: ¿Socket.IO conserva listeners tras reconexión?
 * 
 * Uso: node scripts/check-listeners-reconnection.js
 * Requiere: backend en :3000, frontend en :5173
 */

import { chromium } from 'playwright-core';

const FRONT = process.env.WS_TEST_FRONT || 'http://localhost:5173';
const API = process.env.WS_TEST_API || 'http://localhost:3000';

const COOKIE_SESION = 'comirapi.sid';
const CSRF_COOKIE = 'csrf-token';

async function getSessionCookie(role) {
  const creds = {
    SUPERADMINISTRADOR: { email: 'ws-test@test.com', password: '123456' },
    ADMINISTRADOR: { email: 'ws-ui-admin@test.com', password: '123456' },
    CLIENTE: { email: 'ws-ui-cliente@test.com', password: '123456' },
  };
  const { email, password } = creds[role];
  
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!data.success) throw new Error(`Login failed: ${data.error}`);
  
  const cookies = res.headers.get('set-cookie') || '';
  const match = cookies.match(new RegExp(`${COOKIE_SESION}=([^;]+)`));
  return match ? match[1] : null;
}

/**
 * Obtiene el número de listeners de 'catalogo_actualizado' en el socket actual
 */
async function getListenerCount(page) {
  return await page.evaluate(() => {
    const socket = window.__getSocketInstance?.();
    if (!socket) return -1; // socket no disponible
    return socket.listeners('catalogo_actualizado').length;
  });
}

/**
 * Fuerza reconexión automática cerrando el engine
 */
async function forceAutoReconnect(page) {
  return await page.evaluate(() => {
    const socket = window.__getSocketInstance?.();
    if (socket && socket.io?.engine) {
      socket.io.engine.close();
      return true;
    }
    return false;
  });
}

/**
 * Simula forzarReconexion(): disconnect() + connect() en misma instancia
 */
async function forceManualReconnect(page) {
  return await page.evaluate(() => {
    const socket = window.__getSocketInstance?.();
    if (socket) {
      socket.disconnect();
      socket.connect();
      return true;
    }
    return false;
  });
}

/**
 * Edita un producto via API para generar evento CATALOGO_ACTUALIZADO
 */
async function triggerCatalogEvent(API, sid, csrfToken) {
  const prodRes = await fetch(`${API}/productos`);
  const prodData = await prodRes.json();
  if (!prodData.success || !prodData.data.length) return null;
  
  const testProd = prodData.data[0];
  const originalName = testProd.nombre;
  const newName = `${originalName} WS-TEST-${Date.now()}`;
  
  const editRes = await fetch(`${API}/productos/${testProd.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${COOKIE_SESION}=${sid}`,
      'x-csrf-token': csrfToken
    },
    body: JSON.stringify({ nombre: newName })
  });
  
  return { success: editRes.ok, productId: testProd.id, originalName, newName };
}

/**
 * Restaura el nombre original del producto
 */
async function restoreProductName(API, sid, csrfToken, productId, originalName) {
  await fetch(`${API}/productos/${productId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${COOKIE_SESION}=${sid}`,
      'x-csrf-token': csrfToken
    },
    body: JSON.stringify({ nombre: originalName })
  });
}

async function runTest() {
  console.log('\n=== Verificación de persistencia de listeners Socket.IO ===\n');
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    for (const role of ['INVITADO', 'SUPERADMINISTRADOR']) {
      console.log(`\n--- ${role} ---`);
      
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // Capturar logs del navegador
      page.on('console', msg => {
        if (msg.type() === 'log' && msg.text().includes('[DIAG]')) {
          console.log(`  [BROWSER ${role}] ${msg.text()}`);
        }
      });
      
      if (role !== 'INVITADO') {
        const sid = await getSessionCookie('SUPERADMINISTRADOR');
        if (sid) {
          await context.addCookies([
            { name: COOKIE_SESION, value: sid, domain: 'localhost', path: '/' },
            { name: CSRF_COOKIE, value: 'test', domain: 'localhost', path: '/' }
          ]);
        }
      }
      
      console.log(`[${role}] Cargando /cliente/catalogo...`);
      await page.goto(`${FRONT}/cliente/catalogo`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      // 1. Listeners iniciales
      const initialCount = await getListenerCount(page);
      console.log(`[${role}] Listeners iniciales CATALOGO_ACTUALIZADO: ${initialCount}`);
      
      if (initialCount === 0) {
        console.log(`[${role}] ❌ PROBLEMA: No hay listeners registrados inicialmente`);
      } else {
        console.log(`[${role}] ✅ Listeners registrados correctamente`);
      }
      
      // 2. Reconexión AUTOMÁTICA (engine.close)
      console.log(`[${role}] Forzando reconexión AUTOMÁTICA (engine.close)...`);
      await forceAutoReconnect(page);
      await page.waitForTimeout(5000);
      
      const afterAutoCount = await getListenerCount(page);
      console.log(`[${role}] Listeners tras reconexión AUTOMÁTICA: ${afterAutoCount}`);
      
      if (afterAutoCount === initialCount && afterAutoCount > 0) {
        console.log(`[${role}] ✅ Handler persistió tras reconexión automática`);
      } else if (afterAutoCount === 0) {
        console.log(`[${role}] ❌ PROBLEMA: Handler perdido tras reconexión automática`);
      } else {
        console.log(`[${role}] ⚠️ Listeners cambiaron: ${initialCount} -> ${afterAutoCount}`);
      }
      
      // 3. Reconexión MANUAL (forzarReconexion: disconnect + connect)
      console.log(`[${role}] Simulando forzarReconexion (disconnect + connect)...`);
      await forceManualReconnect(page);
      await page.waitForTimeout(5000);
      
      const afterManualCount = await getListenerCount(page);
      console.log(`[${role}] Listeners tras forzarReconexion: ${afterManualCount}`);
      
      if (afterManualCount === initialCount && afterManualCount > 0) {
        console.log(`[${role}] ✅ Handler persistió tras forzarReconexion`);
      } else if (afterManualCount === 0) {
        console.log(`[${role}] ❌ PROBLEMA: Handler perdido tras forzarReconexion`);
      } else {
        console.log(`[${role}] ⚠️ Listeners cambiaron: ${initialCount} -> ${afterManualCount}`);
      }
      
      // 4. Probar evento REAL (solo SUPERADMIN puede editar)
      if (role === 'SUPERADMINISTRADOR') {
        console.log(`[${role}] Probando evento real CATALOGO_ACTUALIZADO...`);
        
        const sid = await getSessionCookie('SUPERADMINISTRADOR');
        if (sid) {
          // Obtener CSRF token
          const csrfRes = await fetch(`${API}/auth/csrf-token`, {
            credentials: 'include',
            headers: { 'Cookie': `${COOKIE_SESION}=${sid}` }
          });
          const csrfData = await csrfRes.json();
          const csrfToken = csrfData.data?.csrfToken || '';
          
          const eventResult = await triggerCatalogEvent(API, sid, csrfToken);
          
          if (eventResult?.success) {
            console.log(`[${role}] Edición API OK, esperando evento...`);
            await page.waitForTimeout(3000);
            
            // Verificar UI actualizada
            const uiUpdated = await page.evaluate((name) => {
              return document.body.textContent.includes(name);
            }, eventResult.newName);
            
            console.log(`[${role}] UI actualizada con nuevo nombre: ${uiUpdated ? 'SÍ' : 'NO'}`);
            
            // Restaurar
            await restoreProductName(API, sid, csrfToken, eventResult.productId, eventResult.originalName);
          } else {
            console.log(`[${role}] ❌ No se pudo editar producto para test`);
          }
        }
      }
      
      await context.close();
    }
    
    console.log('\n=== Resumen ===');
    console.log('Si listeners se mantienen > 0 en todas las etapas, el handler persiste correctamente.');
    console.log('Si UI actualizada = SÍ, el flujo completo (backend -> socket -> handler -> cache -> UI) funciona.');
    
  } finally {
    await browser.close();
  }
}

runTest().catch(e => {
  console.error('Error en test:', e);
  process.exit(1);
});