import { useState, useMemo, useRef, useEffect, useId } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import {
  FaCheck,
  FaArrowRight,
  FaArrowLeft,
  FaShoppingCart,
  FaSave,
} from 'react-icons/fa';
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
import '../comunes/Wizard.css';
import './ProductoPersonalizarModal.css';

const CONFIG_VACIA = {
  extra: [],
  personalizar: [],
  acompanar: [],
  condimento: [],
};

/* Los dos pasos del configurador. Mismo patrón (etiqueta + número) que el
   wizard de direcciones para que el indicador hable el mismo idioma visual. */
const PASOS = [
  { numero: 1, etiqueta: 'Producto' },
  { numero: 2, etiqueta: 'Opciones' },
];

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

const ProductoPersonalizarModal = ({
  mostrar,
  onCerrar,
  producto = null,
  promocion = null,
  itemEditando = null,
}) => {
  const { agregarAlCarrito, items, actualizarPersonalizacion } = useCarrito();
  const { parametros } = useParametros();
  const { notificar } = useNotificaciones();
  const idBase = useId();

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

  const config = useMemo(() => {
    if (!producto) return CONFIG_VACIA;
    const elementos = elementosQuery.data || [];
    const plantillasCategoria = plantillasQuery.data || [];
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
  }, [elementosQuery.data, plantillasQuery.data, producto, categoriaId]);

  // Primera sección con opciones, en el mismo orden en que se pintan. Se usa
  // para autoabrirla al entrar al Paso 2, así el cliente ve enseguida qué puede
  // configurar sin tener que desplegar una sección a mano.
  const primeraSeccionKey = useMemo(() => {
    const enOrden = [
      ['extra', config.extra],
      ['personalizar', config.personalizar],
      ['acompanar', config.acompanar],
      ['condimentos', config.condimento],
    ];
    const encontrada = enOrden.find(
      ([, opciones]) => (opciones?.length || 0) > 0
    );
    return encontrada ? encontrada[0] : null;
  }, [config]);

  // Navegación del wizard y acordeón exclusivo. No reemplazan a los mapas de
  // selección: `paso` y `seccionAbierta` solo deciden qué se pinta.
  const [paso, setPaso] = useState(1);
  const [seccionAbierta, setSeccionAbierta] = useState(null);
  const [unidades, setUnidades] = useState(itemEditando?.cantidad || 1);

  // Estado de selección inicializado una sola vez por montaje (ver nota más abajo).
  const persInicial = itemEditando?.personalizacion;
  const [extraCant, setExtraCant] = useState(() => {
    const map = {};
    (persInicial?.extras || []).forEach((e) => {
      map[e.id] = e.cantidad;
    });
    return map;
  });
  const [sinCant, setSinCant] = useState(() => {
    const map = {};
    (persInicial?.sin || []).forEach((s) => {
      map[s] = 1;
    });
    return map;
  });
  const [acompCant, setAcompCant] = useState(() => {
    const map = {};
    (persInicial?.acompanamientos || []).forEach((a) => {
      map[a.id] = a.cantidad;
    });
    return map;
  });
  const [condCant, setCondCant] = useState(() => {
    const map = {};
    (persInicial?.condimentos || []).forEach((c) => {
      map[c.id] = c.cantidad;
    });
    return map;
  });

  // Refs de scroll y foco. El cuerpo del modal es el único contenedor con
  // scroll; los encabezados de sección se referencian para poder llevar el foco
  // a la sección que bloquea el agregado.
  const contenidoRef = useRef(null);
  const seccionRefs = useRef({});
  const seccionFocoRef = useRef(null);
  const [focoSeccion, setFocoSeccion] = useState(0);

  const reset = () => {
    setPaso(1);
    setSeccionAbierta(null);
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

  // Al cambiar de paso, el cuerpo vuelve arriba para mostrar el indicador.
  useEffect(() => {
    contenidoRef.current?.parentElement?.scrollTo?.({ top: 0 });
  }, [paso]);

  // Al abrir por validación, se lleva el foco al encabezado de la sección
  // infractora (y se la trae a la vista).
  useEffect(() => {
    if (focoSeccion === 0) return;
    const el = seccionRefs.current[seccionFocoRef.current];
    if (!el) return;
    el.scrollIntoView({ block: 'start' });
    el.focus();
  }, [focoSeccion]);

  // Al entrar al Paso 2 se abre la primera sección con opciones, salvo que ya
  // haya una abierta (por ejemplo la que abrió una validación, que tiene
  // prioridad) o que el cliente haya elegido otra sección.
  useEffect(() => {
    if (paso !== 2 || !primeraSeccionKey) return;
    setSeccionAbierta((prev) => prev ?? primeraSeccionKey);
  }, [paso, primeraSeccionKey]);

  const cambiar = (grupo, key, delta, minimo, maximo) => {
    const setters = { extra: setExtraCant, acompanar: setAcompCant, condimento: setCondCant };
    const estados = { extra: extraCant, acompanar: acompCant, condimento: condCant };
    const actual = estados[grupo][key] || 0;
    const nuevo = Math.max(minimo, Math.min(maximo, actual + delta));
    if (nuevo === actual) return;
    setters[grupo]((prev) => ({ ...prev, [key]: nuevo }));
  };

  // "Personalizar" se elige con un checkbox (quitar/no quitar): el mapa guarda 1
  // cuando está tildado y no guarda clave cuando no lo está, igual que antes.
  const toggleSin = (key, activo) => {
    setSinCant((prev) => {
      if (activo) return { ...prev, [key]: 1 };
      const next = { ...prev };
      delete next[key];
      return next;
    });
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
  const acompCount = Object.values(acompCant).reduce((a, b) => a + b, 0);
  const sinCount = sinLista.length;
  const condCount = Object.values(condCant).reduce((a, b) => a + b, 0);

  // Los agotados obligatorios viven en Extra y Condimentos: se etiqueta cada uno
  // con su sección para poder abrirla al bloquear el agregado.
  const obligatoriosAgotados = [
    ...(config.extra || []).map((op) => ({ op, seccion: 'extra' })),
    ...(config.condimento || []).map((op) => ({ op, seccion: 'condimentos' })),
  ].filter(({ op }) => op.agotado && (op.minimo || 0) > 0);
  const hayObligatorioAgotado = obligatoriosAgotados.length > 0;

  // Abre la sección infractora y agenda el foco (funciona aunque ya estuviera abierta).
  const abrirSeccionInfractora = (seccion) => {
    if (!seccion) return;
    seccionFocoRef.current = seccion;
    setSeccionAbierta(seccion);
    setFocoSeccion((n) => n + 1);
  };

  const handleAgregar = () => {
    if (hayObligatorioAgotado) {
      const nombres = obligatoriosAgotados.map(({ op }) => `"${op.nombre}"`).join(', ');
      notificar(
        `No se puede agregar: ${nombres} ${
          obligatoriosAgotados.length === 1 ? 'está agotado' : 'están agotados'
        } y es obligatorio.`,
        'warning'
      );
      abrirSeccionInfractora(obligatoriosAgotados[0].seccion);
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
      ...(config.extra || []).map((op) => ({ op, seccion: 'extra', valor: extraCant[op.id] || 0 })),
      ...(config.acompanar || []).map((op) => ({ op, seccion: 'acompanar', valor: acompCant[op.id] || 0 })),
      ...(config.personalizar || []).map((op) => ({ op, seccion: 'personalizar', valor: sinCant[op.nombre] || 0 })),
      ...(config.condimento || []).map((op) => ({ op, seccion: 'condimentos', valor: condCant[op.id] || 0 })),
    ].filter(({ op, valor }) => valor < (op.minimo || 0));

    if (incumplidosMin.length > 0) {
      const { op, valor, seccion } = incumplidosMin[0];
      notificar(
        `Debés elegir al menos ${op.minimo} de "${op.nombre}" (llevás ${valor}).`,
        'warning'
      );
      abrirSeccionInfractora(seccion);
      return;
    }

    // Validar máximos (límites vigentes)
    const incumplidosMax = [
      ...(config.extra || []).map((op) => ({ op, seccion: 'extra', valor: extraCant[op.id] || 0, max: op.maximo })),
      ...(config.acompanar || []).map((op) => ({ op, seccion: 'acompanar', valor: acompCant[op.id] || 0, max: op.maximo })),
      ...(config.personalizar || []).map((op) => ({ op, seccion: 'personalizar', valor: sinCant[op.nombre] || 0, max: op.maximo })),
      ...(config.condimento || []).map((op) => ({ op, seccion: 'condimentos', valor: condCant[op.id] || 0, max: op.maximo })),
    ].filter((item) => item.max !== undefined && item.max !== null && item.valor > item.max);

    if (incumplidosMax.length > 0) {
      const { op, valor, max, seccion } = incumplidosMax[0];
      notificar(
        `No podés elegir más de ${max} de "${op.nombre}" (llevás ${valor}).`,
        'warning'
      );
      abrirSeccionInfractora(seccion);
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
            <Button variant="outline-secondary" onClick={handleClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleAgregar}>
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

  // Secciones del acordeón: solo las que tienen opciones (una sección vacía no
  // tiene nada que configurar y solo agrega ruido). La descripción es fija y va
  // siempre visible en el encabezado, abierto o cerrado: le dice al cliente qué
  // esperar de la sección antes de desplegarla.
  const secciones = [
    {
      key: 'extra',
      titulo: 'Extra',
      descripcion: 'Agregá ingredientes extra; cada uno suma al precio.',
      opciones: config.extra,
    },
    {
      key: 'personalizar',
      titulo: 'Personalizar',
      descripcion: 'Quitá ingredientes de tu producto; no cambia el precio.',
      opciones: config.personalizar,
    },
    {
      key: 'acompanar',
      titulo: 'Acompaña tu orden con',
      descripcion: 'Sumá bebidas o guarniciones a tu pedido.',
      opciones: config.acompanar,
    },
    {
      key: 'condimentos',
      titulo: 'Condimentos adicionales',
      descripcion: 'Elegí sobres y salsas; sin costo.',
      opciones: config.condimento,
    },
  ].filter((s) => (s.opciones?.length || 0) > 0);

  // Resumen informativo bajo el título: solo aparece con selección cargada y no
  // introduce estado nuevo (se deriva de los mapas ya existentes).
  const resumenDe = (key) => {
    const cantidad = {
      extra: extraCount,
      acompanar: acompCount,
      personalizar: sinCount,
      condimentos: condCount,
    }[key] || 0;
    if (cantidad <= 0) return null;
    return `${cantidad} seleccionado${cantidad === 1 ? '' : 's'}`;
  };

  const cuerpoSeccion = (key) => {
    if (key === 'extra') {
      return (
        <GrupoOpciones
          opciones={config.extra}
          valores={extraCant}
          onCambiar={(k, d, min, max) => cambiar('extra', k, d, min, max)}
          conPrecio
          control="contador"
        />
      );
    }
    if (key === 'personalizar') {
      // Quitar un ingrediente es una decisión de sí/no, así que siempre se
      // resuelve con checkbox. La clave del mapa `sinCant` es el nombre del
      // ingrediente, por eso se reescribe `id` antes de delegar en GrupoOpciones.
      return (
        <GrupoOpciones
          opciones={(config.personalizar || []).map((op) => ({
            ...op,
            id: op.nombre,
            nombre: `Sin ${op.nombre}`,
          }))}
          valores={sinCant}
          onCambiar={(k, d) => toggleSin(k, (sinCant[k] || 0) + d > 0)}
          control="checkbox"
        />
      );
    }
    if (key === 'acompanar') {
      return (
        <GrupoOpciones
          opciones={config.acompanar}
          valores={acompCant}
          onCambiar={(k, d, min, max) => cambiar('acompanar', k, d, min, max)}
          conPrecio
        />
      );
    }
    return (
      <GrupoOpciones
        opciones={config.condimento}
        valores={condCant}
        onCambiar={(k, d, min, max) => cambiar('condimento', k, d, min, max)}
      />
    );
  };

  // Footer contextual: el paso 1 avanza, el paso 2 agrega. El total vive dentro
  // del botón de agregado, nunca en la cabecera. Mismo patrón (Paso X de N +
  // acciones a la derecha) que el wizard de direcciones.
  const footer = (
    <div className="wizard-footer">
      <span className="wizard-footer-paso">
        Paso {paso} de {PASOS.length}
      </span>
      <div className="wizard-footer-acciones">
        {paso === 1 ? (
          <>
            <Button variant="outline-secondary" type="button" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="primary" type="button" onClick={() => setPaso(2)}>
              Siguiente
              <FaArrowRight aria-hidden="true" />
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline-secondary" type="button" onClick={() => setPaso(1)}>
              <FaArrowLeft aria-hidden="true" />
              Volver
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={handleAgregar}
              disabled={hayObligatorioAgotado}
            >
              {itemEditando ? (
                <FaSave aria-hidden="true" />
              ) : (
                <FaShoppingCart aria-hidden="true" />
              )}
              <span>{itemEditando ? 'Guardar' : 'Agregar'}</span>
              <span className="personalizar-footer-precio">· {formatPrice(total)}</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <ModalBase
      mostrar={mostrar}
      onCerrar={handleClose}
      titulo={producto.nombre}
      centered
      variante="fullscreen-mobile"
      dialogClassName="personalizar-dialog"
      bodyClassName="personalizar-body"
      footer={footer}
    >
      <div className="personalizar-contenido" ref={contenidoRef}>
        <ol className="wizard-pasos" aria-label="Progreso de la configuración">
          {PASOS.map((item) => (
            <li
              key={item.numero}
              className={`wizard-paso${paso === item.numero ? ' activo' : ''}${
                paso > item.numero ? ' completado' : ''
              }`}
              aria-current={paso === item.numero ? 'step' : undefined}
            >
              <span className="wizard-paso-numero">
                {paso > item.numero ? <FaCheck aria-hidden="true" /> : item.numero}
              </span>
              <span className="wizard-paso-texto">{item.etiqueta}</span>
            </li>
          ))}
        </ol>

        {paso === 1 && (
          <div className="personalizar-paso1">
            <div className="personalizar-media">
              <img
                src={resolverImagen(producto.imagen)}
                alt=""
                className="personalizar-imagen"
              />
              {tieneDescuento && (
                <span className="personalizar-media-badge">
                  {descuentoPorcentual}% OFF
                </span>
              )}
            </div>

            {(producto.categoria || esCombo || tienePersonalizacion) && (
              <ul className="personalizar-chips" aria-label="Detalles del producto">
                {producto.categoria && (
                  <li className="personalizar-chip">{producto.categoria}</li>
                )}
                {esCombo && <li className="personalizar-chip">Combo</li>}
                {tienePersonalizacion && (
                  <li className="personalizar-chip personalizar-chip-marca">
                    Personalizable
                  </li>
                )}
              </ul>
            )}

            {producto.descripcion && (
              <p className="text-muted small mb-0 personalizar-descripcion">
                {producto.descripcion}
              </p>
            )}
            {tieneDescuento && (
              <p className="personalizar-promo mb-0">
                Aprovechá esta oferta: {descuentoPorcentual}% OFF sobre este producto.
              </p>
            )}
            <div className="personalizar-unidades-row">
              <span className="personalizar-unidades-texto">
                <span className="personalizar-unidades-titulo">Unidades</span>
                <span className="personalizar-unidades-hint">¿Cuántas querés?</span>
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
        )}

        {paso === 2 && (
          <div className="personalizar-paso2">
            {(hayObligatorioAgotado || itemsConRevision.length > 0) && (
              <div className="personalizar-alertas">
                {hayObligatorioAgotado && (
                  <div className="alert alert-warning small mb-2" role="alert">
                    No se puede agregar: {obligatoriosAgotados.map(({ op }) => `"${op.nombre}"`).join(', ')}{' '}
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
              </div>
            )}

            <div className="acordeon">
              {secciones.map(({ key, titulo, descripcion }) => {
                const abierta = seccionAbierta === key;
                const headerId = `${idBase}-${key}-header`;
                const panelId = `${idBase}-${key}-panel`;
                const resumen = resumenDe(key);
                return (
                  <section
                    key={key}
                    className={`acordeon-seccion${abierta ? ' acordeon-seccion-abierta' : ''}`}
                  >
                    <h3 className="acordeon-titulo">
                      <button
                        type="button"
                        id={headerId}
                        className="acordeon-header"
                        aria-expanded={abierta}
                        aria-controls={panelId}
                        ref={(el) => {
                          seccionRefs.current[key] = el;
                        }}
                        onClick={() =>
                          setSeccionAbierta((prev) => (prev === key ? null : key))
                        }
                      >
                        <span className="acordeon-header-texto">
                          <span className="acordeon-header-titulo">{titulo}</span>
                          <span className="acordeon-header-descripcion">{descripcion}</span>
                          {resumen && (
                            <span className="acordeon-resumen">{resumen}</span>
                          )}
                        </span>
                        <span
                          className={`acordeon-chevron${abierta ? ' acordeon-chevron-abierto' : ''}`}
                          aria-hidden="true"
                        >
                          ⌄
                        </span>
                      </button>
                    </h3>
                    {abierta && (
                      <div
                        id={panelId}
                        role="region"
                        aria-labelledby={headerId}
                        className="acordeon-cuerpo"
                      >
                        {cuerpoSeccion(key)}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>
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

export default ProductoPersonalizarModal;
