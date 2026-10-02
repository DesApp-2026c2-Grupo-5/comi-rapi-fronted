/**
 * Propósito: Página de registro para administradores usando Form y Card de Bootstrap.
 * Contenido: Componente AdminRegister con formulario controlado.
 * Dependencias: react-bootstrap (Container, Card, Form, Button, Alert), react-router-dom, useAuth hook.
 * Uso: Ruta "/admin-registro" → <AdminRegister />
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import CampoPassword from '../../components/comunes/CampoPassword';
import '../comunes/Registro.css';

const AdminRegister = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { registerAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nombre || !email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const result = await registerAdmin({ nombre, email, password });
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.error || 'Error al registrar');
    }
  };

  return (
    <Container className="registro-wrap">
      <Card className="shadow registro-card">
        <Card.Body className="p-4">
          <h1 className="h2 text-center mb-1">Crear Cuenta Admin</h1>
          <p className="text-center text-muted mb-4">Regístrate como administrador</p>

          {error && (
            <Alert variant="warning" role="alert" aria-live="polite">
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-3" controlId="admin-registro-nombre">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre completo"
                autoComplete="name"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="admin-registro-email">
              <Form.Label>Email</Form.Label>
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
              id="admin-password"
              name="password"
              etiqueta="Contraseña"
              className="mb-3"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              ayuda="Mínimo 6 caracteres."
            />
            <Button variant="primary" type="submit" className="w-100 mb-3" disabled={loading}>
              <FaUserPlus className="me-1" aria-hidden="true" />
              {loading ? 'Creando cuenta…' : 'Registrarse'}
            </Button>
          </Form>

          <p className="text-center mb-0">
            ¿Ya tienes cuenta? <Link to="/admin-login">Inicia sesión</Link>
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminRegister;
