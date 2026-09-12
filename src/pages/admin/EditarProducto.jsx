/**
 * Propósito: Página para editar o crear un producto usando la API real.
 * Contenido: Componente EditarProducto con carga de datos por ID y FormularioProducto.
 * Dependencias: react-bootstrap (Container, Spinner, Alert, Button), react-router-dom,
 *               FormularioProducto, api/productos.js.
 * Uso: Ruta "/admin/producto/editar/:id" o "/admin/producto/nuevo" → <EditarProducto />
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioProducto from '../../components/admin/FormularioProducto';
import { obtenerProductoPorId, crearProducto, editarProducto } from '../../api/productos';

const EditarProducto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [productoNoEncontrado, setProductoNoEncontrado] = useState(false);
  const [cargando, setCargando] = useState(Boolean(id));
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      obtenerProductoPorId(id).then((resultado) => {
        if (resultado.success) {
          setProducto(resultado.data);
        } else {
          setProductoNoEncontrado(true);
        }
        setCargando(false);
      });
    }
  }, [id]);

  const handleGuardar = async (datosProducto) => {
    const resultado = id
      ? await editarProducto(id, datosProducto)
      : await crearProducto(datosProducto);
    if (resultado.success) {
      alert(`Producto "${datosProducto.nombre}" guardado correctamente.`);
      navigate('/admin/productos');
    } else {
      setError(resultado.error || 'No se pudo guardar el producto.');
    }
  };

  if (cargando) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (id && productoNoEncontrado) {
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
      {error && <Alert variant="danger">{error}</Alert>}
      <FormularioProducto producto={producto} onGuardar={handleGuardar} />
    </Container>
  );
};

export default EditarProducto;