/**
 * Propósito: Página para editar o crear una promoción usando Container de Bootstrap.
 * Contenido: Componente EditarPromocion con carga de datos por ID, vínculos
 *            iniciales con productos, recarga ante `catalogo_actualizado` de
 *            ESTA promoción y FormularioPromocion. Al guardar sincroniza
 *            asignaciones (agrega nuevos, quita removidos).
 * Dependencias: react-bootstrap (Container, Spinner, Alert), react-router-dom,
 *               FormularioPromocion, api/promociones.js, hooks/useAuth, services/socket.
 * Uso: Ruta "/superadmin/promocion/editar/:id" o "/superadmin/promocion/nuevo" → <EditarPromocion />
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert } from 'react-bootstrap';
import FormularioPromocion from '../../components/admin/FormularioPromocion';
import {
  obtenerPromocionPorId,
  crearPromocion,
  editarPromocion,
  obtenerProductosDePromocion,
  asignarProducto,
  quitarProducto,
} from '../../api/promociones';
import { useAuth } from '../../hooks/useAuth';
import { conectarSocket, EVENTOS_SOCKET } from '../../services/socket';

const EditarPromocion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hydrated } = useAuth();
  const [promocion, setPromocion] = useState(null);
  const [productoIdsIniciales, setProductoIdsIniciales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    if (id) {
      const [resPromo, resVinculos] = await Promise.all([
        obtenerPromocionPorId(id),
        obtenerProductosDePromocion(id),
      ]);
      if (resPromo.success) {
        setPromocion(resPromo.data);
        setProductoIdsIniciales(
          resVinculos.success
            ? resVinculos.data.map((producto) => producto.id)
            : []
        );
      } else {
        setPromocion(null);
        setError(resPromo.error || 'No se pudo cargar la promoción.');
      }
    }
    setCargando(false);
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Si cambia ESTA promoción (la que se está editando), se recarga: trae los
  // datos vigentes y también los vínculos con productos, que son la base del
  // diff al guardar. Eventos de otras entidades se ignoran a propósito:
  // resetear el formulario por cambios ajenos perdería la edición en curso.
  useEffect(() => {
    if (!hydrated || !user) return undefined;
    const instancia = conectarSocket();
    const alEvento = (payload) => {
      if (payload?.tipo !== 'promocion') return;
      if (Number(payload?.id) !== Number(id)) return;
      cargar();
    };
    instancia.on(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alEvento);
    return () => {
      instancia.off(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alEvento);
    };
  }, [hydrated, user, id, cargar]);

  const handleGuardar = async (datos) => {
    const { productoIds, ...datosPromocion } = datos;
    setGuardando(true);
    setError('');
    const result = id
      ? await editarPromocion(id, datosPromocion)
      : await crearPromocion(datosPromocion);
    if (!result.success) {
      setError(result.error || 'No se pudo guardar la promoción.');
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
        setError(res.error || 'No se pudo asignar un producto.');
        setGuardando(false);
        return;
      }
    }
    for (const productoId of aQuitar) {
      const res = await quitarProducto(promocionId, productoId);
      if (!res.success) {
        setError(res.error || 'No se pudo quitar un producto.');
        setGuardando(false);
        return;
      }
    }
    navigate('/superadmin/promociones');
  };

  if (cargando) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
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
