/**
 * Propósito: Página de catálogo con filtro por categoría y grid de productos reales.
 * Contenido: Componente Catalogo con datos obtenidos de la API, filtros tipo pill,
 *            búsqueda por nombre, rango de precio y grid responsive de ProductoCard.
 * Dependencias: react-bootstrap (Container, Button, Row, Col, Alert, Form, Spinner),
 *               api/productos.js, api/categorias.js, ProductoCard, Catalogo.css, react-router-dom.
 * Uso: Ruta "/cliente/catalogo" → <Catalogo />
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Button, Row, Col, Alert, Form, Spinner } from 'react-bootstrap';
import { obtenerProductos } from '../../api/productos';
import { obtenerCategorias } from '../../api/categorias';
import ProductoCard from '../../components/cliente/ProductoCard';
import './Catalogo.css';

const Catalogo = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [borrador, setBorrador] = useState({ precioMin: null, precioMax: null });
  const [campoInvalido, setCampoInvalido] = useState(null);

  useEffect(() => {
    Promise.all([obtenerProductos(), obtenerCategorias()]).then(
      ([resultadoProductos, resultadoCategorias]) => {
        if (resultadoProductos.success) {
          setProductos(resultadoProductos.data);
        } else {
          setError(resultadoProductos.error || 'No se pudieron cargar los productos.');
        }
        if (resultadoCategorias.success) {
          setCategorias(resultadoCategorias.data);
        }
        setCargando(false);
      }
    );
  }, []);

  const filtros = ['Todos', ...categorias.map((c) => c.nombre)];

  const categoriaParam = searchParams.get('categoria');
  const categoriaSeleccionada =
    categoriaParam && categorias.some((c) => c.nombre === categoriaParam)
      ? categoriaParam
      : 'Todos';

  const busqueda = searchParams.get('busqueda') || '';
  const precioMin = searchParams.get('precioMin') || '';
  const precioMax = searchParams.get('precioMax') || '';

  const productosFiltrados = useMemo(() => {
    const min = precioMin !== '' ? Number(precioMin) : null;
    const max = precioMax !== '' ? Number(precioMax) : null;

    return productos.filter((p) => {
      if (categoriaSeleccionada !== 'Todos' && p.categoria !== categoriaSeleccionada) {
        return false;
      }
      if (busqueda && !p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())) {
        return false;
      }
      if (min !== null && !Number.isNaN(min) && p.precio < min) {
        return false;
      }
      if (max !== null && !Number.isNaN(max) && p.precio > max) {
        return false;
      }
      return true;
    });
  }, [categoriaSeleccionada, busqueda, precioMin, precioMax, productos]);

  const seleccionarCategoria = (nombre) => {
    const next = new URLSearchParams(searchParams);
    if (nombre === 'Todos') {
      next.delete('categoria');
    } else {
      next.set('categoria', nombre);
    }
    setSearchParams(next, { replace: true });
  };

  const setParam = (clave, valor) => {
    const next = new URLSearchParams(searchParams);
    if (valor === '') {
      next.delete(clave);
    } else {
      next.set(clave, valor);
    }
    setSearchParams(next, { replace: true });
  };

  const esRangoInvalido = (min, max) =>
    min !== '' && max !== '' &&
    !Number.isNaN(Number(min)) && !Number.isNaN(Number(max)) &&
    Number(min) > Number(max);

  const esNegativo = (valor) => valor !== '' && !Number.isNaN(Number(valor)) && Number(valor) < 0;

  const confirmarPrecio = (clave) => {
    const valor = borrador[clave];
    if (valor === null) return;

    const min = clave === 'precioMin' ? valor.trim() : (searchParams.get('precioMin') || '');
    const max = clave === 'precioMax' ? valor.trim() : (searchParams.get('precioMax') || '');

    const invalido = esNegativo(valor) || esRangoInvalido(min, max);

    if (!invalido) {
      setCampoInvalido(null);
      const next = new URLSearchParams(searchParams);
      if (valor.trim() === '') {
        next.delete(clave);
      } else {
        next.set(clave, valor.trim());
      }
      setSearchParams(next, { replace: true });
    } else {
      setCampoInvalido(clave);
    }

    setBorrador((prev) => ({ ...prev, [clave]: null }));
  };

  if (cargando) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="text-center mb-4">
        <h1 className="catalogo-titulo mb-2">Nuestro Catálogo</h1>
        <p className="text-muted mb-0">Elegí tu favorito y añadilo al carrito.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
        {filtros.map((filtro) => {
          const activo = categoriaSeleccionada === filtro;
          return (
            <Button
              key={filtro}
              className={activo ? 'filtro-pill filtro-activo' : 'filtro-pill filtro-inactivo'}
              onClick={() => seleccionarCategoria(filtro)}
            >
              {filtro}
            </Button>
          );
        })}
      </div>

      <div className="catalogo-busqueda mb-4">
        <Form.Control
          type="search"
          placeholder="Buscar producto por nombre..."
          value={busqueda}
          onChange={(e) => setParam('busqueda', e.target.value)}
          className="mb-2"
        />
        <div className="d-flex gap-2 precio-filtros">
          <div className="precio-grupo">
            <Form.Control
              type="number"
              min="0"
              placeholder="Precio mínimo"
              value={borrador.precioMin ?? precioMin}
              isInvalid={campoInvalido === 'precioMin'}
              onChange={(e) => {
                setBorrador((prev) => ({ ...prev, precioMin: e.target.value }));
                setCampoInvalido(null);
              }}
              onBlur={() => confirmarPrecio('precioMin')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
            />
            <Form.Control.Feedback type="invalid">
              El mínimo no puede ser negativo ni superar al máximo.
            </Form.Control.Feedback>
          </div>
          <div className="precio-grupo">
            <Form.Control
              type="number"
              min="0"
              placeholder="Precio máximo"
              value={borrador.precioMax ?? precioMax}
              isInvalid={campoInvalido === 'precioMax'}
              onChange={(e) => {
                setBorrador((prev) => ({ ...prev, precioMax: e.target.value }));
                setCampoInvalido(null);
              }}
              onBlur={() => confirmarPrecio('precioMax')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
            />
            <Form.Control.Feedback type="invalid">
              El máximo no puede ser negativo ni menor al mínimo.
            </Form.Control.Feedback>
          </div>
        </div>
      </div>

      <Row className="justify-content-center">
        {productosFiltrados.map((producto) => (
          <Col key={producto.id} md={4} lg={3} className="mb-4">
            <ProductoCard producto={producto} />
          </Col>
        ))}
      </Row>

      {productosFiltrados.length === 0 && (
        <div className="text-center">
          <Alert variant="light" className="cat-aviso d-inline-block">
            No hay productos que coincidan con los filtros.
          </Alert>
        </div>
      )}
    </Container>
  );
};

export default Catalogo;