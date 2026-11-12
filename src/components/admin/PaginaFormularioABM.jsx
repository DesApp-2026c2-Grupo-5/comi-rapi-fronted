import PropTypes from 'prop-types';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './FormularioABM.css';

const PaginaFormularioABM = ({
  titulo,
  descripcion,
  volverA,
  volverTexto = 'Volver',
  acciones,
  children,
  aside,
}) => (
  <Container fluid className="abm-page py-4">
    <div className="abm-page-header">
      {volverA && (
        <Link to={volverA} className="abm-page-volver">
          <FaArrowLeft aria-hidden="true" />
          {volverTexto}
        </Link>
      )}
      <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap">
        <div>
          <h1 className="abm-page-titulo">{titulo}</h1>
          {descripcion && <p className="abm-page-descripcion">{descripcion}</p>}
        </div>
        {acciones && <div className="abm-page-acciones">{acciones}</div>}
      </div>
    </div>

    <div
      className={`abm-page-contenido${
        aside ? ' abm-page-contenido--dos-columnas' : ''
      }`}
    >
      <div className="abm-page-principal">{children}</div>
      {aside && <aside className="abm-page-aside">{aside}</aside>}
    </div>
  </Container>
);

PaginaFormularioABM.propTypes = {
  titulo: PropTypes.node.isRequired,
  descripcion: PropTypes.node,
  volverA: PropTypes.string,
  volverTexto: PropTypes.string,
  acciones: PropTypes.node,
  children: PropTypes.node,
  aside: PropTypes.node,
};

export default PaginaFormularioABM;
