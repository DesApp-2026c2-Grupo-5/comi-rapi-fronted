/**
 * Propósito: Catálogo corporativo de insumos (extras y condimentos).
 * Contenido: filtros por tipo, estado y búsqueda; tabla con alta, edición, baja
 *            lógica y reactivación.
 * Dependencias: react-bootstrap, react-icons, api/insumos.js,
 *               components/admin/FormularioInsumo, ConfirmarModal,
 *               useNotificaciones y SkeletonTabla.
 * Uso: Ruta "/superadmin/insumos" → <GestionInsumos />
 *
 * Los insumos son una entidad propia, separada de Producto. El alta/edición la
 * hace el SUPERADMINISTRADOR; las cantidades por sucursal se cargan en Stock,
 * no acá.
 */

import { useState, useEffect, useMemo } from 'react';
import { Container, Table, Button, Badge, Alert, Form } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrashAlt, FaUndoAlt } from 'react-icons/fa';
import {
  actualizarInsumo,
  crearInsumo,
  eliminarInsumo,
  obtenerInsumos,
} from '../../api/insumos';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';
import FormularioInsumo from '../../components/admin/FormularioInsumo';
import { SkeletonTabla } from '../../components/comunes/Skeleton';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { formatPrice } from '../../utils/formatters';

const ETIQUETA_TIPO = {
  extra: 'Extra',
  condimento: 'Condimento',
};

const GestionInsumos = () => {
  const { notificar } = useNotificaciones();
  const [insumos, setInsumos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    tipo: 'todos',
    estado: 'todos',
    q: '',
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [insumoEnEdicion, setInsumoEnEdicion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [insumoAEliminar, setInsumoAEliminar] = useState(null);
  const [insumoAReactivar, setInsumoAReactivar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const cargarInsumos = async () => {
    setCargando(true);
    setError('');
    const result = await obtenerInsumos();
    if (result.success) {
      setInsumos(result.data || []);
    } else {
      setError(result.error || 'No se pudieron cargar los insumos.');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarInsumos();
  }, []);

  const visibles = useMemo(() => {
    const texto = filtros.q.trim().toLowerCase();
    return insumos.filter((insumo) => {
      if (filtros.tipo !== 'todos' && insumo.tipo !== filtros.tipo) return false;
      if (filtros.estado === 'activos' && !insumo.activo) return false;
      if (filtros.estado === 'inactivos' && insumo.activo) return false;
      if (texto && !String(insumo.nombre).toLowerCase().includes(texto)) {
        return false;
      }
      return true;
    });
  }, [insumos, filtros]);

  const abrirAlta = () => {
    setInsumoEnEdicion(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (insumo) => {
    setInsumoEnEdicion(insumo);
    setModalAbierto(true);
  };

  const guardar = async (datos) => {
    setGuardando(true);
    const result = insumoEnEdicion
      ? await actualizarInsumo(insumoEnEdicion.id, datos)
      : await (async () => {
          const { activo, ...alta } = datos;
          return crearInsumo({ ...alta, activo });
        })();
    setGuardando(false);
    if (!result.success) {
      notificar(result.error || 'No se pudo guardar el insumo.', 'danger');
      return;
    }
    setModalAbierto(false);
    setInsumoEnEdicion(null);
    notificar(
      insumoEnEdicion
        ? 'Insumo actualizado.'
        : 'Insumo creado. Ya podés cargar su stock en Stock.',
      'success'
    );
    cargarInsumos();
  };

  const confirmarEliminar = async () => {
    if (!insumoAEliminar) return;
    setConfirmando(true);
    const result = await eliminarInsumo(insumoAEliminar.id);
    setConfirmando(false);
    if (!result.success) {
      notificar(result.error || 'No se pudo dar de baja el insumo.', 'danger');
      return;
    }
    setInsumoAEliminar(null);
    notificar('Insumo dado de baja.', 'success');
    cargarInsumos();
  };

  const confirmarReactivar = async () => {
    if (!insumoAReactivar) return;
    setConfirmando(true);
    const result = await actualizarInsumo(insumoAReactivar.id, { activo: true });
    setConfirmando(false);
    if (!result.success) {
      notificar(result.error || 'No se pudo reactivar el insumo.', 'danger');
      return;
    }
    setInsumoAReactivar(null);
    notificar('Insumo reactivado.', 'success');
    cargarInsumos();
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h1 className="h2 mb-0">Insumos</h1>
        </div>
        <Button variant="primary" onClick={abrirAlta}>
          <FaPlus className="me-1" aria-hidden="true" />
          Nuevo insumo
        </Button>
      </div>

      <div className="d-flex flex-wrap gap-2 align-items-end mb-3">
        <Form.Group controlId="filtro-insumo-tipo" className="mb-0">
          <Form.Label className="small mb-1">Tipo</Form.Label>
          <Form.Select
            size="sm"
            value={filtros.tipo}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, tipo: e.target.value }))
            }
          >
            <option value="todos">Todos</option>
            <option value="extra">Extras</option>
            <option value="condimento">Condimentos</option>
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="filtro-insumo-estado" className="mb-0">
          <Form.Label className="small mb-1">Estado</Form.Label>
          <Form.Select
            size="sm"
            value={filtros.estado}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, estado: e.target.value }))
            }
          >
            <option value="todos">Todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Dados de baja</option>
          </Form.Select>
        </Form.Group>
        <Form.Group controlId="filtro-insumo-buscar" className="mb-0 flex-grow-1">
          <Form.Label className="small mb-1">Buscar</Form.Label>
          <Form.Control
            size="sm"
            type="search"
            placeholder="Nombre del insumo"
            value={filtros.q}
            onChange={(e) =>
              setFiltros((prev) => ({ ...prev, q: e.target.value }))
            }
          />
        </Form.Group>
      </div>

      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}

      {cargando ? (
        <div role="status" aria-live="polite">
          <span className="visually-hidden">Cargando insumos…</span>
          <SkeletonTabla filas={5} columnas={5} />
        </div>
      ) : visibles.length === 0 ? (
        <Alert variant="info">
          {insumos.length === 0
            ? 'Todavía no hay insumos. Creá el primero para poder asignarlo a la personalización de un producto.'
            : 'No hay insumos que coincidan con los filtros.'}
        </Alert>
      ) : (
        <Table striped bordered hover responsive className="tabla-admin shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((insumo) => (
              <tr key={insumo.id}>
                <td data-label="Nombre">{insumo.nombre}</td>
                <td data-label="Tipo">
                  <Badge bg={insumo.tipo === 'extra' ? 'primary' : 'info'}>
                    {ETIQUETA_TIPO[insumo.tipo] || insumo.tipo}
                  </Badge>
                </td>
                <td data-label="Precio">
                  {insumo.tipo === 'extra'
                    ? formatPrice(Number(insumo.precio || 0))
                    : 'Gratis'}
                </td>
                <td data-label="Estado">
                  {insumo.activo ? (
                    <Badge bg="success">Activo</Badge>
                  ) : (
                    <Badge bg="secondary">Dado de baja</Badge>
                  )}
                </td>
                <td className="columna-acciones">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => abrirEdicion(insumo)}
                  >
                    <FaEdit className="me-1" aria-hidden="true" />
                    Editar
                  </Button>
                  {insumo.activo ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setInsumoAEliminar(insumo)}
                    >
                      <FaTrashAlt className="me-1" aria-hidden="true" />
                      Dar de baja
                    </Button>
                  ) : (
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => setInsumoAReactivar(insumo)}
                    >
                      <FaUndoAlt className="me-1" aria-hidden="true" />
                      Reactivar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <FormularioInsumo
        mostrar={modalAbierto}
        insumo={insumoEnEdicion}
        cargando={guardando}
        onGuardar={guardar}
        onCancelar={() => {
          setModalAbierto(false);
          setInsumoEnEdicion(null);
        }}
      />

      <ConfirmarModal
        mostrar={Boolean(insumoAEliminar)}
        titulo="Dar de baja el insumo"
        mensaje={
          insumoAEliminar
            ? `¿Dar de baja "${insumoAEliminar.nombre}"? Deja de ofrecerse en el catálogo, pero conserva el stock y el histórico de los pedidos.`
            : ''
        }
        textoConfirmar="Sí, dar de baja"
        cargando={confirmando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setInsumoAEliminar(null)}
      />

      <ConfirmarModal
        mostrar={Boolean(insumoAReactivar)}
        titulo="Reactivar insumo"
        mensaje={
          insumoAReactivar
            ? `¿Volver a ofrecer "${insumoAReactivar.nombre}"?`
            : ''
        }
        textoConfirmar="Sí, reactivar"
        cargando={confirmando}
        onConfirmar={confirmarReactivar}
        onCancelar={() => setInsumoAReactivar(null)}
      />
    </Container>
  );
};

export default GestionInsumos;
