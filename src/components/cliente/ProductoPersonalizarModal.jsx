import { useState, useMemo, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { useCarrito } from '../../hooks/useCarrito';
import { useParametros } from '../../hooks/useParametros';
import {
  usePersonalizacionProducto,
  usePlantillasPersonalizacionQuery,
} from '../../hooks/queries';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { calcularPrecioUnitario } from '../../services/personalizacionConfig';
import { formatPrice } from '../../utils/formatters';
import { resolverImagen } from '../../utils/imagenes';
import GrupoOpciones from './GrupoOpciones';
import Contador from './Contador';
import ModalBase from '../comunes/ModalBase';
import './ProductoPersonalizarModal.css';

const ProductoPersonalizarModal = ({ mostrar, onCerrar, producto, promocion, itemEditando = null }) => {
  const { agregarAlCarrito, items, actualizarPersonalizacion } = useCarrito();
  const { parametros } = useParametros();
  const { notificar } = useNotificaciones();

  // Compatibilidad temporal con props deprecated (show/onHide)
  // En ProductoCard.jsx se usan show/onHide; aquí mapeamos a mostrar/onCerrar
  // No hacemos nada extra porque el componente ya recibe mostrar/onCerrar

  // Verificar si hay items en el carrito para este producto con opciones eliminadas/desactivadas.
  // En modo edición se excluye la línea que se está corrigiendo.
  const itemsConRevision = useMemo(() => {
    if (!producto) return [];
    return items.filter(
      (item) =>
        item.producto.id === producto.id &&
        item.personalizacion?._requiereRevision &&
        (!itemEditando || item.idLinea !== itemEditando.idLinea)
    );
  }, [items, producto, itemEditando]);

  // Lectura específica por producto y su categoría
  const categoriaIdRaw = producto?.categoriaId;
  const categoriaId =
    categoriaIdRaw === null || categoriaIdRaw === undefined
      ? null
      : typeof categoriaIdRaw === 'object'
      ? categoriaIdRaw?.id ?? null
      : categoriaIdRaw;
  const categoriaIdValida =
    categoriaId !== null && categoriaId !== undefined && Number.isFinite(categoriaId);
  const elementosQuery = usePersonalizacionProducto(producto?.id ?? null, {
    enabled: Boolean(producto) && mostrar,
  });
  const plantillasQuery = usePlantillasPersonalizacionQuery(categoriaId, {
    enabled: categoriaIdValida && mostrar,
  });

  const elementos = elementosQuery.data || [];
  const plantillasCategoria = plantillasQuery.data || [];

  const CONFIG_VACIA = {
    extra: [],
    personalizar: [],
    acompanar: [],
    condimento: [],
  };

  const normalizarElemento = (e) => ({
    id: String(e.id),
    nombre: e.nombre,
    precio:
      e.precio !== null && e.precio !== undefined ? Number(e.precio) : undefined,
    productoReferenciaId: e.productoReferenciaId,
    minimo: e.minimo ?? 0,
    maximo: e.maximo ?? 1,
    insumoId: e.insumoId ?? null,
    stockTotal: e.stockTotal ?? null,
    agotado: Boolean(e.agotado),
  });

  const normalizarElementoPersonalizar = (e) => ({
    id: String(e.id),
    nombre: e.nombre,
    minimo: e.minimo ?? 0,
    maximo: e.maximo ?? 1,
  });

  const normalizarPlantilla = (p) => ({
    id: String(p.id),
    nombre: p.nombre,
    precio:
      p.precio !== null && p.precio !== undefined ? Number(p.precio) : undefined,
    productoReferenciaId: p.productoReferenciaId,
    minimo: p.minimo ?? 0,
    maximo: p.maximo ?? 1,
    insumoId: p.insumoId ?? null,
    stockTotal: p.stockTotal ?? null,
    agotado: Boolean(p.agotado),
  });

  const config = useMemo(() => {
    if (!producto) return CONFIG_VACIA;
    const todosPorProducto = elementos.filter(
      (e) => String(e.productoId) === String(producto.id)
    );
    const activos = todosPorProducto.filter((e) => e.activo);
    const cfgCategoria = categoriaId !== null
      ? plantillasCategoria.filter(
          (p) =>
            String(p.categoriaId) === String(categoriaId) && p.activo
        )
      : [];

    if (todosPorProducto.length === 0) {
      return {
        extra: cfgCategoria
          .filter((p) => p.tipo === 'extra')
          .map(normalizarPlantilla),
        personalizar: [],
        acompanar: cfgCategoria
          .filter((p) => p.tipo === 'acompanar')
          .map(normalizarPlantilla),
        condimento: cfgCategoria
          .filter((p) => p.tipo === 'condimento')
          .map(normalizarPlantilla),
      };
    }

    const porTipo = (tipo) => todosPorProducto.filter((e) => e.tipo === tipo);
    const activosPorTipo = (tipo) => activos.filter((e) => e.tipo === tipo);

    return {
      extra:
        porTipo('extra').length === 0
          ? cfgCategoria
              .filter((p) => p.tipo === 'extra')
              .map(normalizarPlantilla)
          : activosPorTipo('extra').map(normalizarElemento),
      personalizar:
        porTipo('personalizar').length === 0
          ? []
          : activosPorTipo('personalizar').map(normalizarElementoPersonalizar),
      acompanar:
        porTipo('acompanar').length === 0
          ? cfgCategoria
              .filter((p) => p.tipo === 'acompanar')
              .map(normalizarPlantilla)
          : activosPorTipo('acompanar').map(normalizarElemento),
      condimento:
        porTipo('condimento').length === 0
          ? cfgCategoria
              .filter((p) => p.tipo === 'condimento')
              .map(normalizarPlantilla)
          : activosPorTipo('condimento').map(normalizarElemento),
    };
  }, [elementos, plantillasCategoria, producto]);

  const [vista, setVista] = useState('principal');
  const [unidades, setUnidades] = useState(1);
  const [extraCant, setExtraCant] = useState({});
  const [sinCant, setSinCant] = useState({});
  const [acompCant, setAcompCant] = useState({});
  const [condCant, setCondCant] = useState({});

  // Refs para manejo de foco al cambiar de vista
  const vistaPrincipalRef = useRef(null);
  const botonExtraRef = useRef(null);
  const botonPersonalizarRef = useRef(null);
  const botonAcompanarRef = useRef(null);
  const botonCondimentosRef = useRef(null);
  const botonVolverRef = useRef(null);

  // Inicializar estado desde itemEditando (modo edición)
  useEffect(() => {
    if (itemEditando?.personalizacion) {
      const pers = itemEditando.personalizacion;
      const extraMap = {};
      (pers.extras || []).forEach((e) => {
        extraMap[e.id] = e.cantidad;
      });
      const acompMap = {};
      (pers.acompanamientos || []).forEach((a) => {
        acompMap[a.id] = a.cantidad;
      });
      const condMap = {};
      (pers.condimentos || []).forEach((c) => {
        condMap[c.id] = c.cantidad;
      });
      const sinArr = pers.sin || [];
      const sinMap = {};
      sinArr.forEach((s) => {
        sinMap[s] = 1;
      });

      setExtraCant(extraMap);
      setAcompCant(acompMap);
      setCondCant(condMap);
      setSinCant(sinMap);
      setUnidades(itemEditando.cantidad || 1);
    } else {
      // Reset al abrir en modo nuevo
      setExtraCant({});
      setAcompCant({});
      setCondCant({});
      setSinCant({});
      setUnidades(1);
    }
    setVista('principal');
  }, [itemEditando]);

  const reset = () => {
    setVista('principal');
    setUnidades(1);
    setExtraCant({});
    setSinCant({});
    setAcompCant({});
    setCondCant({});
  };

  const handleClose = () => {
    reset();
    onCerrar();
  };

  const cambiar = (grupo, key, delta, minimo, maximo) => {
    const setters = { extra: setExtraCant, acompanar: setAcompCant, condimento: setCondCant };
    const estados = { extra: extraCant, acompanar: acompCant, condimento: condCant };
    const actual = estados[grupo][key] || 0;
    const nuevo = Math.max(minimo, Math.min(maximo, actual + delta));
    if (nuevo === actual) return;
    setters[grupo]((prev) => ({ ...prev, [key]: nuevo }));
  };

  const cambiarSin = (key, delta, minimo, maximo) => {
    const actual = sinCant[key] || 0;
    const nuevo = Math.max(minimo, Math.min(maximo, actual + delta));
    if (nuevo === actual) return;
    setSinCant((prev) => ({ ...prev, [key]: nuevo }));
  };

  const MAX_UNIDADES = parametros.cantidadMaximaProductoCarrito;

  const cambiarUnidades = (d) =>
    setUnidades((u) => Math.max(1, Math.min(MAX_UNIDADES, u + d)));

  const extrasLista = useMemo(
    () =>
      (config.extra || [])
        .filter((op) => (extraCant[op.id] || 0) > 0)
        .map((op) => ({ ...op, cantidad: extraCant[op.id] })),
    [config.extra, extraCant]
  );

  const acompLista = useMemo(
    () =>
      (config.acompanar || [])
        .filter((op) => (acompCant[op.id] || 0) > 0)
        .map((op) => ({ ...op, cantidad: acompCant[op.id] })),
    [config.acompanar, acompCant]
  );

  const condLista = useMemo(
    () =>
      (config.condimento || [])
        .filter((op) => (condCant[op.id] || 0) > 0)
        .map((op) => ({
          id: op.id,
          insumoId: op.insumoId ?? null,
          nombre: op.nombre,
          cantidad: condCant[op.id],
        })),
    [config.condimento, condCant]
  );

  const sinLista = useMemo(() => Object.entries(sinCant).filter(([, v]) => v).map(([k]) => k), [sinCant]);

  const precioUnitario = useMemo(
    () => calcularPrecioUnitario(producto?.precio || 0, extrasLista, acompLista),
    [producto, extrasLista, acompLista]
  );

  const total = precioUnitario * unidades;

  const extraCount = Object.values(extraCant).reduce((a, b) => a + b, 0);
  const extraCosto = extrasLista.reduce((s, e) => s + e.precio * e.cantidad, 0);
  const acompCount = Object.values(acompCant).reduce((a, b) => a + b, 0);
  const acompCosto = acompLista.reduce((s, e) => s + e.precio * e.cantidad, 0);
  const sinCount = sinLista.length;
  const condCount = Object.values(condCant).reduce((a, b) => a + b, 0);

  const obligatoriosAgotados = [
    ...(config.extra || []),
    ...(config.condimento || []),
  ].filter((op) => op.agotado && (op.minimo || 0) > 0);
  const hayObligatorioAgotado = obligatoriosAgotados.length > 0;

  const handleAgregar = () => {
    if (hayObligatorioAgotado) {
      const nombres = obligatoriosAgotados.map((op) => `"${op.nombre}"`).join(', ');
      notificar(
        `No se puede agregar: ${nombres} ${
          obligatoriosAgotados.length === 1 ? 'está agotado' : 'están agotados'
        } y es obligatorio.`,
        'warning'
      );
      return;
    }

    // Verificar si hay items en el carrito para este producto que requieren revisión
    if (itemsConRevision.length > 0) {
      const opciones = itemsConRevision.flatMap((item) =>
        (item.personalizacion._opcionesEliminadas || []).map(
          (o) => `${o.tipo}: ${o.nombre}`
        )
      );
      if (opciones.length > 0) {
        notificar(
          `Hay opciones eliminadas o desactivadas en tu carrito para este producto: ${opciones.join(', ')}. Revisá el carrito antes de continuar.`,
          'warning'
        );
        return;
      }
    }

    // Validar mínimos
    const incumplidosMin = [
      ...(config.extra || []).map((op) => ({ op, valor: extraCant[op.id] || 0 })),
      ...(config.acompanar || []).map((op) => ({ op, valor: acompCant[op.id] || 0 })),
      ...(config.personalizar || []).map((op) => ({ op, valor: sinCant[op.nombre] || 0 })),
      ...(config.condimento || []).map((op) => ({ op, valor: condCant[op.id] || 0 })),
    ].filter(({ op, valor }) => valor < (op.minimo || 0));

    if (incumplidosMin.length > 0) {
      const { op, valor } = incumplidosMin[0];
      notificar(
        `Debés elegir al menos ${op.minimo} de "${op.nombre}" (llevás ${valor}).`,
        'warning'
      );
      return;
    }

    // Validar máximos (límites vigentes)
    const incumplidosMax = [
      ...(config.extra || []).map((op) => ({ op, valor: extraCant[op.id] || 0, max: op.maximo })),
      ...(config.acompanar || []).map((op) => ({ op, valor: acompCant[op.id] || 0, max: op.maximo })),
      ...(config.personalizar || []).map((op) => ({ op, valor: sinCant[op.nombre] || 0, max: op.maximo })),
      ...(config.condimento || []).map((op) => ({ op, valor: condCant[op.id] || 0, max: op.maximo })),
    ].filter(({ op, valor, max }) => max !== undefined && max !== null && valor > max);

    if (incumplidosMax.length > 0) {
      const { op, valor, max } = incumplidosMax[0];
      notificar(
        `No podés elegir más de ${max} de "${op.nombre}" (llevás ${valor}).`,
        'warning'
      );
      return;
    }

    const personalizacion = {
      extras: extrasLista,
      sin: sinLista,
      acompanamientos: acompLista,
      condimentos: condLista,
    };

    if (itemEditando) {
      actualizarPersonalizacion(
        itemEditando.idLinea ?? itemEditando.producto?.id,
        personalizacion,
        unidades
      );
    } else {
      agregarAlCarrito(producto, unidades, personalizacion);
    }
    handleClose();
  };

  // Manejo de foco al cambiar de vista
  const cambiarVista = (nuevaVista) => {
    setVista(nuevaVista);
  };

  useEffect(() => {
    if (vista !== 'principal' && botonVolverRef.current) {
      botonVolverRef.current.focus();
    }
  }, [vista]);

  if (!producto) return null;

  const tienePersonalizacion =
    (config.extra?.length || 0) > 0 ||
    (config.personalizar?.length || 0) > 0 ||
    (config.acompanar?.length || 0) > 0 ||
    (config.condimento?.length || 0) > 0;

  const esCombo =
    producto.tipo === 'COMBO' ||
    (Array.isArray(producto.componentes) && producto.componentes.length > 0);
  const tieneDescuento =
    promocion && promocion.tipo === 'DESCUENTO_PORCENTUAL' && Number(promocion.valor) > 0 && !esCombo;
  const descuentoPorcentual = tieneDescuento ? Math.round(Number(promocion.valor)) : 0;

  if (!tienePersonalizacion) {
    return (
      <ModalBase
        mostrar={mostrar}
        onCerrar={handleClose}
        titulo={producto.nombre}
        centered
        footer={
          <>
            <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
            <Button className="btn-primary" onClick={handleAgregar}>
              {itemEditando ? 'Guardar cambios' : 'Agregar'} — {formatPrice(producto.precio * unidades)}
            </Button>
          </>
        }
      >
        <div className="text-center p-3">
          <img
            src={resolverImagen(producto.imagen)}
            alt=""
            width={160}
            height={110}
            className="rounded-4 mb-3 modal-producto-imagen"
          />
          <p className="text-muted small">{producto.descripcion}</p>
          {tieneDescuento && (
            <div className="small text-muted mb-2">
              Aprovechá esta oferta: {descuentoPorcentual}% OFF sobre este producto.
            </div>
          )}
          <p className="fw-bold modal-precio">{formatPrice(producto.precio)}</p>
          <div className="d-flex justify-content-center align-items-center gap-2">
            <span className="fw-bold small" id="unidades-label">
              Unidades
            </span>
            <Contador
              etiqueta="una unidad"
              valor={unidades}
              min={1}
              max={MAX_UNIDADES}
              onCambiar={cambiarUnidades}
            />
          </div>
        </div>
      </ModalBase>
    );
  }

  // Footer fijo para todas las vistas
  const footer = vista === 'principal' ? (
    <>
      <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
      <Button
        className="btn-primary"
        onClick={handleAgregar}
        disabled={hayObligatorioAgotado}
        aria-describedby="personalizar-total-desc"
      >
        <span className="badge bg-white btn-agregar-cantidad">{unidades}</span>
        <span>{itemEditando ? 'Guardar cambios' : 'Agregar a mi pedido'}</span>
        <span className="ms-auto">{formatPrice(total)}</span>
      </Button>
    </>
  ) : (
    <Button
      className="btn-primary w-100 py-3 fw-bold"
      onClick={() => setVista('principal')}
    >
      Aceptar
    </Button>
  );

  return (
    <ModalBase
      mostrar={mostrar}
      onCerrar={handleClose}
      centered
      fullscreen="sm-down"
      dialogClassName="modal-personalizar"
      contentClassName="modal-personalizar-content"
      aria-labelledby="personalizar-titulo"
      aria-describedby="personalizar-total-desc"
      footer={footer}
    >
      <ModalBase.Header closeButton>
        <ModalBase.Title id="personalizar-titulo" className="h5 mb-0">
          {producto.nombre}
        </ModalBase.Title>
      </ModalBase.Header>

      <ModalBase.Body className="p-0">
        {vista === 'principal' && (
          <div className="personalizar-principal" ref={vistaPrincipalRef}>
            <div className="text-center p-3 position-relative">
              <Button className="btn-cerrar" onClick={handleClose} aria-label="Cerrar">
                <span aria-hidden="true">×</span>
              </Button>
              <img src={resolverImagen(producto.imagen)} alt="" width={220} height={150} className="personalizar-imagen" />
            </div>
            <div className="px-3 pb-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h2 className="h5 fw-bold mb-1">{producto.nombre}</h2>
                  <p className="text-muted small mb-0 personalizar-descripcion">
                    {producto.descripcion}
                  </p>
                </div>
                <div className="text-end ms-2">
                  <div
                    id="personalizar-total-desc"
                    className="fw-bold personalize-total"
                    role="status"
                    aria-live="polite"
                  >
                    {formatPrice(total)}
                  </div>
                  <div className="text-muted personalize-total-unitario">
                    {unidades > 1 ? `${formatPrice(precioUnitario)} c/u` : 'Precio unitario'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-3 mb-3 p-2 card-comi personalize-grupos">
              {tieneDescuento && (
                <div className="mb-2 small text-muted">
                  Aprovechá esta oferta: {descuentoPorcentual}% OFF sobre este producto.
                </div>
              )}
              <div className="fila-grupo">
                <div>
                  <div className="fw-bold small">Extra</div>
                  <div className={`badge-grupo ${extraCount ? 'badge-grupo-activo' : ''}`}>
                    {extraCount ? `${extraCount} seleccionados (+${formatPrice(extraCosto * unidades)})` : '—'}
                  </div>
                </div>
                <Button
                  ref={botonExtraRef}
                  className="btn-seleccionar"
                  onClick={() => cambiarVista('extra')}
                >
                  Seleccionar
                </Button>
              </div>
              <div className="fila-grupo">
                <div>
                  <div className="fw-bold small">Personalizar</div>
                  <div className={`badge-grupo ${sinCount ? 'badge-grupo-ambar' : ''}`}>
                    {sinCount ? sinLista.join(', ') : '—'}
                  </div>
                </div>
                <Button
                  ref={botonPersonalizarRef}
                  className="btn-seleccionar"
                  onClick={() => cambiarVista('personalizar')}
                >
                  Seleccionar
                </Button>
              </div>
              <div className="fila-grupo">
                <div>
                  <div className="fw-bold small">Acompaña tu orden con</div>
                  <div className={`badge-grupo ${acompCount ? 'badge-grupo-activo' : ''}`}>
                    {acompCount ? `${acompCount} seleccionados (+${formatPrice(acompCosto * unidades)})` : '—'}
                  </div>
                </div>
                <Button
                  ref={botonAcompanarRef}
                  className="btn-seleccionar"
                  onClick={() => cambiarVista('acompanar')}
                >
                  Seleccionar
                </Button>
              </div>
              <div className="fila-grupo border-0">
                <div>
                  <div className="fw-bold small">Condimentos adicionales</div>
                  <div className="badge-grupo">
                    {condCount
                      ? condLista.map((c) => `${c.nombre} x${c.cantidad}`).join(', ')
                      : '—'}
                  </div>
                </div>
                <Button
                  ref={botonCondimentosRef}
                  className="btn-seleccionar"
                  onClick={() => cambiarVista('condimentos')}
                >
                  Seleccionar
                </Button>
              </div>
            </div>

            <div className="mx-3 mb-3 p-3 card-comi d-flex justify-content-between align-items-center personalizar-unidades">
              <span className="fw-bold small">Unidades</span>
              <Contador
                etiqueta="una unidad"
                valor={unidades}
                min={1}
                max={MAX_UNIDADES}
                onCambiar={cambiarUnidades}
              />
            </div>

            <div className="p-3 pt-0">
              {hayObligatorioAgotado && (
                <div className="alert alert-warning small mb-2" role="alert">
                  No se puede agregar: {obligatoriosAgotados.map((op) => `"${op.nombre}"`).join(', ')}{' '}
                  {obligatoriosAgotados.length === 1 ? 'está agotado' : 'están agotados'} y
                  es obligatorio.
                </div>
              )}
              {itemsConRevision.length > 0 && (
                <div className="alert alert-warning small mb-2" role="alert">
                  <strong>Atención:</strong> Hay opciones eliminadas o desactivadas en tu carrito
                  para este producto. Revisá el carrito antes de continuar.
                </div>
              )}
              <Button
                className="btn-primary w-100 py-3 fw-bold d-flex justify-content-between align-items-center btn-agregar"
                onClick={handleAgregar}
                disabled={hayObligatorioAgotado}
              >
                <span className="badge bg-white btn-agregar-cantidad">{unidades}</span>
                <span>{itemEditando ? 'Guardar cambios' : 'Agregar a mi pedido'}</span>
                <span className="ms-auto">{formatPrice(total)}</span>
              </Button>
            </div>
          </div>
        )}

        {vista === 'extra' && (
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <Button
                ref={botonVolverRef}
                className="btn-volver"
                onClick={() => setVista('principal')}
                aria-label="Volver a la selección"
              >
                <span aria-hidden="true">‹</span>
              </Button>
              <h3 className="h6 fw-bold mb-0 flex-grow-1 text-center">Extra</h3>
              <span className="espaciador-volver" />
            </div>
            <GrupoOpciones opciones={config.extra} valores={extraCant} onCambiar={(k, d, min, max) => cambiar('extra', k, d, min, max)} conPrecio />
          </div>
        )}

        {vista === 'personalizar' && (
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <Button
                ref={botonVolverRef}
                className="btn-volver"
                onClick={() => setVista('principal')}
                aria-label="Volver a la selección"
              >
                <span aria-hidden="true">‹</span>
              </Button>
              <h3 className="h6 fw-bold mb-0 flex-grow-1 text-center">Personalizar</h3>
              <span className="espaciador-volver" />
            </div>
            <p className="fw-bold small">
              Elegí qué ingredientes querés quitar; quitar no descuenta.
            </p>
            <div className="card-comi-grupo">
              {config.personalizar.map((op) => (
                <div key={op.id || op.nombre} className="fila-opcion">
                  <span className="small">Sin {op.nombre}</span>
                  <Contador
                    etiqueta={`el ingrediente ${op.nombre}`}
                    valor={sinCant[op.nombre] || 0}
                    min={op.minimo ?? 0}
                    max={op.maximo ?? 1}
                    onCambiar={(delta) => cambiarSin(op.nombre, delta, op.minimo ?? 0, op.maximo ?? 1)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {vista === 'acompanar' && (
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <Button
                ref={botonVolverRef}
                className="btn-volver"
                onClick={() => setVista('principal')}
                aria-label="Volver a la selección"
              >
                <span aria-hidden="true">‹</span>
              </Button>
              <h3 className="h6 fw-bold mb-0 flex-grow-1 text-center">Acompaña tu orden con</h3>
              <span className="espaciador-volver" />
            </div>
            <GrupoOpciones opciones={config.acompanar} valores={acompCant} onCambiar={(k, d, min, max) => cambiar('acompanar', k, d, min, max)} conPrecio />
          </div>
        )}

        {vista === 'condimentos' && (
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <Button
                ref={botonVolverRef}
                className="btn-volver"
                onClick={() => setVista('principal')}
                aria-label="Volver a la selección"
              >
                <span aria-hidden="true">‹</span>
              </Button>
              <h3 className="h6 fw-bold mb-0 flex-grow-1 text-center">Condimentos adicionales</h3>
              <span className="espaciador-volver" />
            </div>
            <p className="fw-bold small">
              Elegí los condimentos adicionales que quieras; sin costo.
            </p>
            <GrupoOpciones
              opciones={config.condimento}
              valores={condCant}
              onCambiar={(k, d, min, max) =>
                cambiar('condimento', k, d, min, max)
              }
            />
          </div>
        )}
      </ModalBase.Body>
    </ModalBase>
  );
};

ProductoPersonalizarModal.propTypes = {
  mostrar: PropTypes.bool.isRequired,
  onCerrar: PropTypes.func.isRequired,
  producto: PropTypes.object,
  promocion: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nombre: PropTypes.string,
    tipo: PropTypes.string.isRequired,
    valor: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  itemEditando: PropTypes.shape({
    idLinea: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    cantidad: PropTypes.number,
    personalizacion: PropTypes.object,
    producto: PropTypes.object,
  }),
};

ProductoPersonalizarModal.defaultProps = {
  producto: null,
  promocion: null,
  itemEditando: null,
};

export default ProductoPersonalizarModal;