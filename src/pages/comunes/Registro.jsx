/**
 * Propósito: Página de registro para clientes usando Form y Card de Bootstrap.
 * Contenido: Componente Registro con formulario controlado.
 * Dependencias: react-bootstrap (Container, Card, Form, Button, Alert), react-router-dom, useAuth hook.
 * Uso: Ruta "/registro" → <Registro />
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';

const Registro = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
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

    const result = await register({ nombre, email, password });
    if (result.success) {
      navigate('/cliente/inicio');
    } else {
      setError(result.error || 'Error al registrar');
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
      <Card className="shadow" style={{ width: '100%', maxWidth: '420px' }}>
        <Card.Body className="p-4">
          <h2 className="text-center mb-1">Crear Cuenta</h2>
          <p className="text-center text-muted mb-4">Regístrate como cliente</p>

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
                placeholder="tu@email.com"
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
            <Button variant="primary" type="submit" className="w-100 mb-3" disabled={loading}>
              <FaUserPlus className="me-1" aria-hidden="true" />
              {loading ? 'Creando cuenta...' : 'Registrarse'}
            </Button>
          </Form>

          <div className="text-center">
            <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Registro;
