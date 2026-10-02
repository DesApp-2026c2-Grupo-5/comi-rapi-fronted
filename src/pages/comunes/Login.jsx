/**
 * Propósito: Página de login para clientes con la identidad visual Comi-Rapi.
 * Contenido: Componente Login con formulario controlado, estilo naranja degradado
 *            (cabecera con marca, inputs con ícono y botón pill) y navegación.
 * Dependencias: react-bootstrap (Form, Button, Alert), react-router-dom, useAuth hook,
 *               react-icons/fa (FaHamburger, FaEnvelope, FaLock, FaRightToBracket), Login.css.
 * Uso: Ruta "/login" → <Login />
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { FaHamburger, FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import CampoPassword from '../../components/comunes/CampoPassword';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      navigate('/cliente/inicio');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="auth-comirapi-bg">
      <div className="auth-card-comirapi">
        <div className="auth-card-header">
          <div className="auth-brand-ico">
            <FaHamburger aria-hidden="true" />
          </div>
          <h1 className="h2">Iniciar Sesión</h1>
          <p>Accede a tu cuenta de cliente</p>
        </div>

        <div className="auth-card-body">
          {/* `aria-live` para que el error se anuncie al aparecer: sin esto, quien
              navega con lector de pantalla no se entera del fallo. */}
          {error && (
            <Alert variant="warning" role="alert" aria-live="polite">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3 auth-input-group" controlId="login-email">
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
            <CampoPassword
              id="password"
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
            <p className="mb-1">
              <Link to="/forgot-password" className="auth-enlace">
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
            <p className="mb-1">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="auth-enlace">
                Regístrate aquí
              </Link>
            </p>
            <p className="mb-0">
              <Link to="/admin-login" className="auth-enlace">
                Login de administrador
              </Link>
            </p>
          </div>

          {/* Credenciales de prueba. `aria-label` las anuncia como ejemplo y no
              como un dato real de la cuenta del usuario. */}
          <p className="auth-demo mb-0">
            <strong>Demo:</strong> <span translate="no">cliente@test.com</span> /{' '}
            <span translate="no">123456</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
