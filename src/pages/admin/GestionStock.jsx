/**
 * Propósito: Pantalla de stock de la sucursal del administrador.
 * Contenido: Dos pestañas: "Stock de mi sucursal" (filtro por producto y tabla
 *            producto×cantidad con edición en el lugar; en los combos muestra
 *            cuántos se pueden armar con el stock actual) y "Por agregar" (alta
 *            al catálogo de la sucursal de los productos que todavía no están
 *            cargados, p. ej. los que crea el superadministrador).
 * Dependencias: react-bootstrap, react-icons, api/stock.js, api/productos.js,
 *               context/AuthContext (useAuth), components/comunes/Skeleton
 *               (SkeletonTabla).
 *
 * Un administrador tiene UNA sola sucursal asignada, así que la pantalla no
 * ofrece selector de sucursal: opera siempre sobre la suya (`user.sucursalId`) y
 * el backend acota el stock a esa sucursal.
 * Uso: Ruta "/admin/stock" → <GestionStock />
 *
 * El stock es a nivel producto terminado (DER §2.10): una fila es el par
 * (sucursalId, productoId). Para un combo la cantidad NO se edita: sale del
 * stock de sus componentes, así que el backend la calcula y esta pantalla la
 * muestra. Un combo aparece en el catálogo de la sucursal y se puede apagar,
 * pero su número se arma solo con la receta.
 */

import { useEffect, useMemo, useState } from 'react';
import { Container, Table, Button, Badge, Form, Alert, Tabs, Tab } from 'react-bootstrap';
import { FaPlus, FaTrashAlt, FaBoxes, FaPlusCircle } from 'react-icons/fa';
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
import { SkeletonTabla } from '../../components/comunes/Skeleton';

const GestionStock = () => {
  const { notificar } = useNotificaciones();
  const { user } = useAuth();
  // La sucursal del admin: única y fija. El backend además acota el stock a
  // ella, así que no hay nada que elegir en la pantalla.
  const sucursalId = user?.sucursalId ? String(user.sucursalId) : '';

  const [stocks, setStocks] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  // Fila esperando confirmación de borrado
  const [stockAEliminar, setStockAEliminar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  // Pestaña activa: "stock" (el stock de la sucursal) o "nuevos" (por agregar).
  const [pestana, setPestana] = useState('stock');

  // El filtro va al backend: `GET /api/stock` ya acepta productoId; el
  // `sucursalId` no se envía porque el backend usa la sucursal de la sesión.
  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const filtros = productoId ? { productoId } : {};
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
  // sucursal.
  const productosDisponibles = useMemo(() => {
    const enEstaSucursal = new Set(
      stocks.map((s) => Number(s.productoId))
    );
    return productos.filter((p) => !enEstaSucursal.has(Number(p.id)));
  }, [productos, stocks]);

  const [productoNuevo, setProductoNuevo] = useState('');

  const agregarProducto = async (prodIdParam) => {
    const prodId = prodIdParam ?? productoNuevo;
    if (!sucursalId || !prodId) {
      notificar('Elegí un producto.', 'warning');
      return;
    }
    setGuardando(true);
    const resultado = await crearStock(sucursalId, prodId);
    if (resultado.success) {
      notificar(`"${resultado.data.producto}" agregado a la sucursal.`, 'success');
      setProductoNuevo('');
      await cargar();
      setPestana('stock');
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

      {error && <Alert variant="danger" role="alert">{error}</Alert>}

      <Tabs
        id="stock-tabs"
        activeKey={pestana}
        onSelect={(clave) => setPestana(clave || 'stock')}
        className="mb-3"
        fill
      >
        <Tab
          eventKey="stock"
          title={
            <>
              <FaBoxes className="me-1" aria-hidden="true" />
              Stock de mi sucursal
            </>
          }
        >
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
          </div>

          {cargando ? (
            <div role="status" aria-live="polite">
              <span className="visually-hidden">Cargando stock…</span>
              <SkeletonTabla filas={5} columnas={4} />
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
                      No hay stock cargado. Agregá productos del catálogo en la
                      pestaña <strong>Por agregar</strong>.
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
        </Tab>

        <Tab
          eventKey="nuevos"
          title={
            <>
              <FaPlusCircle className="me-1" aria-hidden="true" />
              Por agregar
              {productosDisponibles.length > 0 && (
                <Badge bg="warning" text="dark" className="ms-2">
                  {productosDisponibles.length}
                </Badge>
              )}
            </>
          }
        >
          <p className="text-muted">
            Productos del catálogo que todavía no están en el stock de tu sucursal
            (por ejemplo, los que crea el superadministrador). Elegí uno y agregalo
            con el botón; después le cargás la cantidad desde{' '}
            <strong>Stock de mi sucursal</strong>.
          </p>

          {productosDisponibles.length === 0 ? (
            <Alert variant="info" role="alert" className="text-center">
              No hay productos nuevos para agregar: todos los del catálogo ya están
              cargados en tu sucursal.
            </Alert>
          ) : (
            <Table striped bordered hover responsive className="tabla-admin shadow-sm">
              <thead className="table-dark">
                <tr>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosDisponibles.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Producto">{p.nombre}</td>
                    <td data-label="Tipo">
                      {p.tipo === 'COMBO' ? (
                        <Badge bg="info">combo</Badge>
                      ) : (
                        <Badge bg="secondary">producto</Badge>
                      )}
                    </td>
                    <td className="text-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => agregarProducto(p.id)}
                        disabled={guardando}
                      >
                        <FaPlus className="me-1" aria-hidden="true" />
                        Agregar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Tab>
      </Tabs>

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
