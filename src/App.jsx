/**
 * Propósito: Componente principal de la aplicación que configura Router y Contextos.
 * Contenido: Función App que envuelve la app con AuthProvider, CarritoProvider, SucursalProvider y BrowserRouter.
 * Dependencias: react-router-dom, context/AuthContext, context/CarritoContext, context/SucursalContext, routes/AppRoutes, Navbar, Footer.
 * Uso: Se renderiza en main.jsx como componente raíz.
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { NotificacionProvider } from './context/NotificacionContext';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import { SucursalProvider } from './context/SucursalContext';
import { PedidoProvider } from './context/PedidoContext';
import { DireccionProvider } from './context/DireccionContext';
import { PersonalizacionProvider } from './context/PersonalizacionContext';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/comunes/Navbar';
import Footer from './components/comunes/Footer';
import BannersNotificaciones from './components/comunes/BannersNotificaciones';
import { obtenerEstadoApi } from './api/health';

function App() {
  const [apiConectada, setApiConectada] = useState(null);

  useEffect(() => {
    obtenerEstadoApi().then((resultado) => setApiConectada(resultado.success));
  }, []);

  return (
    <BrowserRouter>
      <NotificacionProvider>
        <AuthProvider>
        <CarritoProvider>
          <SucursalProvider>
            <PedidoProvider>
              <DireccionProvider>
                <PersonalizacionProvider>
                  <div className="d-flex flex-column min-vh-100">
                    <Navbar />
                    <main className="flex-grow-1">
                      <BannersNotificaciones />
                      <AppRoutes />
                    </main>
                    <Footer />
                    {apiConectada !== null && (
                      <div
                        className={`position-fixed bottom-0 end-0 m-3 badge ${apiConectada ? 'bg-success' : 'bg-danger'}`}
                        title={
                          apiConectada ? 'Backend disponible' : 'Backend sin conexión'
                        }
                      >
                        {apiConectada ? 'API conectada' : 'API sin conexión'}
                      </div>
                    )}
                  </div>
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
