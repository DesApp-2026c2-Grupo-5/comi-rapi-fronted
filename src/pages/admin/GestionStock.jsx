/**
 * Propósito: Pantalla de stock por sucursal para el administrador.
 * Contenido: Filtro por sucursal, tabla producto×cantidad con edición en el
 *            lugar, alta de un producto al catálogo de la sucursal y el detalle de
 *            qué frena a cada combo.
 * Dependencias: react-bootstrap, react-icons, api/stock.js, api/productos.js,
 *               context/SucursalContext (useSucursal).
 * Uso: Ruta "/admin/stock" → <GestionStock />
 *
 * El stock es a nivel producto terminado (DER §2.10): una fila es el par
 * (sucursalId, productoId). Para un combo la cantidad es "combos en venta" y
 * está acotada por lo que da el stock de sus componentes, por eso se muestra
 * `maximoPorComponentes` y el backend rechaza un valor mayor.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Container, Table, Button, Spinner, Badge, Form, Alert, Card } from 'react-bootstrap';
import { FaPlus, FaTrashAlt, FaBoxes } from 'react-icons/fa';
import { useSucursal } from '../../hooks/useSucursal';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import {
  obtenerStock,
  crearStock,
  actualizarStock,
  eliminarStock,
  obtenerDisponibilidad,
  obtenerMaximosDeCombos,
} from '../../api/stock';
import { obtenerProductos } from '../../api/productos';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';

// "1 combo" / "3 combos": el detalle del combo muestra tres números y sin esto
// quedan "1 combos".
const conPalabra = (cantidad, palabra) =>
  `${cantidad} ${cantidad === 1 ? palabra : `${palabra}s`}`;

const GestionStock = () => {
  const { notificar } = useNotificaciones();
  const { sucursales } = useSucursal();

  const [stocks, setStocks] = useState([]);
  const [productos, setProductos] = useState([]);
  const [sucursalId, setSucursalId] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  // Fila a la que se le pide el detalle de combo (qué componente lo frena)
  const [detalle, setDetalle] = useState(null);
  // Fila esperando confirmación de borrado
  const [stockAEliminar, setStockAEliminar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  // El detalle abierto corresponde a una sola fila (sucursal + producto): con
  // el filtro "todas las sucursales" el mismo combo aparece varias veces, y sin
  // esta comparación el detalle se dibujaría bajo todas ellas con los números
  // de una sola sucursal.
  const esFilaDelDetalle = (fila) =>
    detalle !== null &&
    detalle.productoId === fila.productoId &&
    detalle.sucursalId === fila.sucursalId;

  // El filtro va al backend: `GET /api/stock` ya acepta sucursalId y productoId,
  // así que la tabla nunca trae más de lo que se está mirando.
  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      const filtros = {
        ...(sucursalId ? { sucursalId } : {}),
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
  }, [sucursalId, productoId]);

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

  // Combo que se está mirando en el filtro, con su receta. El catálogo que ya
  // está cargado la trae (`obtenerProductos` incluye `componentes` en los combos),
  // así que no hace falta pedirla otra vez.
  const comboFiltrado = useMemo(
    () => productos.find((p) => Number(p.id) === Number(productoId)) || null,
    [productos, productoId]
  );
  const esComboFiltrado = comboFiltrado?.tipo === 'COMBO';
  const recetaCombo = esComboFiltrado ? comboFiltrado.componentes || [] : [];
  // Firma de la receta, para pedir los máximos sólo cuando la receta cambia de
  // verdad y no cada vez que se recarga el catálogo.
  const recetaKey = recetaCombo
    .map((c) => `${c.productoId}:${c.cantidad}`)
    .join(',');

  const [maximos, setMaximos] = useState(null);
  const [calculandoMaximos, setCalculandoMaximos] = useState(false);
  const [errorMaximos, setErrorMaximos] = useState('');

  // Cuántos combos arma cada sucursal con su stock, y qué producto frena a cada
  // una. Es el mismo cálculo que muestra el editor de receta al armarla, pero acá
  // sobre el stock real y actualizado.
  useEffect(() => {
    if (!recetaKey) {
      setMaximos(null);
      setErrorMaximos('');
      setCalculandoMaximos(false);
      return undefined;
    }
    let vigente = true;
    setCalculandoMaximos(true);
    setErrorMaximos('');
    obtenerMaximosDeCombos(recetaCombo).then((resultado) => {
      if (!vigente) return;
      if (resultado.success) {
        setMaximos(resultado.data || []);
      } else {
        setMaximos(null);
        setErrorMaximos(resultado.error || 'No se pudo calcular el máximo.');
      }
      setCalculandoMaximos(false);
    });
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recetaKey]);

  // Con una sucursal elegida el panel se limita a ella: el resto ya está
  // descartado por el filtro de la tabla.
  const maximosVisibles = useMemo(() => {
    if (!maximos) return [];
    if (!sucursalId) return maximos;
    return maximos.filter((m) => Number(m.sucursalId) === Number(sucursalId));
  }, [maximos, sucursalId]);

  const [productoNuevo, setProductoNuevo] = useState('');

  const agregarProducto = async () => {
    if (!sucursalId || !productoNuevo) {
      notificar('Elegí una sucursal y un producto.', 'warning');
      return;
    }
    setGuardando(true);
    const resultado = await crearStock(sucursalId, productoNuevo);
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
      // Caso típico: combo con más combos en venta de los que arma el stock.
      notificar(resultado.error || 'No se pudo actualizar.', 'danger');
    }
    setGuardando(false);
  };

  const verDetalle = async (fila) => {
    // El detalle pertenece a la fila, no al producto: el mismo combo puede estar
    // en varias sucursales y cada una arma una cantidad distinta.
    if (esFilaDelDetalle(fila)) {
      setDetalle(null);
      return;
    }
    const resultado = await obtenerDisponibilidad(fila.sucursalId, fila.productoId);
    if (resultado.success) setDetalle(resultado.data);
    else notificar(resultado.error || 'No se pudo leer la disponibilidad.', 'danger');
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
        El stock es por producto terminado: una fila es el par sucursal + producto.
        Si un producto no tiene fila en la sucursal, ahí no se puede pedir.
      </p>

      <div className="d-flex gap-2 align-items-end flex-wrap mb-3">
        <Form.Group className="filtro-stock" controlId="stock-filtro-sucursal">
          <Form.Label className="small mb-1">Sucursal</Form.Label>
          <Form.Select
            name="sucursalId"
            value={sucursalId}
            onChange={(e) => setSucursalId(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

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

        {sucursalId && !hayFiltroDeProducto && (
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

      {/* Al filtrar por un combo se muestra su receta y, por sucursal, para
          cuántos combos da el stock. La tabla de abajo sigue mostrando la fila del
          combo, que es otra cosa: cuántos combos puso en venta el admin. */}
      {esComboFiltrado && (
        <Card className="mb-3 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
              {/* h6 sin h5 ni h4 arriba: el salto de nivel rompe la navegación
                  por encabezados. Bajo el <h1> de la página va como <h2>. */}
              <Card.Title as="h2" className="h6 mb-0">
                {comboFiltrado.nombre}
              </Card.Title>
              {calculandoMaximos && (
                <div
                  className="d-flex align-items-center gap-2 text-muted small"
                  role="status"
                  aria-live="polite"
                >
                  <Spinner animation="border" size="sm" aria-hidden="true" />
                  Calculando…
                </div>
              )}
            </div>

            {errorMaximos && <Alert variant="danger" role="alert">{errorMaximos}</Alert>}

            {!recetaCombo.length && !calculandoMaximos && (
              <Alert variant="warning" className="mb-0">
                Este combo no tiene receta cargada, así que no se puede armar.
              </Alert>
            )}

            {recetaCombo.length > 0 && (
              <>
                <p className="text-muted small mb-2">
                  Un combo lleva:{' '}
                  {recetaCombo
                    .map(
                      (c) =>
                        `${c.cantidad} × ${
                          c.nombre ?? `producto ${c.productoId}`
                        }`
                    )
                    .join('  +  ')}
                </p>
                <div className="d-flex flex-column gap-1">
                  {maximosVisibles.map((fila) => (
                    <div
                      key={fila.sucursalId}
                      className="d-flex justify-content-between align-items-center border rounded px-2 py-1"
                    >
                      <span>{fila.sucursal}</span>
                      <Badge bg={fila.maximo > 0 ? 'success' : 'secondary'}>
                        da para {conPalabra(fila.maximo, 'combo')}
                      </Badge>
                    </div>
                  ))}
                  {maximosVisibles.length === 0 && !calculandoMaximos && (
                    <span className="text-muted small">
                      No hay sucursales activas para las que calcular el máximo.
                    </span>
                  )}
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      )}

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
                  No hay stock cargado. Elegí una sucursal y agregá productos.
                </td>
              </tr>
            )}
            {stocks.map((fila) => (
              <React.Fragment key={`${fila.sucursalId}-${fila.productoId}`}>
                <tr>
                  <td data-label="Sucursal">{fila.sucursal}</td>
                  <td data-label="Producto">
                    {fila.producto}
                    {fila.tipo === 'COMBO' && (
                      <Badge bg="info" className="ms-2">
                        combo
                      </Badge>
                    )}
                  </td>
                  <td data-label="Cantidad" className="stock-cantidad">
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
                    {fila.tipo === 'COMBO' && (
                      <Button
                        variant="outline-info"
                        size="sm"
                        className="me-2"
                        onClick={() => verDetalle(fila)}
                      >
                        {esFilaDelDetalle(fila) ? 'Ocultar' : 'Máximo'}
                      </Button>
                    )}
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
                {esFilaDelDetalle(fila) && (
                  <tr className="detalle-combo">
                    <td colSpan={5} className="bg-light">
                      <div className="py-2">
                        <strong>{fila.producto}</strong> en {fila.sucursal}: en
                        venta {detalle.cantidad}, el stock de los componentes
                        alcanza para{' '}
                        {conPalabra(detalle.maximoPorComponentes, 'combo')},
                        así que se pueden vender{' '}
                        <Badge bg={detalle.disponibles > 0 ? 'success' : 'danger'}>
                          {conPalabra(detalle.disponibles, 'combo')}
                        </Badge>
                        {!detalle.disponible && (
                          <span className="text-danger ms-2">
                            (la fila está marcada como no disponible, así que no
                            se venden ninguno)
                          </span>
                        )}
                        <ul className="mb-0 mt-2">
                          {detalle.componentes.map((c) => (
                            <li key={c.productoId}>
                              Producto {c.productoId}: {c.cantidad} por combo
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
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
