/**
 * Propósito: Página de login para administradores usando Form y Card de Bootstrap.
 * Contenido: Componente AdminLogin con formulario controlado.
 * Dependencias: react-bootstrap (Container, Card, Form, Button, Alert), react-router-dom, useAuth hook.
 * Uso: Ruta "/admin-login" → <AdminLogin />
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginAdministrador, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    const result = await loginAdministrador(email, password);
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
      <Card className="shadow" style={{ width: '100%', maxWidth: '420px' }}>
        <Card.Body className="p-4">
          <h2 className="text-center mb-1">Login Administrador</h2>
          <p className="text-center text-muted mb-4">Accede al panel de administración</p>

          {error && <Alert variant="warning">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@test.com"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="123456"
              />
            </Form.Group>
            <Button variant="danger" type="submit" className="w-100 mb-3" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar Sesión'}
            </Button>
          </Form>

          <div className="text-center">
            <p className="mb-1">¿No tienes cuenta? <Link to="/admin-registro">Regístrate aquí</Link></p>
            <p><Link to="/login">Login de cliente</Link></p>
          </div>

          <Alert variant="info" className="mt-3 mb-0 text-center small">
            <strong>Demo:</strong> admin@test.com / 123456
          </Alert>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminLogin;
