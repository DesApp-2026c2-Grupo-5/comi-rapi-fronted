/**
 * Propósito: Componente principal de la aplicación que configura Router y Contextos.
 * Contenido: Función App que envuelve la app con AuthProvider, CarritoProvider, SucursalProvider y BrowserRouter.
 * Dependencias: react-router-dom, context/AuthContext, context/CarritoContext, context/SucursalContext, routes/AppRoutes, Navbar, Footer.
 * Uso: Se renderiza en main.jsx como componente raíz.
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import { SucursalProvider } from './context/SucursalContext';
import AppRoutes from './routes/AppRoutes';
import Navbar from './components/comunes/Navbar';
import Footer from './components/comunes/Footer';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CarritoProvider>
          <SucursalProvider>
            <div className="d-flex flex-column min-vh-100">
              <Navbar />
              <main className="flex-grow-1">
                <AppRoutes />
              </main>
              <Footer />
            </div>
          </SucursalProvider>
        </CarritoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
