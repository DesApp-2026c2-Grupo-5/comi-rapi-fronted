/**
 * Propósito: Página de catálogo con filtro por categoría y grid de productos.
 * Contenido: Componente Catalogo con título grande, filtros tipo pill y grid
 *            responsive de ProductoCard.
 * Dependencias: react-bootstrap (Container, Button, Row, Col, Alert), seedData.js,
 *               ProductoCard, Catalogo.css.
 * Uso: Ruta "/cliente/catalogo" → <Catalogo />
 *
 * CAMBIOS REALIZADOS:
 *  - Título grande "Nuestro Catálogo" en tipografía bold oscura.
*  - Filtros de categorías en forma de pills (Hamburguesas, Pizzas, Combos, Papas, Bebidas, Postres).
*  - Las categorías de la home llegan por query param (?categoria=...) y se aplican al instante.
*  - Al elegir una pill también se actualiza el query param (el filtro queda en la URL).
*  - Grid responsive (3 columnas en md, 4 en lg).
*  - Cards con el estilo visual de la home de Comi-Rapi (ver ProductoCard).
*  - Búsqueda por nombre y rango de precio, también persistidos en la URL.
*  - Validación de rango de precio: mínimo no puede ser negativo ni mayor al máximo y viceversa.
* 
*/

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Button, Row, Col, Alert, Form, Spinner } from 'react-bootstrap';
import { obtenerProductos } from '../../api/productos';
import { obtenerCategorias } from '../../api/categorias';
import ProductoCard from '../../components/cliente/ProductoCard';
import './Catalogo.css';

const Catalogo = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [borrador, setBorrador] = useState({ precioMin: null, precioMax: null });
  const [campoInvalido, setCampoInvalido] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError('');
      const [resProductos, resCategorias] = await Promise.all([
        obtenerProductos(),
        obtenerCategorias(),
      ]);
      if (resProductos.success) {
        setProductos(resProductos.data);
      } else {
        setError(resProductos.error || 'No se pudieron cargar los productos.');
      }
      if (resCategorias.success) {
        setCategorias(resCategorias.data);
      }
      setCargando(false);
    };
    cargar();
  }, []);

  // Categoría activa: viene del query param (?categoria=<id>) o por defecto "Todos"
  const categoriaParam = searchParams.get('categoria');
  const categoriaId = categoriaParam ? Number(categoriaParam) : null;
  const categoriaValida = categoriaId !== null && categorias.some((c) => c.id === categoriaId);
  const categoriaSeleccionada = categoriaValida
    ? categorias.find((c) => c.id === categoriaId).nombre
    : 'Todos';

  // Búsqueda por nombre y rango de precio, también persistidos en la URL
  const busqueda = searchParams.get('busqueda') || '';
  const precioMin = searchParams.get('precioMin') || '';
  const precioMax = searchParams.get('precioMax') || '';

  const productosFiltrados = useMemo(() => {
    const min = precioMin !== '' ? Number(precioMin) : null;
    const max = precioMax !== '' ? Number(precioMax) : null;

    return productos.filter((p) => {
      if (categoriaValida && p.categoriaId !== categoriaId) {
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
  }, [productos, categoriaValida, categoriaId, busqueda, precioMin, precioMax]);

  // Elegir categoría desde las pills (sincroniza la URL para que también la home la setee)
  // Conserva los filtros de búsqueda y precio ya presentes en la URL.
  const seleccionarCategoria = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === null) {
      next.delete('categoria');
    } else {
      next.set('categoria', String(id));
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

  // Rango inválido: ambos límites presentes y numéricos, con min > max.
  const esRangoInvalido = (min, max) =>
    min !== '' && max !== '' &&
    !Number.isNaN(Number(min)) && !Number.isNaN(Number(max)) &&
    Number(min) > Number(max);

  // Un precio es inválido si es numérico y negativo.
  const esNegativo = (valor) => valor !== '' && !Number.isNaN(Number(valor)) && Number(valor) < 0;

  // Confirma el borrador al perder foco (o Enter) y sincroniza con searchParams.
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

  return (
    <Container className="py-5">
      {/* Título */}
      <div className="text-center mb-4">
        <h1 className="catalogo-titulo mb-2">Nuestro Catálogo</h1>
        <p className="text-muted mb-0">Elegí tu favorito y añadilo al carrito.</p>
      </div>

      {/* Filtros / categorías en forma de pills */}
      <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
        <Button
          className={categoriaSeleccionada === 'Todos' ? 'filtro-pill filtro-activo' : 'filtro-pill filtro-inactivo'}
          onClick={() => seleccionarCategoria(null)}
        >
          Todos
        </Button>
        {categorias.map((cat) => {
          const activo = categoriaSeleccionada === cat.nombre;
          return (
            <Button
              key={cat.id}
              className={activo ? 'filtro-pill filtro-activo' : 'filtro-pill filtro-inactivo'}
              onClick={() => seleccionarCategoria(cat.id)}
            >
              {cat.nombre}
            </Button>
          );
        })}
      </div>

      {/* Buscador por nombre y filtro por rango de precio */}
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

      {/* Grid de productos */}
      {cargando ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : error ? (
        <div className="text-center">
          <Alert variant="danger" className="cat-aviso d-inline-block">
            {error}
          </Alert>
        </div>
      ) : (
        <>
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
        </>
      )}
    </Container>
  );
};

export default Catalogo;
