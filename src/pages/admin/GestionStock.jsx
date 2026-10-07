/**
 * Propósito: Pantalla de stock por sucursal para el administrador.
 * Contenido: Tabla producto×cantidad con edición en el lugar, alta de un
 *            producto al catálogo de la sucursal y, para los combos, la
 *            cantidad de los que se pueden armar con el stock actual.
 * Dependencias: react-bootstrap, react-icons, api/stock.js, api/productos.js,
 *               hooks/useAuth (sucursal asignada), hooks/useNotificaciones.
 * Uso: Ruta "/admin/stock" → <GestionStock />
 *
 * El admin sólo ve (y edita) el stock de su sucursal: GET /api/stock ignora
 * cualquier `sucursalId` de la query y las operaciones se acotan a la propia
 * (`acotarASucursalPropia`). Por eso no hay filtro por sucursal; la sucursal
 * de los alta sale de la sesión (`user.sucursalId`).
 *
 * El stock es a nivel producto terminado (DER §2.10): una fila es el par
 * (sucursalId, productoId). Para un combo la cantidad NO se edita: sale del
 * stock de sus componentes, así que el backend la calcula y esta pantalla la
 * muestra. Un combo aparece en el catálogo de la sucursal y se puede apagar,
 * pero su número se arma solo con la receta.
 */

import { useEffect, useMemo, useState } from 'react';
import { Container, Table, Button, Spinner, Badge, Form, Alert } from 'react-bootstrap';
import { FaPlus, FaTrashAlt, FaBoxes } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import {
  obtenerStock,
  crearStock,
  actualizarStock,
  eliminarStock,
} from '../../api/stock';
import { obtenerProductos } from '../../api/productos';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';

const GestionStock = () => {
  const { notificar } = useNotificaciones();
  const { user } = useAuth();
  const sucursalPropia = user?.sucursalId;

  const [stocks, setStocks] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  // Fila esperando confirmación de borrado
  const [stockAEliminar, setStockAEliminar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  // El único filtro que viaja al backend es el de producto: el de sucursal no
  // existe porque el admin siempre ve (y opera) el stock de SU sucursal.
  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const filtros = {
        ...(productoId ? { productoId } : {}),
      };
      const [resultadoStock, resultadoProductos] = await Promise.all([
        obtenerStock(filtros),
        obtenerProductos(),
      ]);
      if (resultadoStock.success) setStocks(resultadoStock.data || []);
      else setError(resultadoStock.error || 'No se pudo cargar el stock.');
      if (resultadoProductos.success) setProductos(resultadoProductos.data || []);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId]);

  // Productos del catálogo que todavía no están en la sucursal elegida. Se deduce
  // de las filas cargadas, así que sólo sirve cuando la tabla muestra todo el
  // stock de la sucursal: con un producto filtrado, `stocks` trae una sola fila y
  // el resto del catálogo aparecería como "disponible" cuando ya está en la
  // sucursal. Por eso el alta se oculta mientras haya filtro de producto.
  const productosDisponibles = useMemo(() => {
    const enEstaSucursal = new Set(
      stocks.map((s) => Number(s.productoId))
    );
    return productos.filter((p) => !enEstaSucursal.has(Number(p.id)));
  }, [productos, stocks]);

  const hayFiltroDeProducto = Boolean(productoId);

  const [productoNuevo, setProductoNuevo] = useState('');

  const agregarProducto = async () => {
    if (!sucursalPropia || !productoNuevo) {
      notificar('No tenés sucursal asignada para agregar productos.', 'warning');
      return;
    }
    setGuardando(true);
    const resultado = await crearStock(sucursalPropia, productoNuevo);
    if (resultado.success) {
      notificar(`"${resultado.data.producto}" agregado a la sucursal.`, 'success');
      setProductoNuevo('');
      await cargar();
    } else {
      notificar(resultado.error || 'No se pudo agregar.', 'danger');
    }
    setGuardando(false);
  };

  // Guarda la cantidad o la disponibilidad editada en la fila.
  const guardarFila = async (fila, cambios) => {
    setGuardando(true);
    const resultado = await actualizarStock(fila.sucursalId, fila.productoId, cambios);
    if (resultado.success) {
      notificar('Stock actualizado.', 'success');
      await cargar();
    } else {
      notificar(resultado.error || 'No se pudo actualizar.', 'danger');
    }
    setGuardando(false);
  };

  const confirmarEliminar = async () => {
    if (!stockAEliminar) return;
    setConfirmando(true);
    const resultado = await eliminarStock(
      stockAEliminar.sucursalId,
      stockAEliminar.productoId
    );
    notificar(
      resultado.success
        ? `"${stockAEliminar.producto}" sacado del catálogo de la sucursal.`
        : resultado.error || 'No se pudo eliminar.',
      resultado.success ? 'success' : 'danger'
    );
    setStockAEliminar(null);
    setConfirmando(false);
    await cargar();
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="h2 mb-0">Stock por sucursal</h1>
        <Button variant="outline-primary" onClick={cargar} disabled={cargando}>
          <FaBoxes className="me-1" aria-hidden="true" />
          Recargar
        </Button>
      </div>

      <p className="text-muted">
        El stock es por producto terminado: una fila es la sucursal + producto.
        Si un producto no tiene fila en la sucursal, ahí no se puede pedir. En
        los combos la cantidad no se edita: sale de la stock de los componentes,
        así que se ajusta sola.
      </p>

      <div className="d-flex gap-2 align-items-end flex-wrap mb-3">
        <Form.Group className="filtro-stock" controlId="stock-filtro-producto">
          <Form.Label className="small mb-1">Producto</Form.Label>
          <Form.Select
            name="productoId"
            value={productoId}
            onChange={(e) => setProductoId(e.target.value)}
          >
            <option value="">Todos los productos</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
                {p.tipo === 'COMBO' ? ' (combo)' : ''}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {!hayFiltroDeProducto && (
          <>
            <Form.Group className="filtro-stock" controlId="stock-agregar-producto">
              <Form.Label className="small mb-1">
                Agregar producto a la sucursal
              </Form.Label>
              <Form.Select
                name="productoNuevo"
                value={productoNuevo}
                onChange={(e) => setProductoNuevo(e.target.value)}
              >
                <option value="">Seleccionar producto</option>
                {productosDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                    {p.tipo === 'COMBO' ? ' (combo)' : ''}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Button
              variant="primary"
              className="boton-agregar-stock"
              onClick={agregarProducto}
              disabled={guardando || !productoNuevo}
            >
              <FaPlus className="me-1" aria-hidden="true" />
              Agregar
            </Button>
          </>
        )}
      </div>

      {error && <Alert variant="danger" role="alert">{error}</Alert>}

      {cargando ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : (
        <Table striped bordered hover responsive className="tabla-admin shadow-sm">
          <thead className="table-dark">
            <tr>
              <th>Sucursal</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Disponible</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {stocks.length === 0 && (
              <tr>
                <td colSpan={5} className="stock-vacio text-center">
                  No hay stock cargado para tu sucursal. Agregá productos para empezar.
                </td>
              </tr>
            )}
            {stocks.map((fila) => {
              const esCombo = fila.tipo === 'COMBO';
              return (
                <tr key={`${fila.sucursalId}-${fila.productoId}`}>
                  <td data-label="Sucursal">{fila.sucursal}</td>
                  <td data-label="Producto">
                    {fila.producto}
                    {esCombo && (
                      <Badge bg="info" className="ms-2">
                        combo
                      </Badge>
                    )}
                  </td>
                  <td data-label="Cantidad" className="stock-cantidad">
                    {esCombo ? (
                      <>
                        {/* En un combo el número no se toca: el backend lo
                            deriva de la receta. Se muestra junto a la receta
                            para que se entienda de dónde sale. */}
                        <span className="fs-5">{fila.cantidad}</span>
                        <Form.Text className="d-block small text-muted mt-1">
                          se arma con el stock de sus componentes
                        </Form.Text>
                      </>
                    ) : (
                      <Form.Control
                        type="number"
                        min="0"
                        step="1"
                        size="sm"
                        defaultValue={fila.cantidad}
                        key={`${fila.productoId}-${fila.cantidad}-${fila.sucursalId}`}
                        onKeyDown={(e) => {
                          // Enter guarda la cantidad. Se delega en el onBlur en
                          // lugar de llamar a guardarFila acá: si se guardara
                          // directo y después se quitara el foco, el onBlur
                          // dispararía un segundo guardado con el valor viejo
                          // (la fila todavía no se había actualizado).
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={(e) => {
                          const valor = Number(e.target.value);
                          if (valor !== fila.cantidad && Number.isInteger(valor) && valor >= 0) {
                            guardarFila(fila, { cantidad: valor });
                          }
                        }}
                      />
                    )}
                  </td>
                  <td data-label="Disponible">
                    <Form.Check
                      type="switch"
                      id={`disp-${fila.sucursalId}-${fila.productoId}`}
                      label={fila.disponible ? 'Sí' : 'No'}
                      checked={Boolean(fila.disponible)}
                      disabled={guardando}
                      onChange={(e) =>
                        guardarFila(fila, { disponible: e.target.checked })
                      }
                    />
                  </td>
                  <td className="columna-acciones text-nowrap">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setStockAEliminar(fila)}
                    >
                      <FaTrashAlt className="me-1" aria-hidden="true" />
                      Quitar
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      <ConfirmarModal
        mostrar={Boolean(stockAEliminar)}
        titulo="Quitar producto de la sucursal"
        mensaje={
          stockAEliminar
            ? `¿Seguro que querés quitar "${stockAEliminar.producto}" del catálogo de ${stockAEliminar.sucursal}? Los pedidos que ya se hicieron no se ven afectados.`
            : ''
        }
        textoConfirmar="Sí, quitar"
        cargando={confirmando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setStockAEliminar(null)}
      />
    </Container>
  );
};

export default GestionStock;