/**
 * Propósito: Página de registro para administradores usando Form y Card de Bootstrap.
 * Contenido: Componente AdminRegister con formulario controlado.
 * Dependencias: react-bootstrap (Container, Card, Form, Button, Alert), react-router-dom, useAuth hook.
 * Uso: Ruta "/admin-registro" → <AdminRegister />
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';

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
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
      <Card className="shadow" style={{ width: '100%', maxWidth: '420px' }}>
        <Card.Body className="p-4">
          <h2 className="text-center mb-1">Crear Cuenta Admin</h2>
          <p className="text-center text-muted mb-4">Regístrate como administrador</p>

          {error && <Alert variant="warning">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre completo"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@email.com"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </Form.Group>
            <Button variant="danger" type="submit" className="w-100 mb-3" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </Button>
          </Form>

          <div className="text-center">
            <p>¿Ya tienes cuenta? <Link to="/admin-login">Inicia sesión</Link></p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminRegister;
