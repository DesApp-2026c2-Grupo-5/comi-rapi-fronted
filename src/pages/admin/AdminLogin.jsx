/**
 * Propósito: Página de login del panel de administración (ADMINISTRADOR y
 *            SUPERADMINISTRADOR) con la identidad visual Comi-Rapi.
 * Contenido: Componente AdminLogin con formulario controlado, estilo naranja degradado
 *            (cabecera con marca, inputs con ícono y botón pill) y navegación.
 * Dependencias: react-bootstrap (Form, Button, Alert), react-router-dom, useAuth hook,
 *               react-icons/fa (FaUserShield, FaEnvelope, FaLock, FaRightToBracket), Login.css.
 * Uso: Ruta "/admin-login" → <AdminLogin />
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { FaUserShield, FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import CampoPassword from '../../components/comunes/CampoPassword';
import { destinoPorRol } from '../../components/comunes/ProtectedRoute';
import '../comunes/Login.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginPanelAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    const result = await loginPanelAdmin(email, password);
    if (result.success) {
      navigate(destinoPorRol(result.user));
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="auth-comirapi-bg">
      <div className="auth-card-comirapi">
        <div className="auth-card-header">
          <div className="auth-brand-ico">
            <FaUserShield aria-hidden="true" />
          </div>
          <h1 className="h2">Acceso al panel</h1>
          <p>Administradores y superadministradores</p>
        </div>

        <div className="auth-card-body">
          {error && (
            <Alert variant="warning" role="alert" aria-live="polite">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3 auth-input-group" controlId="admin-login-email">
              <Form.Label>Email</Form.Label>
              <FaEnvelope className="auth-input-ico" aria-hidden="true" />
              <Form.Control
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com…"
                autoComplete="email"
                spellCheck={false}
                required
              />
            </Form.Group>
            {/* Se reutiliza CampoPassword en vez de un input suelto: así el ojo de
                mostrar/ocultar y su etiqueta accesible son los mismos que en el
                login de cliente. */}
            <CampoPassword
              id="admin-password"
              name="password"
              etiqueta="Contraseña"
              requerido={false}
              className="mb-3 auth-input-group"
              icono={<FaLock aria-hidden="true" />}
              claseIcono="auth-input-ico"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="btn-submit-comirapi w-100 mb-3" disabled={loading}>
              {loading ? 'Ingresando…' : (
                <>
                  Iniciar Sesión <FaSignInAlt aria-hidden="true" />
                </>
              )}
            </Button>
          </Form>

          <div className="text-center">
            {/* El alta de administradores ya no es pública: la realiza un
                superadministrador desde el panel de administración. */}
            <p className="mb-0">
              <Link to="/login" className="auth-enlace">
                Login de cliente
              </Link>
            </p>
          </div>

          <p className="auth-demo mb-0">
            <strong>Demo:</strong> <span translate="no">admin@test.com</span> /{' '}
            <span translate="no">123456</span> · <span translate="no">superadmin@test.com</span> /{' '}
            <span translate="no">123456</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
