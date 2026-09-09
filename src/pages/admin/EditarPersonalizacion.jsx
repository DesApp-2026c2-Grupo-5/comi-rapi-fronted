import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioPersonalizacion from '../../components/admin/FormularioPersonalizacion';
import { usePersonalizacion } from '../../hooks/usePersonalizacion';
import { productosMock } from '../../services/seedData';

const EditarPersonalizacion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { elementos, loading, agregar, actualizar } = usePersonalizacion();
  const [elemento, setElemento] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const productoPreseleccionado = searchParams.get('productoId');
  const tipoPreseleccionado = searchParams.get('tipo');

  useEffect(() => {
    if (id) {
      const enc = elementos.find((e) => String(e.id) === String(id));
      setElemento(enc || null);
      setCargando(false);
    } else {
      setElemento(null);
      setCargando(false);
    }
  }, [id, elementos]);

  const handleGuardar = async (datos) => {
    // si viene tipo por query y no se eligió, usarlo
    if (!datos.tipo && tipoPreseleccionado) datos.tipo = tipoPreseleccionado;

    if (id) {
      const res = await actualizar(id, datos);
      if (res.success) {
        navigate(`/admin/personalizacion?productoId=${datos.productoId || elemento.productoId}`);
      } else {
        setError(res.error || 'No se pudo actualizar.');
      }
    } else {
      const res = await agregar(datos);
      if (res.success) {
        navigate(`/admin/personalizacion?productoId=${datos.productoId}`);
      } else {
        setError(res.error || 'No se pudo crear.');
      }
    }
  };

  if (cargando || loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (id && !elemento) {
    return (
      <Container className="py-5 text-center">
        <h2>Elemento no encontrado</h2>
        <Link to="/admin/personalizacion">
          <Button variant="secondary" className="mt-3">
            <FaArrowLeft className="me-1" aria-hidden="true" /> Volver
          </Button>
        </Link>
      </Container>
    );
  }

  const volverTo = elemento ? `/admin/personalizacion?productoId=${elemento.productoId}` : productoPreseleccionado ? `/admin/personalizacion?productoId=${productoPreseleccionado}` : '/admin/personalizacion';

  return (
    <Container className="py-4">
      <Link to={volverTo} className="text-danger text-decoration-none mb-3 d-inline-block">
        ← Volver a personalización
      </Link>
      <h2 className="mb-4">{id ? `Editar elemento #${id}` : 'Nuevo elemento'}</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <FormularioPersonalizacion
        elemento={id ? elemento : tipoPreseleccionado ? { tipo: tipoPreseleccionado } : null}
        productos={productosMock}
        productoPreseleccionado={productoPreseleccionado}
        onGuardar={handleGuardar}
      />
    </Container>
  );
};

export default EditarPersonalizacion;
