/**
 * Propósito: Página de historial de pedidos del cliente con estado destacado.
 * Contenido: Componente MisPedidos con cards de pedidos (número, fecha, total, sucursal, estado).
 * Dependencias: react-bootstrap (Container, Card, Badge, Button), react-router-dom,
 *               hooks/usePedidos, hooks/useAuth, utils/constants.js, utils/formatters.js.
 * Uso: Ruta "/cliente/mis-pedidos" → <MisPedidos />
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Badge, Button } from 'react-bootstrap';
import { FaUtensils, FaEye } from 'react-icons/fa';
import { usePedidos } from '../../hooks/usePedidos';
import { useAuth } from '../../hooks/useAuth';
import { ETIQUETAS_ESTADO_PEDIDO, VARIANTE_ESTADO_PEDIDO } from '../../utils/constants';
import { formatPrice, formatDate } from '../../utils/formatters';
import IconoEstado from '../../components/comunes/IconoEstado';

const MisPedidos = () => {
  const { pedidos } = usePedidos();
  const { user } = useAuth();

  // Solo los pedidos del cliente logueado (MOCK - el email identifica al cliente)
  const misPedidos = pedidos.filter((p) => p.cliente === user?.email);

  return (
    <Container className="py-4">
      <h1 className="mb-4">Mis Pedidos</h1>

      {misPedidos.length === 0 ? (
        <Card className="shadow-sm text-center p-5">
          <h4 className="fw-bold mb-2">Todavía no tenés pedidos</h4>
          <p className="text-muted mb-4">¡Hacé tu primer pedido y seguí su estado acá!</p>
          <div>
            <Link to="/cliente/catalogo">
              <Button variant="primary" className="rounded-pill px-4">
                  <FaUtensils aria-hidden="true" />
                  Ir al catálogo
                </Button>
            </Link>
          </div>
        </Card>
      ) : (
        misPedidos.map((pedido) => {
          const estadoLabel = ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || pedido.estado;
          return (
            <Card key={pedido.id} className="mb-3 shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <strong>Pedido #{pedido.id}</strong>
                <Badge
                  bg={VARIANTE_ESTADO_PEDIDO[pedido.estado] || 'secondary'}
                  className="d-inline-flex align-items-center gap-1"
                >
                  <IconoEstado estado={pedido.estado} size={15} />
                  {estadoLabel}
                </Badge>
              </Card.Header>
              <Card.Body>
                <p className="mb-1"><strong>Fecha:</strong> {formatDate(pedido.fecha)}</p>
                <p className="mb-1"><strong>Productos:</strong> {pedido.productos.map((p) => p.nombre).join(', ')}</p>
                <p className="mb-1"><strong>Total:</strong> {formatPrice(pedido.total)}</p>
                <p className="mb-2">
                  <strong>Sucursal:</strong>{' '}
                  {pedido.sucursal?.nombre || pedido.sucursal || '-'}
                </p>
                <Link to={`/cliente/pedido/${pedido.id}`}>
                  <Button variant="outline-secondary" size="sm">
                  <FaEye aria-hidden="true" />
                  Ver detalle
                </Button>
                </Link>
              </Card.Body>
            </Card>
          );
        })
      )}
    </Container>
  );
};

export default MisPedidos;