/**
 * Propósito: Página para editar o crear una promoción usando Container de Bootstrap.
 * Contenido: Componente EditarPromocion con carga de datos por ID vía TanStack
 *            Query, vínculos iniciales con productos y FormularioPromocion. Al
 *            guardar sincroniza asignaciones (agrega nuevos, quita removidos).
 * Dependencias: react-bootstrap (Container, Alert), react-router-dom,
 *               FormularioPromocion, api/promociones.js, hooks/queries,
 *               components/comunes/Skeleton (SkeletonTarjeta).
 * Uso: Ruta "/superadmin/promocion/editar/:id" o "/superadmin/promocion/nuevo" → <EditarPromocion />
 */

import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import FormularioPromocion from '../../components/admin/FormularioPromocion';
import {
  crearPromocion,
  editarPromocion,
  asignarProducto,
  quitarProducto,
} from '../../api/promociones';
import { usePromocion, useProductosDePromocion } from '../../hooks/queries';
import { SkeletonTarjeta } from '../../components/comunes/Skeleton';

const EditarPromocion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // `staleTime: Infinity` evita que un refetch al volver a la pestaña pise la
  // edición en curso. Las claves se invalidan con los avisos del backend.
  const {
    data: promocion = null,
    isPending: cargandoPromocion,
    error: errorPromocion,
  } = usePromocion(id, { enabled: Boolean(id), staleTime: Infinity });
  const { data: vinculos = [], isPending: cargandoVinculos } =
    useProductosDePromocion(id, { enabled: Boolean(id), staleTime: Infinity });
  const productoIdsIniciales = useMemo(
    () => vinculos.map((producto) => producto.id),
    [vinculos]
  );
  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');
  const error = errorLocal || errorPromocion?.message || '';
  const cargando = Boolean(id) && (cargandoPromocion || cargandoVinculos);

  const handleGuardar = async (datos) => {
    const { productoIds, ...datosPromocion } = datos;
    setGuardando(true);
    setErrorLocal('');
    const result = id
      ? await editarPromocion(id, datosPromocion)
      : await crearPromocion(datosPromocion);
    if (!result.success) {
      setErrorLocal(result.error || 'No se pudo guardar la promoción.');
      setGuardando(false);
      return;
    }
    const promocionId = id || result.data.id;
    const iniciales = new Set(productoIdsIniciales.map((x) => String(x)));
    const finales = new Set((productoIds || []).map((x) => String(x)));
    const aAgregar = [...finales].filter((x) => !iniciales.has(x));
    const aQuitar = [...iniciales].filter((x) => !finales.has(x));
    for (const productoId of aAgregar) {
      const res = await asignarProducto(promocionId, productoId);
      if (!res.success) {
        setErrorLocal(res.error || 'No se pudo asignar un producto.');
        setGuardando(false);
        return;
      }
    }
    for (const productoId of aQuitar) {
      const res = await quitarProducto(promocionId, productoId);
      if (!res.success) {
        setErrorLocal(res.error || 'No se pudo quitar un producto.');
        setGuardando(false);
        return;
      }
    }
    navigate('/superadmin/promociones');
  };

  if (cargando) {
    return (
      <Container className="py-5" role="status" aria-live="polite">
        <span className="visually-hidden">Cargando promoción…</span>
        <SkeletonTarjeta />
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Link to="/superadmin/promociones" className="text-danger text-decoration-none mb-3 d-inline-block">
        ← Volver a promociones
      </Link>
      <h1 className="h2 mb-4">{id ? `Editar Promoción #${id}` : 'Nueva Promoción'}</h1>
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      {(!id || promocion) && (
        <FormularioPromocion
          promocion={promocion}
          productoIdsIniciales={productoIdsIniciales}
          onGuardar={guardando ? undefined : handleGuardar}
        />
      )}
    </Container>
  );
};

export default EditarPromocion;
