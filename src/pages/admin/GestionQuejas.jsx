/**
 * Propósito: Página de gestión de reclamos sobre pedidos entregados.
 * Contenido: Componente GestionQuejas con Container de Bootstrap y BandejaQuejas.
 * Dependencias: react-bootstrap (Container), BandejaQuejas.
 * Uso: Ruta "/admin/quejas" → <GestionQuejas />
 */

import { Container } from 'react-bootstrap';
import BandejaQuejas from '../../components/admin/BandejaQuejas';

const GestionQuejas = () => (
  <Container fluid className="py-3 py-lg-4 gestion-quejas-pagina">
    <BandejaQuejas />
  </Container>
);

export default GestionQuejas;
