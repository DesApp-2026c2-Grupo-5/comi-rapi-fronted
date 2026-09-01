/**
 * Propósito: Página del cliente para ver las sucursales disponibles y su sucursal asignada.
 * Contenido: Título "Sucursales disponibles", mensaje de ubicación mock, tarjetas de sucursales
 *            activas con distancia estimada y resaltado de la sucursal asignada (menos pedidos pendientes).
 * Dependencias: react-bootstrap (Container, Row, Col, Card, Badge, Alert, Spinner),
 *               react-router-dom, hooks/useAuth, hooks/useSucursal.
 * Uso: Ruta "/cliente/sucursales" → <SucursalesCercanas />
 */

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import { useSucursal } from '../../hooks/useSucursal';

// Ubicación mock del cliente (MOCK - reemplazar por geolocalización real)
const UBICACION_MOCK = 'Av. Siempre Viva 742, Ciudad';

/**
 * Genera una distancia estimada aleatoria entre 1 y 10 km con un decimal.
 * @returns {string} Distancia formateada, ej: "2.3 km".
 */
const simularDistancia = () => {
  const km = (Math.random() * (10 - 1) + 1).toFixed(1);
  return `${km} km`;
};

const SucursalesCercanas = () => {
  const { isAuthenticated } = useAuth();
  const { sucursalesCercanas, sucursalAsignada, loading, asignarSucursalOptima } = useSucursal();
  // Distancias simuladas por sucursal (se calculan una sola vez al cargar)
  const [distancias, setDistancias] = useState({});

  // Ejecuta la lógica de asignación al entrar a la página y calcula distancias mock
  useEffect(() => {
    if (isAuthenticated) {
      asignarSucursalOptima();
    }
  }, [isAuthenticated, asignarSucursalOptima]);

  // Calcula las distancias simuladas para las sucursales activas
  useEffect(() => {
    if (sucursalesCercanas.length > 0) {
      const nuevasDistancias = {};
      sucursalesCercanas.forEach((s) => {
        nuevasDistancias[s.id] = simularDistancia();
      });
      setDistancias(nuevasDistancias);
    }
  }, [sucursalesCercanas]);

  // Si el usuario no está logueado, mostrar mensaje de acceso
  if (!isAuthenticated) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">Inicia sesión para ver las sucursales cercanas.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-1">Sucursales disponibles</h2>
      <p className="text-muted mb-4">
        {/* MOCK - la ubicación proviene de datos simulados */}
        Tu ubicación: {UBICACION_MOCK}
      </p>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : sucursalesCercanas.length === 0 ? (
        <Alert variant="info">No hay sucursales activas disponibles en este momento.</Alert>
      ) : (
        <Row>
          {sucursalesCercanas.map((sucursal) => {
            const esAsignada = sucursalAsignada?.id === sucursal.id;
            return (
              <Col key={sucursal.id} md={6} lg={4} className="mb-4">
                <Card className={`shadow-sm h-100 ${esAsignada ? 'border-warning' : ''}`}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="mb-0">{sucursal.nombre}</Card.Title>
                      {esAsignada && <Badge bg="warning" text="dark">Tu sucursal</Badge>}
                    </div>
                    <Card.Text className="text-muted mb-1">
                      <strong>Dirección:</strong> {sucursal.direccion}
                    </Card.Text>
                    <Card.Text className="text-muted mb-1">
                      <strong>Distancia estimada:</strong> {distancias[sucursal.id] || 'Calculando...'}
                    </Card.Text>
                    <Card.Text className="text-muted mb-1">
                      <strong>Teléfono:</strong> {sucursal.telefono || '-'}
                    </Card.Text>
                    <Card.Text className="text-muted mb-0">
                      <strong>Horario:</strong> {sucursal.horario || '-'}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {sucursalAsignada && (
        <Alert variant="warning" className="mt-2">
          <strong>Sucursal asignada:</strong> {sucursalAsignada.nombre} - {sucursalAsignada.direccion}.
          Se asignó por tener menos pedidos pendientes (simulado).
        </Alert>
      )}
    </Container>
  );
};

export default SucursalesCercanas;