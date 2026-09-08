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
*/

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Button, Row, Col, Alert } from 'react-bootstrap';
import { productosMock, categoriasMock } from '../../services/seedData';
import ProductoCard from '../../components/cliente/ProductoCard';
import './Catalogo.css';

const Catalogo = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const filtros = ['Todos', ...categoriasMock.map((c) => c.nombre)];

  // Categoría activa: viene del query param (?categoria=...) o por defecto "Todos"
  const categoriaParam = searchParams.get('categoria');
  const categoriaSeleccionada =
    categoriaParam && categoriasMock.some((c) => c.nombre === categoriaParam)
      ? categoriaParam
      : 'Todos';

  const productosFiltrados = useMemo(() => {
    if (categoriaSeleccionada === 'Todos') {
      return productosMock;
    }
    return productosMock.filter((p) => p.categoria === categoriaSeleccionada);
  }, [categoriaSeleccionada]);

  // Elegir categoría desde las pills (sincroniza la URL para que también la home la setee)
  const seleccionarCategoria = (nombre) => {
    setSearchParams(nombre === 'Todos' ? {} : { categoria: nombre }, { replace: true });
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

      {/* Grid de productos */}
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
            No hay productos en esta categoría todavía.
          </Alert>
        </div>
      )}
    </Container>
  );
};

export default Catalogo;