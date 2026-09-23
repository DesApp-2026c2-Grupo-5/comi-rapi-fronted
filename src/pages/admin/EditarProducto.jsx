/**
 * Propósito: Página para editar o crear un producto usando Container de Bootstrap.
 * Contenido: Componente EditarProducto con carga de datos por ID y FormularioProducto.
 * Dependencias: react-bootstrap (Container, Spinner, Alert, Button), react-router-dom,
 *               FormularioProducto, api/productos.js.
 * Uso: Ruta "/admin/producto/editar/:id" o "/admin/producto/nuevo" → <EditarProducto />
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioProducto from '../../components/admin/FormularioProducto';
import { obtenerProductoPorId, crearProducto, editarProducto } from '../../api/productos';

const EditarProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError('');
      if (id) {
        const result = await obtenerProductoPorId(id);
        if (result.success) {
          setProducto(result.data);
        } else {
          setProducto(null);
          setError(result.error || 'No se pudo cargar el producto.');
        }
      }
      setCargando(false);
    };
    cargar();
  }, [id]);

  const handleGuardar = async (datosProducto) => {
    setError('');
    const result = id
      ? await editarProducto(id, datosProducto)
      : await crearProducto(datosProducto);
    if (result.success) {
      navigate('/admin/productos');
    } else {
      setError(result.error || 'No se pudo guardar el producto.');
    }
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
        <h2>{error || 'Producto no encontrado'}</h2>
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
      {error && <Alert variant="danger">{error}</Alert>}
      <FormularioProducto producto={producto} onGuardar={handleGuardar} />
    </Container>
  );
};

export default EditarProducto;
