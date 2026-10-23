import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Container, Button, Badge, Form } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePersonalizacion } from '../../hooks/usePersonalizacion';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { obtenerProductos } from '../../api/productos';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';
import TablaPersonalizacion from '../../components/admin/TablaPersonalizacion';
import SubnavPersonalizacion from '../../components/admin/SubnavPersonalizacion';
import { SkeletonTabla } from '../../components/comunes/Skeleton';
import { formatPrice } from '../../utils/formatters';
import { TIPO_PERSONALIZACION } from '../../utils/constants';

const GestionPersonalizacion = ({ soloLectura = false }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { elementos, loading, cargar, actualizar, eliminar } = usePersonalizacion();
  const { notificar } = useNotificaciones();
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Refrescar al entrar: si se acaba de crear un producto, el backend copió las
  // plantillas de su categoría a PersonalizacionElementos y el contexto cargado
  // al inicio de la app puede estar desactualizado.
  useEffect(() => {
    cargar();
  }, [cargar]);

  // Catálogo real del backend. Antes se usaba `productosMock`, por lo que los
  // productos dados de alta desde /superadmin/productos no aparecían acá y no
  // se les podía asignar personalización.
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState('');

  useEffect(() => {
    let vigente = true;
    const cargarProductos = async () => {
      setCargandoProductos(true);
      const res = await obtenerProductos();
      if (!vigente) return;
      if (res.success) {
        setProductos(res.data || []);
        setErrorProductos('');
      } else {
        setErrorProductos(res.error || 'No se pudieron cargar los productos.');
      }
      setCargandoProductos(false);
    };
    cargarProductos();
    return () => {
      vigente = false;
    };
  }, []);

  const productoIdParam = searchParams.get('productoId') || '';
  const [productoSeleccionado, setProductoSeleccionado] = useState(productoIdParam);

  useEffect(() => {
    setProductoSeleccionado(productoIdParam);
  }, [productoIdParam]);

  const handleProductoChange = (e) => {
    const val = e.target.value;
    setProductoSeleccionado(val);
    setFiltroTipo('todos');
    if (val) setSearchParams({ productoId: val });
    else setSearchParams({});
  };

  const handleNuevo = () => {
    if (!productoSeleccionado) {
      notificar('Elegí primero el producto.', 'warning');
      return;
    }
    const tipoQuery = filtroTipo !== 'todos' ? `&tipo=${filtroTipo}` : '';
    navigate(`/superadmin/personalizacion/nuevo?productoId=${productoSeleccionado}${tipoQuery}`);
  };

  const handleEditar = (id) => {
    const el = elementos.find((e) => String(e.id) === String(id));
    const pid = el?.productoId || productoSeleccionado;
    navigate(`/superadmin/personalizacion/editar/${id}?productoId=${pid}`);
  };

  // Guarda el rango mín/máx editado en línea. Normaliza ambos valores juntos para
  // que el backend valide la coherencia (máx ≥ mín) y notifica el resultado.
  // Devuelve true si el cambio se persistió (la celda revierte si es false).
  const guardarCantidad = async (el, campo, valor) => {
    const min = campo === 'minimo' ? valor : el.minimo ?? 0;
    const max = campo === 'maximo' ? valor : el.maximo ?? 1;
    if (max < min) {
      notificar(`El máximo (${max}) no puede ser menor que el mínimo (${min}).`, 'warning');
      return false;
    }
    const res = await actualizar(el.id, { minimo: min, maximo: max });
    notificar(
      res.success
        ? `"${etiquetaDe(el)}": mín ${min}, máx ${max}.`
        : res.error || 'No se pudo actualizar el rango.',
      res.success ? 'success' : 'danger'
    );
    return res.success;
  };

  const etiquetaDe = (el) =>
    el.tipo === 'acompanar' ? `→ ${el.nombre}` : el.nombre;

  // Elemento que espera confirmación en el modal de eliminación
  const [elementoAEliminar, setElementoAEliminar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const handleEliminar = (el) => setElementoAEliminar(el);

  const confirmarEliminar = async () => {
    if (!elementoAEliminar) return;
    setConfirmando(true);
    const res = await eliminar(elementoAEliminar.id);
    const label = etiquetaDe(elementoAEliminar);
    notificar(
      res.success ? `"${label}" eliminado correctamente.` : res.error || 'No se pudo eliminar.',
      res.success ? 'success' : 'danger'
    );
    setElementoAEliminar(null);
    setConfirmando(false);
  };

  const elementosFiltrados = useMemo(() => {
    if (!productoSeleccionado) return [];
    let list = elementos.filter((e) => String(e.productoId) === String(productoSeleccionado));
    if (filtroTipo !== 'todos') list = list.filter((e) => e.tipo === filtroTipo);
    return list;
  }, [elementos, productoSeleccionado, filtroTipo]);

  const counts = useMemo(() => {
    if (!productoSeleccionado) return { extra: 0, personalizar: 0, acompanar: 0, condimento: 0, total: 0 };
    const porProd = elementos.filter((e) => String(e.productoId) === String(productoSeleccionado));
    return {
      extra: porProd.filter((e) => e.tipo === 'extra').length,
      personalizar: porProd.filter((e) => e.tipo === 'personalizar').length,
      acompanar: porProd.filter((e) => e.tipo === 'acompanar').length,
      condimento: porProd.filter((e) => e.tipo === 'condimento').length,
      total: porProd.length,
    };
  }, [elementos, productoSeleccionado]);

  const productoActual = productos.find((p) => String(p.id) === String(productoSeleccionado));

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="h2 mb-0">Gestión de Personalización</h1>
        {!soloLectura && (
          <Button variant="primary" onClick={handleNuevo} disabled={!productoSeleccionado}>
            <FaPlus className="me-1" aria-hidden="true" /> Agregar elemento
          </Button>
        )}
      </div>

      <SubnavPersonalizacion />

      {soloLectura && (
        <div className="alert alert-info" role="alert">
          Vista de solo lectura: el CRUD de personalización lo hace el
          SUPERADMINISTRADOR.
        </div>
      )}

      <div className="card shadow-sm p-3 mb-3" style={{ border: '2px solid #ffe9c9', borderRadius: '18px' }}>
        <div className="row g-3 align-items-end">
          <div className="col-md-6">
            <Form.Label className="fw-bold small">Producto *</Form.Label>
            <Form.Select
              value={productoSeleccionado}
              onChange={handleProductoChange}
              disabled={cargandoProductos}
            >
              <option value="">
                {cargandoProductos ? 'Cargando productos…' : '— Elegí un producto —'}
              </option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {p.categoria} — {formatPrice(p.precio)}
                </option>
              ))}
            </Form.Select>
            {errorProductos && (
              <Form.Text className="text-danger" role="alert">
                {errorProductos}
              </Form.Text>
            )}
          </div>
          <div className="col-md-6 small text-muted">
            {productoActual ? (
              <>
                <strong>{productoActual.nombre}</strong> <Badge bg="warning" text="dark">{productoActual.categoria}</Badge> — {formatPrice(productoActual.precio)} base{' '}
                <span className="ms-2">{counts.total} elementos: Extra {counts.extra} · Personalizar {counts.personalizar} · Acompaña {counts.acompanar} · Condimentos {counts.condimento}</span>
              </>
            ) : (
              'Seleccioná un producto para gestionar sus 4 categorías. Los elementos varían por producto.'
            )}
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 flex-wrap mb-3">
        {[
          { id: 'todos', label: 'Todos' },
          { id: TIPO_PERSONALIZACION.EXTRA, label: 'Extra' },
          { id: TIPO_PERSONALIZACION.PERSONALIZAR, label: 'Personalizar' },
          { id: TIPO_PERSONALIZACION.ACOMPANAR, label: 'Acompaña' },
          { id: TIPO_PERSONALIZACION.CONDIMENTO, label: 'Condimentos' },
        ].map((f) => (
          <Button
            key={f.id}
            variant={filtroTipo === f.id ? 'primary' : 'outline-secondary'}
            size="sm"
            style={{ borderRadius: '50px', fontWeight: 600 }}
            onClick={() => setFiltroTipo(f.id)}
          >
            {f.label}
          </Button>
        ))}
        <span className="ms-auto small text-muted align-self-center">
          {productoSeleccionado ? `${elementosFiltrados.length} de ${counts.total} — filtro: ${filtroTipo}` : ''}
        </span>
      </div>

      {!productoSeleccionado && (
        <div className="text-center py-5" style={{ border: '2px dashed #f1c27d', borderRadius: '14px', background: '#fff8ef' }}>
          <div className="fw-bold">Seleccioná un producto</div>
          <div className="small text-muted">
            {!cargandoProductos && productos.length === 0
              ? 'No hay productos activos. Creá uno en Gestión de Productos para asignarle extras y acompañamientos.'
              : 'Ej: Hamburguesa Clásica tiene Bacon $2.700, Pizza Muzzarella tiene Muzzarella extra $1.800.'}
          </div>
        </div>
      )}

      {productoSeleccionado && (
        <>
          {loading ? (
            <div role="status" aria-live="polite">
              <span className="visually-hidden">Cargando personalización…</span>
              <SkeletonTabla filas={5} columnas={3} />
            </div>
          ) : (
            <TablaPersonalizacion
              elementos={elementosFiltrados}
              productos={productos}
              soloLectura={soloLectura}
              mensajeVacio={
                counts.total === 0
                  ? 'No hay elementos para este producto. Agregá el primero.'
                  : 'No hay elementos de este tipo para el producto seleccionado.'
              }
              onEditar={handleEditar}
              onEliminar={handleEliminar}
              onGuardarCantidad={guardarCantidad}
            />
          )}
        </>
      )}

      <ConfirmarModal
        mostrar={Boolean(elementoAEliminar)}
        titulo="Eliminar elemento"
        mensaje={
          elementoAEliminar
            ? (() => {
                const el = elementoAEliminar;
                const prod = productos.find((p) => String(p.id) === String(el.productoId));
                return `¿Eliminar "${etiquetaDe(el)}" de "${prod?.nombre || 'producto #' + el.productoId}"? Tipo: ${el.tipo === 'acompanar' ? 'Acompaña' : el.tipo === 'personalizar' ? 'Personalizar' : el.tipo === 'condimento' ? 'Condimento' : 'Extra'} — ID #${el.id}`;
              })()
            : ''
        }
        textoConfirmar="Sí, eliminar"
        cargando={confirmando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setElementoAEliminar(null)}
      />
    </Container>
  );
};

export default GestionPersonalizacion;

GestionPersonalizacion.propTypes = {
  soloLectura: PropTypes.bool,
};
