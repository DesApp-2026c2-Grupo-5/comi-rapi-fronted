/**
 * Propósito: Página para editar o crear un producto usando Container de Bootstrap.
 * Contenido: Componente EditarProducto con carga de datos por ID y FormularioProducto.
 * Dependencias: react-bootstrap (Container, Spinner, Alert, Button), react-router-dom, FormularioProducto, seedData.js.
 * Uso: Ruta "/admin/producto/editar/:id" o "/admin/producto/nuevo" → <EditarProducto />
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioProducto from '../../components/admin/FormularioProducto';
import { productosMock } from '../../services/seedData';

const EditarProducto = () => {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (id) {
      const encontrado = productosMock.find((p) => p.id === Number(id));
      setProducto(encontrado || null);
    }
    setCargando(false);
  }, [id]);

  const handleGuardar = (datosProducto) => {
    alert(`Producto "${datosProducto.nombre}" guardado correctamente (simulado).`);
  };

  if (cargando) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (id && !producto) {
    return (
      <Container className="py-5 text-center">
        <h2>Producto no encontrado</h2>
        <Link to="/admin/productos"><Button variant="secondary" className="mt-3">
          <FaArrowLeft className="me-1" aria-hidden="true" />
          Volver a productos
        </Button></Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Link to="/admin/productos" className="text-danger text-decoration-none mb-3 d-inline-block">
        ← Volver a productos
      </Link>
      <h2 className="mb-4">{id ? `Editar Producto #${id}` : 'Nuevo Producto'}</h2>
      <FormularioProducto producto={producto} onGuardar={handleGuardar} />
    </Container>
  );
};

export default EditarProducto;
