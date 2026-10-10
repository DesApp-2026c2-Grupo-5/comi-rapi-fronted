import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaArrowRight } from 'react-icons/fa';
import PropTypes from 'prop-types';
import './PromocionCard.css';

const PromocionCard = ({ promocion }) => {
  const esDosPorUno = promocion.tipo === 'DOS_POR_UNO';
  const badge = esDosPorUno ? '2x1' : `-${Number(promocion.valor)}%`;

  return (
    <Card className="promocion-card h-100">
      <Badge className="promocion-badge" bg="danger">
        {badge}
      </Badge>
      <Card.Body className="d-flex flex-column p-4">
        <Card.Title as="h3" className="promocion-nombre">
          {promocion.nombre}
        </Card.Title>
        {promocion.descripcion && (
          <Card.Text className="text-muted flex-grow-1 promocion-descripcion">
            {promocion.descripcion}
          </Card.Text>
        )}
        <Button
          as={Link}
          to={`/cliente/catalogo?promocion=${promocion.id}`}
          className="promocion-boton align-self-start d-inline-flex align-items-center gap-2"
        >
          Aprovechar
          <FaArrowRight aria-hidden="true" />
        </Button>
      </Card.Body>
    </Card>
  );
};

export default PromocionCard;

PromocionCard.propTypes = {
  promocion: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nombre: PropTypes.string.isRequired,
    descripcion: PropTypes.string,
    tipo: PropTypes.string.isRequired,
    valor: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};
