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
 *  - Filtros de categorías en forma de pills (Hamburguesas, Combos, Papas, Bebidas, Postres).
 *  - Grid responsive (3 columnas en md, 4 en lg).
 *  - Cards con el estilo visual de la home de Comi-Rapi (ver ProductoCard).
 */

import { useState, useEffect } from 'react';
import { Container, Button, Row, Col, Alert } from 'react-bootstrap';
import { productosMock, categoriasMock } from '../../services/seedData';
import ProductoCard from '../../components/cliente/ProductoCard';
import './Catalogo.css';

const Catalogo = () => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');
  const [productosFiltrados, setProductosFiltrados] = useState([]);

  useEffect(() => {
    if (categoriaSeleccionada === 'Todos') {
      setProductosFiltrados(productosMock);
    } else {
      setProductosFiltrados(
        productosMock.filter((p) => p.categoria === categoriaSeleccionada)
      );
    }
  }, [categoriaSeleccionada]);

  const filtros = ['Todos', ...categoriasMock.map((c) => c.nombre)];

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
              onClick={() => setCategoriaSeleccionada(filtro)}
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