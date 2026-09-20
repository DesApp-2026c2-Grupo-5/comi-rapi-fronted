import React, { useState, useEffect, useMemo } from 'react';
import { Container, Table, Button, Spinner, Badge, Form } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePersonalizacion } from '../../hooks/usePersonalizacion';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { productosMock } from '../../services/seedData';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';
import { formatPrice } from '../../utils/formatters';
import { TIPO_PERSONALIZACION } from '../../utils/constants';

const GestionPersonalizacion = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { elementos, loading, eliminar } = usePersonalizacion();
  const { notificar } = useNotificaciones();
  const [filtroTipo, setFiltroTipo] = useState('todos');

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
    navigate(`/admin/personalizacion/nuevo?productoId=${productoSeleccionado}${tipoQuery}`);
  };

  const handleEditar = (id) => navigate(`/admin/personalizacion/editar/${id}`);

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

  const productoActual = productosMock.find((p) => String(p.id) === String(productoSeleccionado));

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="mb-0">Gestión de Personalización</h2>
        <Button variant="primary" onClick={handleNuevo} disabled={!productoSeleccionado}>
          <FaPlus className="me-1" aria-hidden="true" /> Agregar elemento
        </Button>
      </div>

      <div className="card shadow-sm p-3 mb-3" style={{ border: '2px solid #ffe9c9', borderRadius: '18px' }}>
        <div className="row g-3 align-items-end">
          <div className="col-md-6">
            <Form.Label className="fw-bold small">Producto *</Form.Label>
            <Form.Select value={productoSeleccionado} onChange={handleProductoChange}>
              <option value="">— Elegí un producto —</option>
              {productosMock.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {p.categoria} — {formatPrice(p.precio)}
                </option>
              ))}
            </Form.Select>
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
          <div className="small text-muted">Ej: Hamburguesa Clásica tiene Bacon $2.700, Pizza Muzzarella tiene Muzzarella extra $1.800.</div>
        </div>
      )}

      {productoSeleccionado && (
        <>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="danger" />
            </div>
          ) : (
            <>
              <Table striped bordered hover responsive className="shadow-sm">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: 70 }}>ID</th>
                    <th>Nombre / Producto</th>
                    <th style={{ width: 130 }}>Tipo</th>
                    <th style={{ width: 120 }}>Precio</th>
                    <th style={{ width: 100 }}>Estado</th>
                    <th style={{ width: 180 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {elementosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center">
                        {counts.total === 0 ? 'No hay elementos para este producto. Agregá el primero.' : 'No hay elementos de este tipo para el producto seleccionado.'}
                      </td>
                    </tr>
                  )}
                  {elementosFiltrados.map((el) => {
                    const refProd = el.productoReferenciaId ? productosMock.find((p) => p.id === el.productoReferenciaId) : null;
                    return (
                      <tr key={el.id}>
                        <td>#{el.id}</td>
                        <td>
                          {el.tipo === 'acompanar' ? (
                            refProd ? (
                              <>
                                → <strong>{refProd.nombre}</strong> <Badge bg="light" text="dark" className="border">{refProd.categoria}</Badge>
                              </>
                            ) : (
                              <span className="text-danger">⚠️ Producto eliminado (id:{el.productoReferenciaId})</span>
                            )
                          ) : el.tipo === 'personalizar' ? (
                            <>
                              Sin <strong>{el.nombre}</strong> <span className="text-muted" style={{ fontSize: '.78rem' }}>(no descuenta)</span>
                            </>
                          ) : el.tipo === 'condimento' ? (
                            <>
                              {el.nombre} <span className="text-muted" style={{ fontSize: '.78rem' }}>(sin costo)</span>
                            </>
                          ) : (
                            <>
                              Extra: <strong>{el.nombre}</strong>
                            </>
                          )}
                        </td>
                        <td>
                          <Badge bg={el.tipo === 'extra' ? 'warning' : el.tipo === 'acompanar' ? 'success' : el.tipo === 'personalizar' ? 'secondary' : 'light'} text={el.tipo === 'extra' ? 'dark' : el.tipo === 'condimento' ? 'dark' : undefined} className={el.tipo === 'condimento' ? 'border' : ''}>
                            {el.tipo === 'extra' ? 'Extra' : el.tipo === 'personalizar' ? 'Personalizar' : el.tipo === 'acompanar' ? 'Acompaña' : 'Condimento'}
                          </Badge>
                        </td>
                        <td className={el.tipo === 'extra' || el.tipo === 'acompanar' ? 'fw-bold' : 'text-muted'} style={el.tipo === 'extra' || el.tipo === 'acompanar' ? { color: '#e63946' } : {}}>
                          {el.tipo === 'extra' || el.tipo === 'acompanar' ? formatPrice(el.precio) : '—'}
                        </td>
                        <td>
                          <Badge bg={el.activo ? 'success' : 'secondary'}>{el.activo ? 'Activo' : 'Inactivo'}</Badge>
                        </td>
                        <td className="text-nowrap">
                          <Button variant="secondary" size="sm" className="me-2" onClick={() => handleEditar(el.id)}>
                            <FaEdit className="me-1" aria-hidden="true" /> Editar
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleEliminar(el)}>
                            <FaTrashAlt className="me-1" aria-hidden="true" /> Eliminar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
              <div className="small text-muted">
                <Badge bg="warning" text="dark">Extra</Badge> cobra · <Badge bg="secondary">Personalizar</Badge> no cobra · <Badge bg="success">Acompaña</Badge> cobra (selector de producto) · <Badge bg="light" text="dark" className="border">Condimento</Badge> no cobra
              </div>
            </>
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
                const prod = productosMock.find((p) => p.id === el.productoId);
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
