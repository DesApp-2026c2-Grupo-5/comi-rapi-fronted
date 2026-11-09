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
import { useQueryClient } from '@tanstack/react-query';
import { Container, Alert } from 'react-bootstrap';
import FormularioPromocion from '../../components/admin/FormularioPromocion';
import {
  crearPromocion,
  editarPromocion,
  asignarProducto,
  quitarProducto,
} from '../../api/promociones';
import { usePromocion, useProductosDePromocion } from '../../hooks/queries';
import { queryKeys } from '../../hooks/queries';
import { SkeletonTarjeta } from '../../components/comunes/Skeleton';

// staleTime para la carga inicial: 30 seg evita refetch innecesario al remount/focus,
// pero permite refresh manual. Las invalidaciones por Socket.IO siguen funcionando.
const STALE_TIME_MS = 30_000;

const EditarPromocion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Carga principal de la promoción (rápida, esencial para el formulario)
  const {
    data: promocion = null,
    isPending: cargandoPromocion,
    error: errorPromocion,
  } = usePromocion(id, { enabled: Boolean(id), staleTime: STALE_TIME_MS });

  // 2. Productos asociados: carga en paralelo, no bloquea el formulario
  const {
    data: vinculos = [],
    isPending: cargandoVinculos,
    error: errorVinculos,
  } = useProductosDePromocion(id, { enabled: Boolean(id), staleTime: STALE_TIME_MS });

  const productoIdsIniciales = useMemo(
    () => vinculos.map((producto) => producto.id),
    [vinculos]
  );

  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState('');
  const error = errorLocal || errorPromocion?.message || errorVinculos?.message || '';

  // Cargando SOLO la promoción principal (vinculos puede llegar después)
  const cargando = Boolean(id) && cargandoPromocion;

  // Helper para actualizar todas las variantes de lista de promociones
  const actualizarListasPromociones = (promocionActualizada, esCreacion = false) => {
    const variantes = [
      queryKeys.public.promociones({ incluirInactivas: false, incluirProductos: false }),
      queryKeys.public.promociones({ incluirInactivas: true, incluirProductos: false }),
      queryKeys.public.promociones({ incluirInactivas: false, incluirProductos: true }),
      queryKeys.public.promociones({ incluirInactivas: true, incluirProductos: true }),
    ];
    const ordenarPorNombre = (a, b) =>
      String(a.nombre).localeCompare(String(b.nombre), 'es');
    for (const clave of variantes) {
      const lista = queryClient.getQueryData(clave);
      if (Array.isArray(lista)) {
        const idx = lista.findIndex((p) => String(p.id) === String(promocionActualizada.id));
        if (idx >= 0) {
          // Edición o producto ya existe en lista
          const nuevaLista = [...lista];
          nuevaLista[idx] = promocionActualizada;
          queryClient.setQueryData(clave, nuevaLista.sort(ordenarPorNombre));
        } else if (esCreacion) {
          // Creación: agregar ordenado
          const nuevaLista = [...lista, promocionActualizada].sort(ordenarPorNombre);
          queryClient.setQueryData(clave, nuevaLista);
        }
      }
    };
  };

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

    // Actualizar caché directamente para evitar refetch innecesario
    const promocionActualizada = result.data;

    // 1. Actualizar detalle individual
    queryClient.setQueryData(queryKeys.public.promocion(promocionId), promocionActualizada);

    // 2. Actualizar TODAS las variantes de lista de promociones
    actualizarListasPromociones(promocionActualizada, !id);

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

  // Si hay error de carga, mostramos el alerta pero igualmente renderizamos
  // el formulario (vacío) para que el usuario vea el error y pueda reintentar.
  // En modo creación (!id) siempre renderizamos.
  const mostrarFormulario = !id || Boolean(promocion) || Boolean(error);

  return (
    <Container className="py-4">
      <Link to="/superadmin/promociones" className="text-danger text-decoration-none mb-3 d-inline-block">
        ← Volver a promociones
      </Link>
      <h1 className="h2 mb-4">{id ? `Editar Promoción #${id}` : 'Nueva Promoción'}</h1>
      {error && <Alert variant="danger" role="alert">{error}</Alert>}
      {mostrarFormulario && (
        <FormularioPromocion
          promocion={promocion}
          productoIdsIniciales={productoIdsIniciales}
          onGuardar={guardando ? undefined : handleGuardar}
        />
      )}
      {!mostrarFormulario && !error && (
        <Alert variant="warning" role="alert">
          No se pudo cargar la promoción. Intente recargar la página.
        </Alert>
      )}
    </Container>
  );
};

export default EditarPromocion;