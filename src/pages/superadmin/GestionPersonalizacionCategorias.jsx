/**
 * Propósito: Gestión de plantillas de personalización por categoría.
 * Contenido: selector de categoría, filtros por tipo, tabla de plantillas y
 *            acciones de alta, edición, borrado y rango mín/máx.
 * Dependencias: usePersonalizacion, api/categorias, api/productos,
 *               TablaPersonalizacion, SubnavPersonalizacion y ConfirmarModal.
 * Uso: ruta /superadmin/personalizacion/categorias
 */

import { useState, useEffect, useMemo } from 'react';
import { Container, Button, Badge, Form } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePersonalizacion } from '../../hooks/usePersonalizacion';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { obtenerCategorias } from '../../api/categorias';
import { obtenerProductos } from '../../api/productos';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';
import TablaPersonalizacion from '../../components/admin/TablaPersonalizacion';
import SubnavPersonalizacion from '../../components/admin/SubnavPersonalizacion';
import { SkeletonTabla } from '../../components/comunes/Skeleton';
import { TIPO_PERSONALIZACION } from '../../utils/constants';

const GestionPersonalizacionCategorias = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    plantillas,
    loading,
    actualizarPlantilla,
    eliminarPlantilla,
  } = usePersonalizacion();
  const { notificar } = useNotificaciones();
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [errorCategorias, setErrorCategorias] = useState('');

  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

  useEffect(() => {
    let vigente = true;
    const cargarCategorias = async () => {
      setCargandoCategorias(true);
      const res = await obtenerCategorias();
      if (!vigente) return;
      if (res.success) {
        setCategorias(res.data || []);
        setErrorCategorias('');
      } else {
        setErrorCategorias(
          res.error || 'No se pudieron cargar las categorías.'
        );
      }
      setCargandoCategorias(false);
    };
    cargarCategorias();
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    let vigente = true;
    const cargarProductos = async () => {
      setCargandoProductos(true);
      const res = await obtenerProductos();
      if (!vigente) return;
      if (res.success) setProductos(res.data || []);
      setCargandoProductos(false);
    };
    cargarProductos();
    return () => {
      vigente = false;
    };
  }, []);

  const categoriaIdParam = searchParams.get('categoriaId') || '';
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState(categoriaIdParam);

  useEffect(() => {
    setCategoriaSeleccionada(categoriaIdParam);
  }, [categoriaIdParam]);

  const handleCategoriaChange = (e) => {
    const val = e.target.value;
    setCategoriaSeleccionada(val);
    setFiltroTipo('todos');
    if (val) setSearchParams({ categoriaId: val });
    else setSearchParams({});
  };

  const categoriaActual = categorias.find(
    (c) => String(c.id) === String(categoriaSeleccionada)
  );

  const handleNuevo = () => {
    if (!categoriaSeleccionada) {
      notificar('Elegí primero la categoría.', 'warning');
      return;
    }
    const tipoQuery =
      filtroTipo !== 'todos' ? `&tipo=${filtroTipo}` : '';
    navigate(
      `/superadmin/personalizacion/categorias/nuevo?categoriaId=${categoriaSeleccionada}${tipoQuery}`
    );
  };

  const handleEditar = (id) => {
    const plantilla = plantillas.find((p) => String(p.id) === String(id));
    const categoriaId = plantilla?.categoriaId || categoriaSeleccionada;
    navigate(
      `/superadmin/personalizacion/categorias/editar/${id}?categoriaId=${categoriaId}`
    );
  };

  const etiquetaDe = (el) =>
    el.tipo === 'acompanar' ? `→ ${el.nombre}` : el.nombre;

  // Guarda el rango mín/máx editado en línea, igual que en la vista por
  // producto. Devuelve true si el cambio se persistió.
  const guardarCantidad = async (el, campo, valor) => {
    const min = campo === 'minimo' ? valor : el.minimo ?? 0;
    const max = campo === 'maximo' ? valor : el.maximo ?? 1;
    if (max < min) {
      notificar(
        `El máximo (${max}) no puede ser menor que el mínimo (${min}).`,
        'warning'
      );
      return false;
    }
    const res = await actualizarPlantilla(el.id, { minimo: min, maximo: max });
    notificar(
      res.success
        ? `"${etiquetaDe(el)}": mín ${min}, máx ${max}.`
        : res.error || 'No se pudo actualizar el rango.',
      res.success ? 'success' : 'danger'
    );
    return res.success;
  };

  const [plantillaAEliminar, setPlantillaAEliminar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  const handleEliminar = (el) => setPlantillaAEliminar(el);

  const confirmarEliminar = async () => {
    if (!plantillaAEliminar) return;
    setConfirmando(true);
    const res = await eliminarPlantilla(plantillaAEliminar.id);
    const label = etiquetaDe(plantillaAEliminar);
    notificar(
      res.success
        ? `"${label}" eliminado correctamente.`
        : res.error || 'No se pudo eliminar.',
      res.success ? 'success' : 'danger'
    );
    setPlantillaAEliminar(null);
    setConfirmando(false);
  };

  const plantillasDeCategoria = useMemo(() => {
    if (!categoriaSeleccionada) return [];
    let list = plantillas.filter(
      (p) => String(p.categoriaId) === String(categoriaSeleccionada)
    );
    if (filtroTipo !== 'todos') list = list.filter((p) => p.tipo === filtroTipo);
    return list;
  }, [plantillas, categoriaSeleccionada, filtroTipo]);

  const counts = useMemo(() => {
    if (!categoriaSeleccionada)
      return { extra: 0, personalizar: 0, acompanar: 0, condimento: 0, total: 0 };
    const porCategoria = plantillas.filter(
      (p) => String(p.categoriaId) === String(categoriaSeleccionada)
    );
    return {
      extra: porCategoria.filter((p) => p.tipo === 'extra').length,
      personalizar: porCategoria.filter((p) => p.tipo === 'personalizar').length,
      acompanar: porCategoria.filter((p) => p.tipo === 'acompanar').length,
      condimento: porCategoria.filter((p) => p.tipo === 'condimento').length,
      total: porCategoria.length,
    };
  }, [plantillas, categoriaSeleccionada]);

  const cargando = loading || cargandoCategorias || cargandoProductos;

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="h2 mb-0">Personalización por categoría</h1>
        <Button
          variant="primary"
          onClick={handleNuevo}
          disabled={!categoriaSeleccionada}
        >
          <FaPlus className="me-1" aria-hidden="true" /> Agregar plantilla
        </Button>
      </div>

      <SubnavPersonalizacion />

      <div
        className="card shadow-sm p-3 mb-3"
        style={{ border: '2px solid var(--color-border-card)', borderRadius: '18px' }}
      >
        <div className="row g-3 align-items-end">
          <div className="col-md-6">
            <Form.Label className="fw-bold small">Categoría *</Form.Label>
            <Form.Select
              value={categoriaSeleccionada}
              onChange={handleCategoriaChange}
              disabled={cargandoCategorias}
            >
              <option value="">
                {cargandoCategorias
                  ? 'Cargando categorías…'
                  : '— Elegí una categoría —'}
              </option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </Form.Select>
            {errorCategorias && (
              <Form.Text className="text-danger" role="alert">
                {errorCategorias}
              </Form.Text>
            )}
          </div>
          <div className="col-md-6 small text-muted">
            {categoriaActual ? (
              <>
                <strong>{categoriaActual.nombre}</strong> — {counts.total}{' '}
                plantillas: Extra {counts.extra} · Personalizar{' '}
                {counts.personalizar} · Acompaña {counts.acompanar} ·
                Condimentos {counts.condimento}
                <div className="mt-1">
                  Se copian automáticamente al crear un producto de esta
                  categoría.
                </div>
              </>
            ) : (
              'Elegí una categoría para definir los extras, condimentos y acompañamientos que tendrán sus productos nuevos.'
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
          {categoriaSeleccionada
            ? `${plantillasDeCategoria.length} de ${counts.total} — filtro: ${filtroTipo}`
            : ''}
        </span>
      </div>

      {!categoriaSeleccionada && (
        <div
          className="text-center py-5"
          style={{
            border: '2px dashed var(--color-border-cream)',
            borderRadius: '14px',
            background: 'var(--color-cream-soft)',
          }}
        >
          <div className="fw-bold">Seleccioná una categoría</div>
          <div className="small text-muted">
            {!cargandoCategorias && categorias.length === 0
              ? 'No hay categorías activas. Creá una en Gestión de Categorías.'
              : 'Ej: Bebidas → Personalizar "Hielo" para que todo producto nuevo de Bebidas se cree con la opción "Sin Hielo".'}
          </div>
        </div>
      )}

      {categoriaSeleccionada && (
        <>
          {cargando ? (
            <div role="status" aria-live="polite">
              <span className="visually-hidden">
                Cargando plantillas de la categoría…
              </span>
              <SkeletonTabla filas={5} columnas={3} />
            </div>
          ) : (
            <TablaPersonalizacion
              elementos={plantillasDeCategoria}
              productos={productos}
              mensajeVacio={
                counts.total === 0
                  ? 'No hay plantillas para esta categoría. Agregá la primera.'
                  : 'No hay plantillas de este tipo para la categoría seleccionada.'
              }
              onEditar={handleEditar}
              onEliminar={handleEliminar}
              onGuardarCantidad={guardarCantidad}
            />
          )}
        </>
      )}

      <ConfirmarModal
        mostrar={Boolean(plantillaAEliminar)}
        titulo="Eliminar plantilla"
        mensaje={
          plantillaAEliminar
            ? (() => {
                const el = plantillaAEliminar;
                const cat = categorias.find(
                  (c) => String(c.id) === String(el.categoriaId)
                );
                return `¿Eliminar "${etiquetaDe(el)}" de la categoría "${
                  cat?.nombre || 'categoría #' + el.categoriaId
                }"? Los productos ya creados no se modifican. Tipo: ${
                  el.tipo === 'acompanar'
                    ? 'Acompaña'
                    : el.tipo === 'personalizar'
                      ? 'Personalizar'
                      : el.tipo === 'condimento'
                        ? 'Condimento'
                        : 'Extra'
                } — ID #${el.id}`;
              })()
            : ''
        }
        textoConfirmar="Sí, eliminar"
        cargando={confirmando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setPlantillaAEliminar(null)}
      />

      {!cargando && !categoriaSeleccionada && (
        <div className="mt-3 small text-muted">
          <Badge bg="warning" text="dark">
            Extra
          </Badge>{' '}
          cobra · <Badge bg="secondary">Personalizar</Badge> no cobra ·{' '}
          <Badge bg="success">Acompaña</Badge> cobra ·{' '}
          <Badge bg="light" text="dark" className="border">
            Condimento
          </Badge>{' '}
          no cobra
        </div>
      )}
    </Container>
  );
};

export default GestionPersonalizacionCategorias;
