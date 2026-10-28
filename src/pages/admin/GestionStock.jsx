/**
 * Propósito: Pantalla de stock de la sucursal del administrador.
 * Contenido: Dos pestañas: "Stock de mi sucursal" (filtros por tipo de ítem,
 *            producto y estado; tabla ítem×cantidad con edición en el lugar y
 *            aviso de lo que necesita reposición) y "Por agregar" (alta al
 *            catálogo de la sucursal de los productos que todavía no están
 *            cargados, p. ej. los que crea el superadministrador).
 * Dependencias: react-bootstrap, react-icons, api/stock.js, api/productos.js,
 *               hooks/useAuth, hooks/useParametros, utils/estadoStock,
 *               components/comunes/Skeleton (SkeletonTabla).
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
 *
 * Los extras y condimentos tienen stock propio (InsumoStock). Comparten la
 * tabla con los productos para que el admin vea todo lo que vende, pero se
 * distinguen con el filtro principal y el badge de tipo. Su cantidad sí se
 * edita: no tienen receta.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Container, Table, Button, ButtonGroup, Badge, Form, Alert, Tabs, Tab } from 'react-bootstrap';
import { FaPlus, FaTrashAlt, FaBoxes, FaPlusCircle } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useSucursalOperativa } from '../../hooks/useSucursalOperativa';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { useParametros } from '../../hooks/useParametros';
import {
  obtenerStock,
  obtenerStockDeProducto,
  obtenerStockInsumos,
  crearStock,
  actualizarStock,
  actualizarStockInsumo,
  eliminarStock,
} from '../../api/stock';
import { obtenerProductos } from '../../api/productos';
import { ESTADOS_STOCK, estadoDeStock } from '../../utils/estadoStock';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';
import { conectarSocket, EVENTOS_SOCKET } from '../../services/socket';
import { SkeletonTabla } from '../../components/comunes/Skeleton';

// Cómo se muestra cada estado en la columna "Estado". "En stock" queda como
// texto muted para que la vista no se llene de badges verdes: lo que importa
// son los productos que necesitan reposición.
const ETIQUETA_ESTADO = {
  [ESTADOS_STOCK.NO_DISPONIBLE]: { texto: 'No disponible', bg: 'secondary' },
  [ESTADOS_STOCK.SIN_STOCK]: { texto: 'Sin stock', bg: 'danger' },
  [ESTADOS_STOCK.BAJO_STOCK]: { texto: 'Bajo stock', bg: 'warning', text: 'dark' },
  [ESTADOS_STOCK.EN_STOCK]: { texto: 'En stock', bg: 'success' },
};

// Refuerzo visual de la fila. En mobile la tabla se arma como tarjetas y el
// badge sigue siendo la señal principal.
const CLASE_FILA = {
  [ESTADOS_STOCK.SIN_STOCK]: 'table-danger',
  [ESTADOS_STOCK.BAJO_STOCK]: 'table-warning',
};

const MENSAJE_VACIO = {
  [ESTADOS_STOCK.SIN_STOCK]: 'No hay ítems sin stock en esta sucursal.',
  [ESTADOS_STOCK.BAJO_STOCK]: 'No hay ítems con bajo stock en esta sucursal.',
  [ESTADOS_STOCK.NO_DISPONIBLE]:
    'No hay ítems no disponibles en esta sucursal.',
};

const FILTROS_PRINCIPALES = [
  { clave: 'todos', etiqueta: 'Todos' },
  { clave: 'productos', etiqueta: 'Productos' },
  { clave: 'combos', etiqueta: 'Combos' },
  { clave: 'insumos', etiqueta: 'Insumos' },
];

const ETIQUETA_TIPO_INSUMO = {
  extra: 'extra',
  condimento: 'condimento',
};

const GestionStock = () => {
  const { notificar } = useNotificaciones();
  const { parametros } = useParametros();
  // Mismo umbral que usan los reportes. 0 lo desactiva: en ese caso sólo se
  // marcan los productos sin stock o apagados.
  const umbral = Number(parametros.stockCriticoUmbral ?? 0);
  const { user, hydrated } = useAuth();
  // La sucursal operativa de la sesión: la asignada del admin o el contexto
  // elegido del superadmin. El backend además acota el stock a ella, así que
  // no hay nada que elegir en la pantalla. Sin sucursal operativa (superadmin
  // sin contexto) no se carga nada: el aviso pide elegir una sucursal.
  const { sucursalOperativa, sucursalOperativaId } = useSucursalOperativa();
  const sucursalId = sucursalOperativaId ? String(sucursalOperativaId) : '';

  const [stocks, setStocks] = useState([]);
  const [stocksInsumos, setStocksInsumos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  // Avance del alta masiva (0 de N) mientras recorre los faltantes. Null cuando
  // no hay un alta masiva en curso.
  const [progreso, setProgreso] = useState(null);
  const [error, setError] = useState('');
  // Fila esperando confirmación de borrado
  const [stockAEliminar, setStockAEliminar] = useState(null);
  // Fila de insumo esperando confirmación para dejar de ofrecerse en la sucursal.
  const [insumoAQuitar, setInsumoAQuitar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  // Pestaña activa: "stock" (el stock de la sucursal) o "nuevos" (por agregar).
  const [pestana, setPestana] = useState('stock');
  // Filtro por estado de la tabla de stock. Es local: las filas ya están en
  // memoria y no hace falta pedirle otra cosa al backend.
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  // Filtro principal: todos, productos simples, combos o insumos. Los insumos
  // tienen además su sub-filtro por tipo (extras/condimentos).
  const [filtroPrincipal, setFiltroPrincipal] = useState('todos');
  const [filtroTipoInsumo, setFiltroTipoInsumo] = useState('todos');

  // El filtro de producto va al backend: `GET /api/stock` ya acepta productoId;
  // el `sucursalId` no se envía porque el backend usa la sucursal de la sesión.
  // Los insumos se piden siempre: su listado es chico y así el filtro principal
  // no depende de una segunda carga.
  const cargar = async () => {
    // Sin sucursal operativa (superadmin sin contexto) no hay nada que
    // cargar: el backend respondería 403 y la pantalla muestra el aviso.
    if (!sucursalId) return;
    setCargando(true);
    setError('');
    try {
      const filtros = productoId ? { productoId } : {};
      const [resultadoStock, resultadoProductos, resultadoInsumos] =
        await Promise.all([
          obtenerStock(filtros),
          obtenerProductos(),
          obtenerStockInsumos(),
        ]);
      if (resultadoStock.success) setStocks(resultadoStock.data || []);
      else setError(resultadoStock.error || 'No se pudo cargar el stock.');
      if (resultadoProductos.success) setProductos(resultadoProductos.data || []);
      if (resultadoInsumos.success) {
        setStocksInsumos(resultadoInsumos.data || []);
      } else if (!resultadoStock.success) {
        setError(resultadoInsumos.error || 'No se pudo cargar el stock de insumos.');
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoId, sucursalId]);

  useEffect(() => {
    if (!hydrated || !user) return undefined;
    const instancia = conectarSocket();
    // Resincroniza por REST al reconectar: si se perdió un cambio durante una
    // desconexión, el aviso no llegó. La carga inicial la hace el useEffect de
    // arriba, por eso no se pide aquí.
    const alConectar = () => cargar();
    // Una compra avisa qué filas de esta sucursal cambiaron. Se releen sólo esas
    // filas y se fusionan en la tabla, en vez de refrescar todo: el admin ve el
    // número cambiar sin que la pantalla recargue. El evento sólo va a la room de
    // la sucursal afectada; el filtro por sucursalId es defensa por si el backend
    // emitiera a más de una room.
    const alStock = async (payload) => {
      if (Number(payload?.sucursalId) !== Number(sucursalId)) return;

      const tieneInsumos = Array.isArray(payload?.insumoIds);
      const tieneProductos = Array.isArray(payload?.productoIds);

      // Los insumos no tienen endpoint individual de stock: se relee el listado
      // completo (es corto) y se reemplaza. El evento llega tanto por compras
      // como por ediciones del admin en otra pestaña.
      if (tieneInsumos) {
        const resultadoInsumos = await obtenerStockInsumos();
        if (resultadoInsumos.success) {
          setStocksInsumos(resultadoInsumos.data || []);
        }
      }

      if (!tieneProductos) {
        // Un evento sólo de insumos ya quedó resuelto arriba. Recargar todo acá
        // haría parpadear la tabla y perdería el foco. Sólo se recarga si el
        // payload no traía ningún id (aviso genérico).
        if (!tieneInsumos) await cargar();
        return;
      }
      // Con un filtro activo la tabla sólo muestra ese producto: si el cambio no
      // es suyo, no hay nada visible que actualizar.
      const ids = payload.productoIds
        .map(Number)
        .filter((id) => id && (!productoId || String(id) === String(productoId)));
      if (ids.length === 0) return;
      const resultados = await Promise.all(
        ids.map((id) => obtenerStockDeProducto(sucursalId, id))
      );
      const filas = resultados
        .filter((r) => r.success && r.data)
        .map((r) => r.data);
      if (filas.length === 0) return;
      setStocks((prev) => {
        const porClave = new Map(
          prev.map((f) => [`${f.sucursalId}-${f.productoId}`, f])
        );
        filas.forEach((f) => porClave.set(`${f.sucursalId}-${f.productoId}`, f));
        return [...porClave.values()];
      });
    };
    instancia.on('connect', alConectar);
    instancia.on(EVENTOS_SOCKET.STOCK_ACTUALIZADO, alStock);
    return () => {
      instancia.off('connect', alConectar);
      instancia.off(EVENTOS_SOCKET.STOCK_ACTUALIZADO, alStock);
    };
    // `productoId` va en las deps: el handler cierra sobre el filtro vigente.
    // Sin él, un evento fusionaría filas con el filtro viejo. `sucursalId`
    // también: al cambiar el contexto del superadmin, el filtro de defensa y
    // las refencias de las filas tienen que apuntar a la sucursal nueva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, user, productoId, sucursalId]);

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

  // El estado se deriva de la fila y no se guarda en el estado base: así la
  // tabla se actualiza sola cuando el admin edita una cantidad o cuando llega
  // un cambio por WebSocket. `clase` distingue productos de insumos en la misma
  // tabla.
  const filasConEstado = useMemo(
    () => [
      ...stocks.map((fila) => ({
        ...fila,
        clase: 'producto',
        estado: estadoDeStock(fila, umbral),
      })),
      ...stocksInsumos.map((fila) => ({
        ...fila,
        clase: 'insumo',
        estado: estadoDeStock(fila, umbral),
      })),
    ],
    [stocks, stocksInsumos, umbral]
  );

  const conteos = useMemo(
    () => ({
      todos: filasConEstado.length,
      productos: stocks.filter((f) => f.tipo !== 'COMBO').length,
      combos: stocks.filter((f) => f.tipo === 'COMBO').length,
      insumos: stocksInsumos.length,
    }),
    [filasConEstado.length, stocks, stocksInsumos.length]
  );

  const resumen = useMemo(() => {
    const conteo = {
      sinStock: 0,
      bajoStock: 0,
      noDisponible: 0,
      enStock: 0,
      total: 0,
    };
    filasConEstado.forEach(({ estado }) => {
      if (estado === ESTADOS_STOCK.SIN_STOCK) conteo.sinStock += 1;
      else if (estado === ESTADOS_STOCK.BAJO_STOCK) conteo.bajoStock += 1;
      else if (estado === ESTADOS_STOCK.NO_DISPONIBLE) conteo.noDisponible += 1;
      else conteo.enStock += 1;
      conteo.total += 1;
    });
    return { ...conteo, faltantes: conteo.sinStock + conteo.bajoStock };
  }, [filasConEstado]);

  // Filtro principal (todos/productos/combos/insumos) y, dentro de insumos, el
  // sub-filtro por tipo. El filtro de estado se aplica al final sobre lo visible.
  const filasVisibles = useMemo(() => {
    const porPrincipal = filasConEstado.filter((fila) => {
      if (filtroPrincipal === 'productos') {
        return fila.clase === 'producto' && fila.tipo !== 'COMBO';
      }
      if (filtroPrincipal === 'combos') {
        return fila.clase === 'producto' && fila.tipo === 'COMBO';
      }
      if (filtroPrincipal === 'insumos') {
        return (
          fila.clase === 'insumo' &&
          (filtroTipoInsumo === 'todos' || fila.tipo === filtroTipoInsumo)
        );
      }
      return true;
    });
    return estadoFiltro === 'todos'
      ? porPrincipal
      : porPrincipal.filter((fila) => fila.estado === estadoFiltro);
  }, [filasConEstado, filtroPrincipal, filtroTipoInsumo, estadoFiltro]);

  // Si el filtro por estado queda vacío porque se resolvió el último ítem (por
  // ejemplo, se cargó stock del único producto sin stock), volvemos a "Todos"
  // para no dejar al admin en una pantalla vacía. Sólo se dispara cuando el
  // filtro no cambió y la cantidad visible pasó de tener ítems a cero: si el
  // filtro se elige cuando ya estaba vacío, se respeta y se muestra el mensaje.
  const cantidadVisible = filasVisibles.length;
  const cantidadVisiblePrevia = useRef(cantidadVisible);
  const estadoFiltroPrevio = useRef(estadoFiltro);
  useEffect(() => {
    const cambioDeFiltro = estadoFiltroPrevio.current !== estadoFiltro;
    if (
      !cambioDeFiltro &&
      estadoFiltro !== 'todos' &&
      cantidadVisiblePrevia.current > 0 &&
      cantidadVisible === 0
    ) {
      setEstadoFiltro('todos');
    }
    estadoFiltroPrevio.current = estadoFiltro;
    cantidadVisiblePrevia.current = cantidadVisible;
  }, [cantidadVisible, estadoFiltro]);

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

  // Alta masiva de los faltantes. El backend da de alta un producto por request,
  // así que se recorre la lista de a uno y se informa el avance. Si alguno falla
  // se deja la pestaña abierta con lo que quedó, para reintentar sin tener que
  // agregar a mano los que ya entraron.
  const agregarTodos = async () => {
    if (!sucursalId || productosDisponibles.length === 0) return;
    const total = productosDisponibles.length;
    setGuardando(true);
    setProgreso({ hechos: 0, total });
    let agregados = 0;
    const errores = [];
    for (const producto of productosDisponibles) {
      const resultado = await crearStock(sucursalId, producto.id);
      if (resultado.success) agregados += 1;
      else errores.push(producto.nombre);
      setProgreso({ hechos: agregados + errores.length, total });
    }
    setProgreso(null);
    setGuardando(false);
    await cargar();
    if (errores.length === 0) {
      notificar(
        agregados === 1
          ? 'Producto agregado a la sucursal.'
          : `${agregados} productos agregados a la sucursal.`,
        'success'
      );
      setPestana('stock');
      return;
    }
    notificar(
      `Se agregaron ${agregados} de ${total}. No se pudieron agregar: ${errores.join(
        ', '
      )}.`,
      'danger'
    );
  };

  // Guarda la cantidad o la disponibilidad editada en la fila. El PUT devuelve
  // la fila ya serializada por el backend (la autoridad): se aplica directo
  // sobre el estado, como los parámetros, en vez de recargar toda la tabla con
  // su spinner. La tabla no parpadea y el foco no se pierde.
  const guardarFila = async (fila, cambios) => {
    setGuardando(true);
    const esInsumo = fila.clase === 'insumo';
    const resultado = esInsumo
      ? await actualizarStockInsumo(fila.insumoId, cambios)
      : await actualizarStock(fila.sucursalId, fila.productoId, cambios);
    if (resultado.success) {
      notificar('Stock actualizado.', 'success');
      if (resultado.data) {
        const actualizada = resultado.data;
        if (esInsumo) {
          setStocksInsumos((prev) =>
            prev.map((f) =>
              Number(f.sucursalId) === Number(actualizada.sucursalId) &&
              Number(f.insumoId) === Number(actualizada.insumoId)
                ? actualizada
                : f
            )
          );
        } else {
          setStocks((prev) =>
            prev.map((f) =>
              Number(f.sucursalId) === Number(actualizada.sucursalId) &&
              Number(f.productoId) === Number(actualizada.productoId)
                ? actualizada
                : f
            )
          );
        }
      }
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

  // "Quitar" un insumo no borra la fila: InsumoStocks se recrea al listar. Se
  // deja de ofrecer en la sucursal y la cantidad vuelve a 0, reutilizando el
  // mismo PUT que usa la edición en línea. El insumo sigue en el catálogo
  // corporativo y se puede reactivar con el switch "Disponible".
  const confirmarQuitarInsumo = async () => {
    if (!insumoAQuitar) return;
    setConfirmando(true);
    const resultado = await actualizarStockInsumo(insumoAQuitar.insumoId, {
      cantidad: 0,
      disponible: false,
    });
    setConfirmando(false);
    if (resultado.success) {
      notificar(
        `"${insumoAQuitar.insumo}" sacado de la sucursal.`,
        'success'
      );
      if (resultado.data) {
        const actualizada = resultado.data;
        setStocksInsumos((prev) =>
          prev.map((f) =>
            Number(f.sucursalId) === Number(actualizada.sucursalId) &&
            Number(f.insumoId) === Number(actualizada.insumoId)
              ? actualizada
              : f
          )
        );
      }
    } else {
      notificar(resultado.error || 'No se pudo quitar el insumo.', 'danger');
    }
    setInsumoAQuitar(null);
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="h2 mb-0">Stock por sucursal</h1>
        <Button variant="outline-primary" onClick={cargar} disabled={cargando || !sucursalId}>
          <FaBoxes className="me-1" aria-hidden="true" />
          Recargar
        </Button>
      </div>

      {/* Sin sucursal operativa (superadmin sin contexto elegido) no hay
          nada que operar: se pide elegir una antes de mostrar la tabla. */}
      {!sucursalId ? (
        <Alert variant="warning">
          Elegí una sucursal para operar desde la barra de navegación (el
          selector de <strong>sucursal de contexto</strong>) para ver y gestionar
          su stock.
        </Alert>
      ) : (
        <>
      {/* La sucursal del contexto, a la vista: en pantalla chica el selector
          del navbar está oculto y esta página opera sobre esa sucursal. */}
      {sucursalOperativa && (
        <p className="text-muted">
          Operando la sucursal: <strong>{sucursalOperativa.nombre}</strong>.
        </p>
      )}

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
              {resumen.faltantes > 0 && (
                <Badge bg="warning" text="dark" className="ms-2">
                  {resumen.faltantes}
                </Badge>
              )}
            </>
          }
        >
          <div className="d-flex gap-2 align-items-start flex-wrap mb-3">
            <Form.Group className="filtro-stock" controlId="stock-filtro-principal">
              <Form.Label className="small mb-1">Mostrar</Form.Label>
              <div>
                <ButtonGroup size="sm" aria-label="Filtrar por tipo de ítem">
                  {FILTROS_PRINCIPALES.map(({ clave, etiqueta }) => (
                    <Button
                      key={clave}
                      variant={
                        filtroPrincipal === clave ? 'primary' : 'outline-primary'
                      }
                      aria-pressed={filtroPrincipal === clave}
                      onClick={() => {
                        setFiltroPrincipal(clave);
                        if (clave !== 'insumos') setFiltroTipoInsumo('todos');
                      }}
                    >
                      {etiqueta}
                      {conteos[clave] !== undefined ? ` (${conteos[clave]})` : ''}
                    </Button>
                  ))}
                </ButtonGroup>
              </div>
            </Form.Group>
            {filtroPrincipal === 'insumos' && (
              <Form.Group
                className="filtro-stock"
                controlId="stock-filtro-tipo-insumo"
              >
                <Form.Label className="small mb-1">Tipo de insumo</Form.Label>
                <Form.Select
                  name="tipoInsumo"
                  value={filtroTipoInsumo}
                  onChange={(e) => setFiltroTipoInsumo(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  <option value="extra">Extras</option>
                  <option value="condimento">Condimentos</option>
                </Form.Select>
              </Form.Group>
            )}
            <Form.Group className="filtro-stock" controlId="stock-filtro-producto">
              <Form.Label className="small mb-1">Producto</Form.Label>
              <Form.Select
                name="productoId"
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
                disabled={filtroPrincipal === 'insumos'}
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
            <Form.Group className="filtro-stock" controlId="stock-filtro-estado">
              <Form.Label className="small mb-1">Estado</Form.Label>
              <Form.Select
                name="estado"
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
              >
                <option value="todos">Todos ({resumen.total})</option>
                <option value={ESTADOS_STOCK.SIN_STOCK}>
                  Sin stock ({resumen.sinStock})
                </option>
                <option value={ESTADOS_STOCK.BAJO_STOCK}>
                  Bajo stock ({resumen.bajoStock})
                </option>
                <option value={ESTADOS_STOCK.NO_DISPONIBLE}>
                  No disponible ({resumen.noDisponible})
                </option>
              </Form.Select>
              {umbral > 0 && (
                <Form.Text className="text-muted">
                  Bajo stock: {umbral} {umbral === 1 ? 'unidad' : 'unidades'} o
                  menos.
                </Form.Text>
              )}
            </Form.Group>
          </div>

          {!cargando && resumen.sinStock > 0 && (
            <Alert
              variant="danger"
              className="d-flex flex-wrap align-items-center gap-2"
            >
              <span>
                <strong>{resumen.sinStock}</strong>{' '}
                {resumen.sinStock === 1
                  ? 'ítem sin stock.'
                  : 'ítems sin stock.'}{' '}
                {resumen.sinStock === 1 ? 'Necesita' : 'Necesitan'} reposición.
              </span>
              <Button
                variant="outline-danger"
                size="sm"
                className="ms-auto"
                onClick={() => setEstadoFiltro(ESTADOS_STOCK.SIN_STOCK)}
              >
                Ver sin stock
              </Button>
            </Alert>
          )}

          {!cargando && resumen.bajoStock > 0 && (
            <Alert
              variant="warning"
              className="d-flex flex-wrap align-items-center gap-2"
            >
              <span>
                <strong>{resumen.bajoStock}</strong>{' '}
                {resumen.bajoStock === 1
                  ? 'ítem con bajo stock'
                  : 'ítems con bajo stock'}{' '}
                ({umbral} {umbral === 1 ? 'unidad' : 'unidades'} o menos).
                Conviene reponer.
              </span>
              <Button
                variant="warning"
                size="sm"
                className="ms-auto"
                onClick={() => setEstadoFiltro(ESTADOS_STOCK.BAJO_STOCK)}
              >
                Ver bajo stock
              </Button>
            </Alert>
          )}

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
                  <th>Ítem</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                  <th>Disponible</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filasVisibles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="stock-vacio text-center">
                      {filtroPrincipal === 'insumos' && stocksInsumos.length === 0
                        ? 'No hay insumos activos. Creá extras y condimentos desde Catálogo → Insumos.'
                        : estadoFiltro === 'todos'
                          ? filtroPrincipal === 'todos'
                            ? 'No hay stock cargado. Agregá productos del catálogo en la pestaña Por agregar.'
                            : 'No hay ítems para este filtro.'
                          : MENSAJE_VACIO[estadoFiltro] ||
                            'No hay ítems para mostrar.'}
                    </td>
                  </tr>
                )}
                {filasVisibles.map((fila) => {
                  const esInsumo = fila.clase === 'insumo';
                  const esCombo = !esInsumo && fila.tipo === 'COMBO';
                  const idFila = esInsumo ? fila.insumoId : fila.productoId;
                  const clave = esInsumo ? `insumo-${idFila}` : idFila;
                  const nombre = esInsumo ? fila.insumo : fila.producto;
                  return (
                    <tr
                      key={`${fila.sucursalId}-${clave}`}
                      className={CLASE_FILA[fila.estado]}
                    >
                      <td data-label="Sucursal">{fila.sucursal}</td>
                      <td data-label="Ítem">
                        {nombre}
                        {esCombo && (
                          <Badge bg="info" className="ms-2">
                            combo
                          </Badge>
                        )}
                        {esInsumo && (
                          <Badge
                            bg={fila.tipo === 'extra' ? 'primary' : 'info'}
                            className="ms-2"
                          >
                            {ETIQUETA_TIPO_INSUMO[fila.tipo] || fila.tipo}
                          </Badge>
                        )}
                      </td>
                      <td data-label="Cantidad" className="stock-cantidad">
                        {esCombo ? (
                          // En un combo el número no se toca: el backend lo deriva
                          // de la receta, así que no hay input editable. Se muestra
                          // como texto plano con el mismo estilo que los inputs de
                          // las demás filas (plaintext + size sm comparten tipografía
                          // y alturas) para que la columna se lea uniforme.
                          <Form.Control
                            plaintext
                            readOnly
                            size="sm"
                            value={fila.cantidad}
                            aria-label="Cantidad del combo (calculada con el stock de sus componentes)"
                          />
                        ) : (
                          <Form.Control
                            type="number"
                            min="0"
                            step="1"
                            size="sm"
                            defaultValue={fila.cantidad}
                            key={`${clave}-${fila.cantidad}-${fila.sucursalId}`}
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
                      <td data-label="Estado">
                        {fila.estado === ESTADOS_STOCK.EN_STOCK ? (
                          <span className="text-muted small">
                            {ETIQUETA_ESTADO[fila.estado].texto}
                          </span>
                        ) : (
                          <Badge
                            bg={ETIQUETA_ESTADO[fila.estado].bg}
                            text={ETIQUETA_ESTADO[fila.estado].text}
                          >
                            {ETIQUETA_ESTADO[fila.estado].texto}
                          </Badge>
                        )}
                      </td>
                      <td data-label="Disponible">
                        <Form.Check
                          type="switch"
                          id={`disp-${fila.sucursalId}-${clave}`}
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
                          onClick={() =>
                            esInsumo
                              ? setInsumoAQuitar(fila)
                              : setStockAEliminar(fila)
                          }
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
          {/* Alta masiva: un solo click agrega todo lo que falta en la sucursal.
              Sólo aparece si hay faltantes, que es cuando la pestaña tiene
              sentido. */}
          {productosDisponibles.length > 0 && (
            <div className="d-flex justify-content-end mb-3">
              <Button
                variant="primary"
                onClick={agregarTodos}
                disabled={guardando}
              >
                <FaPlus className="me-1" aria-hidden="true" />
                {progreso
                  ? `Agregando… (${progreso.hechos}/${progreso.total})`
                  : `Agregar todos (${productosDisponibles.length})`}
              </Button>
            </div>
          )}
          {/* El avance se anuncia solo: el botón cambia de texto, pero el foco
              puede estar en otro lado de la página. */}
          <span className="visually-hidden" role="status" aria-live="polite">
            {progreso
              ? `Agregando ${progreso.hechos} de ${progreso.total} productos.`
              : ''}
          </span>

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

      <ConfirmarModal
        mostrar={Boolean(insumoAQuitar)}
        titulo="Quitar insumo de la sucursal"
        mensaje={
          insumoAQuitar
            ? `¿Quitar "${insumoAQuitar.insumo}" de ${insumoAQuitar.sucursal}? Deja de ofrecerse en esta sucursal y su cantidad queda en 0. El insumo sigue existiendo en el catálogo corporativo.`
            : ''
        }
        textoConfirmar="Sí, quitar"
        cargando={confirmando}
        onConfirmar={confirmarQuitarInsumo}
        onCancelar={() => setInsumoAQuitar(null)}
      />
        </>
      )}
    </Container>
  );
};

export default GestionStock;
