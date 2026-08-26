/**
 * Propósito: Página de catálogo con filtro por categoría y grid de productos usando Bootstrap.
 * Contenido: Componente Catalogo con ButtonGroup, Row/Col y ProductoCard.
 * Dependencias: react-bootstrap (Container, Button, ButtonGroup, Row, Col, Alert), seedData.js, ProductoCard.
 * Uso: Ruta "/cliente/catalogo" → <Catalogo />
 */

import React, { useState, useEffect } from 'react';
import { Container, Button, ButtonGroup, Row, Col, Alert } from 'react-bootstrap';
import { productosMock, categoriasMock } from '../../services/seedData';
import ProductoCard from '../../components/cliente/ProductoCard';

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

  return (
    <Container className="py-4">
      <h1 className="mb-4">Catálogo de Productos</h1>

      <ButtonGroup className="mb-4 flex-wrap">
        <Button
          variant={categoriaSeleccionada === 'Todos' ? 'danger' : 'outline-danger'}
          onClick={() => setCategoriaSeleccionada('Todos')}
        >
          Todos
        </Button>
        {categoriasMock.map((cat) => (
          <Button
            key={cat.id}
            variant={categoriaSeleccionada === cat.nombre ? 'danger' : 'outline-danger'}
            onClick={() => setCategoriaSeleccionada(cat.nombre)}
          >
            {cat.nombre}
          </Button>
        ))}
      </ButtonGroup>

      <Row>
        {productosFiltrados.map((producto) => (
          <Col key={producto.id} md={4} className="mb-4">
            <ProductoCard producto={producto} />
          </Col>
        ))}
      </Row>

      {productosFiltrados.length === 0 && (
        <Alert variant="secondary" className="text-center">No hay productos en esta categoría.</Alert>
      )}
    </Container>
  );
};

export default Catalogo;
