/**
 * Propósito: Página para solicitar el enlace de recuperación de contraseña.
 * Contenido: Componente RecuperarPassword con formulario controlado, estado
 *            (email/enviando/enviado/error) y navegación de vuelta al login.
 * Dependencias: react-bootstrap (Form, Button, Alert), react-router-dom, react-icons/fa,
 *               api/auth.js (solicitarRecuperacion), Login.css.
 * Uso: Ruta "/forgot-password" → <RecuperarPassword />
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { FaHamburger, FaEnvelope, FaPaperPlane } from 'react-icons/fa';
import { solicitarRecuperacion } from '../../api/auth';
import './Login.css';

const RecuperarPassword = () => {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Por favor ingresá tu email.');
      return;
    }

    setEnviando(true);
    const result = await solicitarRecuperacion(email);
    setEnviando(false);

    if (result.success) {
      // El backend responde igual exista o no la cuenta, así que acá no se puede
      // ni se debe informar si el email estaba registrado.
      setEnviado(true);
    } else {
      setError(result.error || 'No se pudo completar la solicitud');
    }
  };

  return (
    <div className="auth-comirapi-bg">
      <div className="auth-card-comirapi">
        <div className="auth-card-header">
          <div className="auth-brand-ico">
            <FaHamburger aria-hidden="true" />
          </div>
          <h1 className="h2">Recuperar contraseña</h1>
          <p>Ingresá tu email y te enviamos un enlace para restablecerla</p>
        </div>

        <div className="auth-card-body">
          {enviado ? (
            <>
              {/* El mensaje es deliberadamente indistinto a propósito (el backend
                  no revela si la cuenta existe), así que va como `status`: es una
                  confirmación de envío, no un error. */}
              <Alert variant="success" role="status" aria-live="polite">
                Si existe una cuenta asociada al email, recibirás un enlace para
                recuperar tu contraseña. Revisá tu bandeja de entrada.
              </Alert>
              <p className="text-center mb-0">
                <Link to="/login" className="auth-enlace">
                  Volver al inicio de sesión
                </Link>
              </p>
            </>
          ) : (
            <>
              {error && (
                <Alert variant="warning" role="alert" aria-live="polite">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit} noValidate>
                <Form.Group className="mb-3 auth-input-group" controlId="recuperar-email">
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

                <Button
                  type="submit"
                  className="btn-submit-comirapi w-100 mb-3"
                  disabled={enviando}
                >
                  {enviando ? 'Enviando…' : (
                    <>
                      Enviar enlace <FaPaperPlane aria-hidden="true" />
                    </>
                  )}
                </Button>
              </Form>

              <p className="text-center mb-0">
                <Link to="/login" className="auth-enlace">
                  Volver al inicio de sesión
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecuperarPassword;
