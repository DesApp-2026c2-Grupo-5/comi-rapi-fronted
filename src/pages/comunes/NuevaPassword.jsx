/**
 * Propósito: Página para establecer una contraseña nueva desde el enlace de recuperación.
 * Contenido: Componente NuevaPassword que lee el token de la query string, valida
 *            coincidencia y mínimo de caracteres, y reporta éxito o error.
 * Dependencias: react-bootstrap (Form, Button, Alert), react-router-dom (useSearchParams,
 *               useNavigate), react-icons/fa, api/auth.js (restablecerPassword), Login.css.
 * Uso: Ruta "/reset-password" → <NuevaPassword />, con ?token=... en la URL.
 *      La ruta debe coincidir con el enlace que arma email_service.js
 *      (`${FRONTEND_URL}/reset-password?token=...`).
 */

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Button, Alert } from 'react-bootstrap';
import { FaHamburger, FaLock, FaCheckCircle } from 'react-icons/fa';
import { restablecerPassword } from '../../api/auth';
import CampoPassword from '../../components/comunes/CampoPassword';
import './Login.css';

const MINIMO = 6;

const NuevaPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < MINIMO) {
      setError(`La contraseña debe tener al menos ${MINIMO} caracteres.`);
      return;
    }

    setEnviando(true);
    const result = await restablecerPassword(token, password, confirmPassword);
    setEnviando(false);

    if (result.success) {
      setExito(true);
      // Se deja una pausa para que el usuario lea la confirmación antes de
      // salir de la pantalla; el token ya fue consumido en el backend.
      setTimeout(() => navigate('/login'), 2500);
    } else {
      // Un solo mensaje para todos los fallos de token: el backend no revela si
      // expiró, ya se usó o nunca existió, y el frontend tampoco lo adivina.
      setError(result.error || 'El enlace de recuperación no es válido o ya expiró.');
    }
  };

  if (!token) {
    return (
      <div className="auth-comirapi-bg">
        <div className="auth-card-comirapi">
          <div className="auth-card-header">
            <div className="auth-brand-ico">
              <FaHamburger aria-hidden="true" />
            </div>
            <h1 className="h2">Nueva contraseña</h1>
          </div>
          <div className="auth-card-body">
            <Alert variant="warning">
              El enlace de recuperación no es válido o ya expiró.
            </Alert>
            <p className="text-center mb-0">
              <Link to="/forgot-password" className="auth-enlace">
                Pedir un enlace nuevo
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-comirapi-bg">
      <div className="auth-card-comirapi">
        <div className="auth-card-header">
          <div className="auth-brand-ico">
            <FaHamburger aria-hidden="true" />
          </div>
          <h1 className="h2">Nueva contraseña</h1>
          <p>Elegí la contraseña con la que vas a entrar</p>
        </div>

        <div className="auth-card-body">
          {/* `role="status"` + `aria-live`: la redirección automática no se
              anuncia sola, y sin esto quien no ve la pantalla pierde el cambio. */}
          {exito ? (
            <Alert variant="success" role="status" aria-live="polite">
              <FaCheckCircle aria-hidden="true" /> Tu contraseña fue actualizada.
              Redirigiendo al inicio de sesión…
            </Alert>
          ) : (
            <>
              {error && (
                <Alert variant="warning" role="alert" aria-live="polite">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit} noValidate>
                <CampoPassword
                  id="passwordNueva"
                  name="password"
                  etiqueta="Contraseña nueva"
                  requerido={false}
                  className="mb-3 auth-input-group"
                  icono={<FaLock aria-hidden="true" />}
                  claseIcono="auth-input-ico"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  ayuda={`Mínimo ${MINIMO} caracteres.`}
                  autoComplete="new-password"
                />

                <CampoPassword
                  id="passwordRepetida"
                  name="password-repetida"
                  etiqueta="Repetir contraseña"
                  requerido={false}
                  className="mb-3 auth-input-group"
                  icono={<FaLock aria-hidden="true" />}
                  claseIcono="auth-input-ico"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={
                    confirmPassword && password !== confirmPassword
                      ? 'Las contraseñas no coinciden.'
                      : null
                  }
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  className="btn-submit-comirapi w-100 mb-3"
                  disabled={enviando}
                >
                  {enviando ? 'Guardando…' : 'Guardar contraseña'}
                </Button>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NuevaPassword;
