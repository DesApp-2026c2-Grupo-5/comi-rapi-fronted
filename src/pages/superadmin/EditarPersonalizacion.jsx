import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Alert, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioPersonalizacion from '../../components/admin/FormularioPersonalizacion';
import { usePersonalizacion } from '../../hooks/usePersonalizacion';
import { useProductos } from '../../hooks/queries';
import { SkeletonTarjeta } from '../../components/comunes/Skeleton';

const EditarPersonalizacion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { elementos, loading, cargado, cargar, agregar, actualizar } = usePersonalizacion();
  const [elemento, setElemento] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorLocal, setErrorLocal] = useState('');
  // Catálogo real del backend para elegir producto y producto de referencia;
  // se comparte con la caché pública del resto de la app.
  const {
    data: productos = [],
    isPending: cargandoProductos,
    error: errorProductosQuery,
  } = useProductos();
  const error = errorLocal || errorProductosQuery?.message || '';

  const productoPreseleccionado = searchParams.get('productoId');
  const tipoPreseleccionado = searchParams.get('tipo');

  useEffect(() => {
    cargar({ plantillas: false });
  }, [cargar]);

  useEffect(() => {
    if (!cargado) return;
    if (id) {
      const enc = elementos.find((e) => String(e.id) === String(id));
      setElemento(enc || null);
      setCargando(false);
    } else {
      setElemento(null);
      setCargando(false);
    }
  }, [id, elementos, cargado]);

  const handleGuardar = async (datos) => {
    // si viene tipo por query y no se eligió, usarlo
    if (!datos.tipo && tipoPreseleccionado) datos.tipo = tipoPreseleccionado;

    if (id) {
      const res = await actualizar(id, datos);
      if (res.success) {
        navigate(`/superadmin/personalizacion?productoId=${datos.productoId || elemento.productoId}`);
      } else {
        setErrorLocal(res.error || 'No se pudo actualizar.');
      }
    } else {
      const res = await agregar(datos);
      if (res.success) {
        navigate(`/superadmin/personalizacion?productoId=${datos.productoId}`);
      } else {
        setErrorLocal(res.error || 'No se pudo crear.');
      }
    }
  };

  if (cargando || loading || cargandoProductos) {
    return (
      <Container className="py-5" role="status" aria-live="polite">
        <span className="visually-hidden">Cargando elemento de personalización…</span>
        <SkeletonTarjeta />
      </Container>
    );
  }

  if (id && !elemento) {
    return (
      <Container className="py-5 text-center">
        <h1 className="h2">Elemento no encontrado</h1>
        <Button as={Link} to="/superadmin/personalizacion" variant="secondary" className="mt-3">
            <FaArrowLeft className="me-1" aria-hidden="true" /> Volver
          </Button>
      </Container>
    );
  }

  const elementoInicial = id
    ? elemento
    : tipoPreseleccionado
      ? {
          tipo: tipoPreseleccionado,
          productoId: productoPreseleccionado ? Number(productoPreseleccionado) : null,
        }
      : null;

  const volverTo = elemento ? `/superadmin/personalizacion?productoId=${elemento.productoId}` : productoPreseleccionado ? `/superadmin/personalizacion?productoId=${productoPreseleccionado}` : '/superadmin/personalizacion';

  return (
    <Container className="py-4">
      <Link to={volverTo} className="text-danger text-decoration-none mb-3 d-inline-block">
        ← Volver a personalización
      </Link>
      <h1 className="h2 mb-4">{id ? `Editar elemento #${id}` : 'Nuevo elemento'}</h1>
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      <FormularioPersonalizacion
        elemento={elementoInicial}
        productos={productos}
        productoPreseleccionado={productoPreseleccionado}
        onGuardar={handleGuardar}
      />
    </Container>
  );
};

export default EditarPersonalizacion;
