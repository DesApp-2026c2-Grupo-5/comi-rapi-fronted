/**
 * Propósito: Página de gestión de pedidos que renderiza PedidosPendientes.
 * Contenido: Componente GestionPedidos con Container de Bootstrap.
 * Dependencias: react-bootstrap (Container), PedidosPendientes.
 * Uso: Ruta "/admin/pedidos" → <GestionPedidos />
 */

import React from 'react';
import { Container } from 'react-bootstrap';
import PedidosPendientes from '../../components/admin/PedidosPendientes';

const GestionPedidos = () => {
  return (
    <Container fluid className="py-4">
      <PedidosPendientes />
    </Container>
  );
};

export default GestionPedidos;
