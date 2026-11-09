/**
 * Propósito: Página con todas las reseñas de un producto.
 * Contenido: ResenasProducto.
 * Dependencias: react-bootstrap (Alert, Card, Container, Spinner), react-router-dom,
 *               hooks/queries (useProducto, useResenasProducto), ListaResenas,
 *               ResenasProducto.css.
 * Uso: ruta /producto/:id/resenas (pública).
 */

import { Link, useParams } from 'react-router-dom';
import { Alert, Card, Container, Spinner } from 'react-bootstrap';
import { useProducto, useResenasProducto } from '../../hooks/queries';
import ListaResenas from '../../components/cliente/ListaResenas';
import { resolverImagen } from '../../utils/imagenes';
import './ResenasProducto.css';

// El backend acepta hasta 50 por página y cada producto tiene menos que eso,
// así que con este límite se ven todas las opiniones de una.
const LIMITE_OPINIONES = 50;

const ResenasProducto = () => {
  const { id } = useParams();
  const {
    data: producto,
    isPending: cargandoProducto,
    error: errorProducto,
  } = useProducto(id);
  const {
    data: resenas,
    isPending: cargandoResenas,
    error: errorResenas,
  } = useResenasProducto(id, { pagina: 1, limite: LIMITE_OPINIONES });

  const cargando = cargandoProducto || cargandoResenas;
  const error = errorProducto?.message || errorResenas?.message || '';

  if (cargando) {
    return (
      <Container className="py-4 opiniones-producto" role="status" aria-live="polite">
        <span className="visually-hidden">Cargando opiniones…</span>
        <div className="opiniones-producto-cargando">
          <Spinner animation="border" aria-hidden="true" />
        </div>
      </Container>
    );
  }

  if (errorProducto && !producto) {
    return (
      <Container className="py-5 text-center opiniones-producto">
        <Alert variant="danger">
          {errorProducto.message || 'Producto no encontrado.'}
        </Alert>
        <Link to="/cliente/catalogo" className="boton-volver">← Volver al catálogo</Link>
      </Container>
    );
  }

  return (
    <Container className="py-4 opiniones-producto">
      <div className="mb-3">
        <Link to={`/producto/${id}`} className="boton-volver">← Volver al producto</Link>
      </div>

      <Card className="card-comi p-4 mb-4">
        <div className="opiniones-producto-cabecera">
          {producto?.imagen && (
            <img
              src={resolverImagen(producto.imagen)}
              alt={producto.nombre}
              className="opiniones-producto-img"
            />
          )}
          <div>
            <span className="detalle-etiqueta">Opiniones de clientes</span>
            <h1 className="h3 fw-bold mb-1">{producto?.nombre}</h1>
            <p className="text-muted mb-0">
              Todas las reseñas que dejaron los clientes sobre este producto.
            </p>
          </div>
        </div>
      </Card>

      {error && (
        <Alert variant="danger" className="py-2">
          {error}
        </Alert>
      )}

      <Card className="card-comi p-4">
        <ListaResenas datos={resenas} cargando={false} />
      </Card>
    </Container>
  );
};

export default ResenasProducto;
