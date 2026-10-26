/**
 * Propósito: Página con todas las reseñas de un producto.
 * Contenido: ResenasProducto.
 * Dependencias: react-bootstrap (Alert, Card, Container, Spinner), react-router-dom,
 *               api/productos, api/resenas, ListaResenas, ResenasProducto.css.
 * Uso: ruta /producto/:id/resenas (pública).
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Alert, Card, Container, Spinner } from 'react-bootstrap';
import { obtenerProductoPorId } from '../../api/productos';
import { obtenerResenasDeProducto } from '../../api/resenas';
import ListaResenas from '../../components/cliente/ListaResenas';
import './ResenasProducto.css';

// El backend acepta hasta 50 por página y cada producto tiene menos que eso,
// así que con este límite se ven todas las opiniones de una.
const LIMITE_OPINIONES = 50;

const ResenasProducto = () => {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const [resenas, setResenas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError('');
    setProducto(null);
    setResenas(null);

    Promise.all([
      obtenerProductoPorId(id),
      obtenerResenasDeProducto(id, { pagina: 1, limite: LIMITE_OPINIONES }),
    ]).then(([resProducto, resResenas]) => {
      if (!vigente) return;
      if (!resProducto.success) {
        setError(resProducto.error || 'Producto no encontrado.');
        setCargando(false);
        return;
      }
      setProducto(resProducto.data);
      if (resResenas.success) {
        setResenas(resResenas.data);
      } else {
        setError(resResenas.error || 'No se pudieron cargar las opiniones.');
      }
      setCargando(false);
    });

    return () => {
      vigente = false;
    };
  }, [id]);

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

  if (error && !producto) {
    return (
      <Container className="py-5 text-center opiniones-producto">
        <Alert variant="danger">{error}</Alert>
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
              src={producto.imagen}
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
