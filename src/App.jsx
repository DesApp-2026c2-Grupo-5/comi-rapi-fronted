/**
 * Propósito: Componente principal de la aplicación que configura Router y Contextos.
 * Contenido: Función App que envuelve la app con AuthProvider, CarritoProvider, SucursalProvider y BrowserRouter.
 * Dependencias: react-router-dom, context/AuthContext, context/CarritoContext, context/SucursalContext, routes/AppRoutes, Navbar, NavInferior, Footer.
 * Uso: Se renderiza en main.jsx como componente raíz.
 */

import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { NotificacionProvider } from './context/NotificacionContext';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import { SucursalProvider } from './context/SucursalContext';
import { PedidoProvider } from './context/PedidoContext';
import { DireccionProvider } from './context/DireccionContext';
import { PersonalizacionProvider } from './context/PersonalizacionContext';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/comunes/Navbar';
import NavInferior from './components/comunes/NavInferior';
import Footer from './components/comunes/Footer';
import BannersNotificaciones from './components/comunes/BannersNotificaciones';
import useMuestraNavInferior from './hooks/useMuestraNavInferior';
import { esRutaDeAdmin } from './utils/rutas';

/**
 * Shell de la aplicación (navbar, contenido, pie y barra inferior).
 *
 * Va en un componente aparte y no dentro de `App` a propósito: necesita saber si
 * el usuario tiene barra inferior, y eso se lee del AuthContext. Como los
 * providers se renderizan en el `return` de `App`, el componente `App` en sí
 * queda por encima de ellos: llamar al hook ahí hace que `useAuth` lance
 * 'debe ser usado dentro de un AuthProvider' y React desmonta el árbol entero
 * (pantalla en blanco). Dentro de `AppLayout` ya está bajo los providers.
 *
 * @returns {JSX.Element} Estructura principal de la aplicación.
 */
function AppLayout() {
  // La barra inferior es fija: sin este padding el último contenido y el pie de
  // página quedan debajo. Va en el shell y no en <main> a propósito, porque el
  // <main> no es el único elemento que la barra tapa.
  const conNavInferior = useMuestraNavInferior();
  const { pathname } = useLocation();
  // El pie es de la tienda (horarios, contacto, redes). En el panel de
  // administración queda abajo de tablas largas sin aportar nada, así que no se
  // muestra: la regla de "/admin" vive en utils/rutas.
  const mostrarFooter = !esRutaDeAdmin(pathname);

  return (
    <div
      className={`d-flex flex-column min-vh-100 app-shell${
        conNavInferior ? ' app-shell-con-nav-inferior' : ''
      }`}
    >
      <Navbar />
      <main id="main" className="flex-grow-1" tabIndex={-1}>
        <BannersNotificaciones />
        <AppRoutes />
      </main>
      {mostrarFooter && <Footer />}
      <NavInferior />
    </div>
  );
}

/**
 * @returns {JSX.Element} Aplicación con Router y todos los providers.
 */
function App() {
  return (
    <BrowserRouter>
      <NotificacionProvider>
        <AuthProvider>
          <CarritoProvider>
            <SucursalProvider>
              <PedidoProvider>
                <DireccionProvider>
                  <PersonalizacionProvider>
                    <AppLayout />
                  </PersonalizacionProvider>
                </DireccionProvider>
              </PedidoProvider>
            </SucursalProvider>
          </CarritoProvider>
        </AuthProvider>
      </NotificacionProvider>
    </BrowserRouter>
  );
}

export default App;
