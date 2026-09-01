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
          <h2>Iniciar Sesión</h2>
          <p>Accede a tu cuenta de cliente</p>
        </div>

        <div className="auth-card-body">
          {error && <Alert variant="warning">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3 auth-input-group">
              <Form.Label>Email</Form.Label>
              <FaEnvelope className="auth-input-ico" aria-hidden="true" />
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@test.com"
              />
            </Form.Group>
            <Form.Group className="mb-3 auth-input-group">
              <Form.Label>Contraseña</Form.Label>
              <FaLock className="auth-input-ico" aria-hidden="true" />
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123456"
              />
            </Form.Group>
            <Button type="submit" className="btn-submit-comirapi w-100 mb-3" disabled={loading}>
              {loading ? 'Ingresando...' : <>
                Iniciar Sesión <FaSignInAlt aria-hidden="true" />
              </>}
            </Button>
          </Form>

          <div className="text-center">
            <p className="mb-1">¿No tienes cuenta? <Link to="/registro" className="auth-enlace">Regístrate aquí</Link></p>
            <p><Link to="/admin-login" className="auth-enlace">Login de administrador</Link></p>
          </div>

          <div className="auth-demo">
            <strong>Demo:</strong> cliente@test.com / 123456
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
