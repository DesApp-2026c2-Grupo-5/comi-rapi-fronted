/**
 * Propósito: Página para editar o crear una categoría usando Container de Bootstrap.
 * Contenido: Componente EditarCategoria con carga de datos por ID y FormularioCategoria.
 * Dependencias: react-bootstrap (Container, Spinner, Alert, Button), react-router-dom,
 *               FormularioCategoria, api/categorias.js.
 * Uso: Ruta "/admin/categoria/editar/:id" o "/admin/categoria/nuevo" → <EditarCategoria />
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioCategoria from '../../components/admin/FormularioCategoria';
import { obtenerCategoriaPorId, crearCategoria, editarCategoria } from '../../api/categorias';

const EditarCategoria = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categoria, setCategoria] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      setError('');
      if (id) {
        const result = await obtenerCategoriaPorId(id);
        if (result.success) {
          setCategoria(result.data);
        } else {
          setCategoria(null);
          setError(result.error || 'No se pudo cargar la categoría.');
        }
      }
      setCargando(false);
    };
    cargar();
  }, [id]);

  const handleGuardar = async (datosCategoria) => {
    setError('');
    const result = id
      ? await editarCategoria(id, datosCategoria)
      : await crearCategoria(datosCategoria);
    if (result.success) {
      navigate('/admin/categorias');
    } else {
      setError(result.error || 'No se pudo guardar la categoría.');
    }
  };

  if (cargando) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (id && !categoria) {
    return (
      <Container className="py-5 text-center">
        <h2>{error || 'Categoría no encontrada'}</h2>
        <Link to="/admin/categorias"><Button variant="secondary" className="mt-3">
          <FaArrowLeft className="me-1" aria-hidden="true" />
          Volver a categorías
        </Button></Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Link to="/admin/categorias" className="text-danger text-decoration-none mb-3 d-inline-block">
        ← Volver a categorías
      </Link>
      <h2 className="mb-4">{id ? `Editar Categoría #${id}` : 'Nueva Categoría'}</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <FormularioCategoria categoria={categoria} onGuardar={handleGuardar} />
    </Container>
  );
};

export default EditarCategoria;
