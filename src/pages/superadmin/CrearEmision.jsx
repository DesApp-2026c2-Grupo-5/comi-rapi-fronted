/**
 * Propósito: Página de creación de emisiones de cupones para el
 *            SUPERADMINISTRADOR.
 * Contenido: Formulario de configuración, previsualización de destinatarios
 *            y confirmación de emisión.
 * Dependencias: react-bootstrap, react-router-dom, react-icons, api/cupones,
 *               hooks/queries.
 * Uso: Ruta "/superadmin/cupones/crear".
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Form, Button, Alert, Table } from 'react-bootstrap';
import {
  FaUsers, FaEnvelope, FaArrowLeft, FaSearch, FaTimes,
} from 'react-icons/fa';
import PaginaFormularioABM from '../../components/admin/PaginaFormularioABM';
import {
  buscarEmisionEnCache,
  queryKeys,
  useCategorias,
  useCrearEmision,
  useEmisionQuery,
  useProductos,
} from '../../hooks/queries';
import { fetchCategoria, fetchProducto } from '../../hooks/queries/fetchers';
import { TIEMPO_CACHE_QUERY_MS } from '../../utils/constants';
import { previewDestinatarios } from '../../api';
import '../../components/admin/FormularioAdmin.css';
import '../../components/admin/FormularioABM.css';
import './CrearEmision.css';

const TIPOS_CLIENTE = [
  {
    id: 'NUEVO',
    etiqueta: 'Nuevos',
    ayuda: 'Se registraron dentro del período de análisis.',
  },
  {
    id: 'ACTIVO',
    etiqueta: 'Activos',
    ayuda: 'Realizaron al menos un pedido entregado durante el período, sin importar qué compraron.',
  },
  {
    id: 'INACTIVO',
    etiqueta: 'Inactivos',
    ayuda: 'No realizaron pedidos entregados durante el período, pero sí antes.',
  },
];

const ETIQUETA_TIPO_DESTINATARIO = {
  NUEVO: 'Nuevo',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  COMPRADOR_PERIODO: 'Comprador del período',
};

/**
 * Selector múltiple con búsqueda estilo Mercado Libre.
 * Permite buscar por nombre, seleccionar varios elementos y verlos como chips.
 * Los IDs se mantienen internamente; el usuario solo ve los nombres.
 */
/* eslint-disable react/prop-types */
const SelectorMultipleConBusqueda = ({
  label, valor = [], onChange, opciones = [], placeholder,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState(false);

  // El padre es la única fuente de verdad: así una precarga asíncrona (por
  // ejemplo, al reemitir desde caché) se refleja en los chips y cualquier
  // interacción posterior no puede sobrescribirla con un estado viejo.
  const seleccionados = Array.isArray(valor) ? valor : [];

  const normalizarTexto = (texto) =>
    texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const busquedaNormalizada = normalizarTexto(busqueda);

  const opcionesFiltradas = opciones.filter((o) =>
    normalizarTexto(o.nombre).includes(busquedaNormalizada)
  );

  const estaSeleccionado = (id) =>
    seleccionados.some((seleccionado) => String(seleccionado) === String(id));

  const notificar = (siguiente) => {
    if (onChange) onChange(siguiente);
  };

  const toggleSeleccion = (id) => {
    const siguiente = estaSeleccionado(id)
      ? seleccionados.filter((seleccionado) => String(seleccionado) !== String(id))
      : [...seleccionados, id];
    notificar(siguiente);
    setAbierto(true);
  };

  const quitarSeleccion = (id) => {
    notificar(
      seleccionados.filter((seleccionado) => String(seleccionado) !== String(id))
    );
  };

  const agregarDesdeBusqueda = (texto) => {
    const t = texto.trim();
    if (!t) return;
    if (!seleccionados.some((id) => String(id) === t)) {
      notificar([...seleccionados, t]);
    }
    setBusqueda('');
    setAbierto(false);
  };

  const manejarSubmitBusqueda = (e) => {
    e.preventDefault();
    const texto = busqueda.trim();
    if (!texto) return;
    const coincidencia = opciones.find(
      (o) => o.nombre.toLowerCase() === texto.toLowerCase()
    );
    if (coincidencia) {
      toggleSeleccion(coincidencia.id);
    } else {
      agregarDesdeBusqueda(texto);
    }
  };

  return (
    <div className="selector-multiple">
      <Form.Label>{label}</Form.Label>

      {/* Input de búsqueda */}
      <div className="input-group mb-2">
        <span className="input-group-text border-end-0">
          <FaSearch />
        </span>
        <input
          type="text"
          className="form-control border-start-0"
          placeholder={placeholder || 'Buscar…'}
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setAbierto(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') manejarSubmitBusqueda(e);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setAbierto(false)}
        />
      </div>

      {/* Lista desplegable de coincidencias */}
      {abierto && opciones.length > 0 && (
        <div className="lista-desplegable">
          {opcionesFiltradas.length === 0 ? (
            <div className="item-desplegable text-muted">
              No se encontraron coincidencias. Escribí y presioná Enter para agregar.
            </div>
          ) : (
            opcionesFiltradas.map((o) => (
              <div
                key={o.id}
                className={`item-desplegable ${estaSeleccionado(o.id) ? 'seleccionado' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  toggleSeleccion(o.id);
                }}
              >
                {o.nombre}
                {estaSeleccionado(o.id) && <FaTimes className="ms-2" />}
              </div>
            ))
          )}
        </div>
      )}

      {/* Chips de seleccionados */}
      {seleccionados.length > 0 && (
        <div className="chips-seleccionados mt-2">
          {seleccionados.map((id) => {
            const op = opciones.find((o) => String(o.id) === String(id));
            const nombre = op ? op.nombre : String(id);
            return (
              <span
                key={id}
                className="chip-seleccionado d-inline-block me-1 mb-1"
              >
                {nombre}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger ms-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    quitarSeleccion(id);
                  }}
                  aria-label={`Quitar ${nombre}`}
                >
                  <FaTimes />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
/* eslint-enable react/prop-types */

const aDateTimeLocal = (valor) => {
  if (!valor) return '';
  const fecha = new Date(valor);
  // Ajustar zona horaria para que el input datetime-local muestre la hora local.
  const offset = fecha.getTimezoneOffset() * 60000;
  return new Date(fecha.getTime() - offset).toISOString().slice(0, 16);
};

/**
 * Proyecta el snapshot persistido de una emisión al formulario. Sirve tanto
 * para el item del listado como para el detalle enriquecido por ID: el detalle
 * sólo agrega nombres legibles y cupones, que el formulario no necesita.
 */
const formularioDesdeEmision = (e) => {
  const s = e.configuracionSnapshot || {};
  const d = s.descuento || {};
  const alcance = s.alcance || {};
  return {
    nombre: s.nombre || e.nombre || '',
    descripcion: s.descripcion != null ? s.descripcion : (e.descripcion || ''),
    tipoDescuento: d.tipo || e.tipoDescuento || 'PORCENTAJE',
    valorDescuento: d.valor != null ? String(d.valor) : String(e.valorDescuento || ''),
    compraMinima: d.compraMinima != null ? String(d.compraMinima) : String(e.compraMinima || ''),
    descuentoMaximo: d.maximo != null ? String(d.maximo)
      : (e.descuentoMaximo != null ? String(e.descuentoMaximo) : ''),
    fechaInicio: aDateTimeLocal(d.fechaInicio || e.fechaInicio),
    fechaFin: aDateTimeLocal(d.fechaFin || e.fechaFin),
    // `productoIdsResueltos` incluye los productos derivados de las categorías.
    // Precargarlo como selección explícita duplicaría el alcance original; por
    // eso se prefiere `productoIds` y el resuelto sólo se usa en snapshots
    // antiguos que no guardaron la selección original.
    productoIds: Array.isArray(alcance.productoIds)
      ? [...alcance.productoIds]
      : (Array.isArray(alcance.productoIdsResueltos)
        ? [...alcance.productoIdsResueltos] : []),
    categoriaIds: Array.isArray(alcance.categoriaIds)
      ? [...alcance.categoriaIds] : [],
    maxDestinatarios: s.maxDestinatarios != null ? String(s.maxDestinatarios)
      : (e.maxDestinatarios != null ? String(e.maxDestinatarios) : ''),
    periodoAnalisisDias: s.seleccion?.periodoAnalisisDias != null
      ? String(s.seleccion.periodoAnalisisDias)
      : (e.periodoAnalisisDias != null ? String(e.periodoAnalisisDias) : ''),
    tiposCliente: Array.isArray(s.seleccion?.tiposCliente) &&
      s.seleccion.tiposCliente.length > 0
      ? [s.seleccion.tiposCliente[0]] : [],
    minUnidadesCompradas: s.seleccion?.minUnidadesCompradas != null
      ? String(s.seleccion.minUnidadesCompradas) : '',
    destinatariosIds: [],
  };
};

const CrearEmision = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paso, setPaso] = useState('config');
  const { data: productos = [], isFetching: productosFetching } = useProductos();
  const { data: categorias = [], isFetching: categoriasFetching } = useCategorias();
  const [form, setForm] = useState({
    nombre: '', descripcion: '', tipoDescuento: 'PORCENTAJE', valorDescuento: '',
    compraMinima: '', descuentoMaximo: '', fechaInicio: '', fechaFin: '',
    productoIds: [], categoriaIds: [], maxDestinatarios: '',
    periodoAnalisisDias: '', tiposCliente: [], minUnidadesCompradas: '',
    destinatariosIds: [],
  });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [emitirError, setEmitirError] = useState('');
  const [generandoPreview, setGenerandoPreview] = useState(false);
  const [reemitirDe, setReemitirDe] = useState(null);
  const [nombresExtras, setNombresExtras] = useState({
    productos: [], categorias: [],
  });
  const intentadosNombres = useRef({
    productos: new Set(), categorias: new Set(),
  });
  const queryClient = useQueryClient();
  // La mutación ya invalida el listado de emisiones y el de cupones; acá no se
  // duplican invalidaciones (el socket hace lo propio para otras pestañas).
  const { mutateAsync: crearEmision } = useCrearEmision();

  const idReemitir = Number(searchParams.get('reemitirDe')) || null;
  const emisionCacheada = idReemitir
    ? buscarEmisionEnCache(queryClient, idReemitir)
    : null;
  const faltaDetalle = Boolean(idReemitir) && !emisionCacheada;

  // Sólo se consulta el endpoint por ID cuando la caché no tiene la emisión.
  const {
    data: emisionDetalle,
    error: errorDetalle,
    isFetching: detalleFetching,
  } = useEmisionQuery({ id: idReemitir, enabled: faltaDetalle });

  // Precargar desde caché. Si no había datos, esperar a la consulta mínima
  // por ID; el resultado queda en la misma clave que usa el detalle.
  useEffect(() => {
    if (!idReemitir || reemitirDe === idReemitir) return;
    const emision = emisionCacheada || emisionDetalle;
    if (!emision) return;
    setReemitirDe(idReemitir);
    setForm(formularioDesdeEmision(emision));
    setPreview(null);
    setError('');
    setPaso('config');
  }, [idReemitir, reemitirDe, emisionCacheada, emisionDetalle]);

  useEffect(() => {
    if (errorDetalle) {
      setError(errorDetalle.message || 'No se pudo cargar la emisión para reemitir.');
    }
  }, [errorDetalle]);

  // Al cambiar de emisión se descartan los nombres resueltos de la anterior.
  useEffect(() => {
    intentadosNombres.current = { productos: new Set(), categorias: new Set() };
    setNombresExtras({ productos: [], categorias: [] });
  }, [idReemitir]);

  // Sólo se consultan individualmente los IDs cuyo nombre no está en el
  // catálogo ya cargado (lista, bootstrap o consultas previas). Se espera a
  // que terminen las listas para no emitir peticiones que luego serían
  // redundantes. `fetchQuery` deduplica por clave y el Set evita reintentos.
  useEffect(() => {
    if (!idReemitir || productosFetching || categoriasFetching) return undefined;

    const bootstrap = queryClient.getQueryData(queryKeys.public.bootstrap) || {};
    const categoriasTodas =
      queryClient.getQueryData(queryKeys.public.categorias(true)) || [];

    const conNombreProducto = new Set([
      ...productos.map((p) => String(p.id)),
      ...(bootstrap.productos || []).map((p) => String(p.id)),
      ...nombresExtras.productos.map((p) => String(p.id)),
    ]);
    const conNombreCategoria = new Set([
      ...categorias.map((c) => String(c.id)),
      ...(bootstrap.categorias || []).map((c) => String(c.id)),
      ...categoriasTodas.map((c) => String(c.id)),
      ...nombresExtras.categorias.map((c) => String(c.id)),
    ]);

    const resueltosProductos = [];
    const resueltosCategorias = [];
    const porConsultarProductos = [];
    const porConsultarCategorias = [];

    (form.productoIds || []).forEach((id) => {
      if (conNombreProducto.has(String(id))) return;
      const enCache = queryClient.getQueryData(queryKeys.public.producto(id));
      if (enCache) {
        resueltosProductos.push(enCache);
      } else if (!intentadosNombres.current.productos.has(String(id))) {
        intentadosNombres.current.productos.add(String(id));
        porConsultarProductos.push(id);
      }
    });

    (form.categoriaIds || []).forEach((id) => {
      if (conNombreCategoria.has(String(id))) return;
      const enCache = queryClient.getQueryData(queryKeys.public.categoria(id));
      if (enCache) {
        resueltosCategorias.push(enCache);
      } else if (!intentadosNombres.current.categorias.has(String(id))) {
        intentadosNombres.current.categorias.add(String(id));
        porConsultarCategorias.push(id);
      }
    });

    const agregarResueltos = (productosNuevos, categoriasNuevas) => {
      if (!productosNuevos.length && !categoriasNuevas.length) return;
      setNombresExtras((prev) => ({
        productos: [...prev.productos, ...productosNuevos],
        categorias: [...prev.categorias, ...categoriasNuevas],
      }));
    };

    if (!porConsultarProductos.length && !porConsultarCategorias.length) {
      agregarResueltos(resueltosProductos, resueltosCategorias);
      return undefined;
    }

    let cancelado = false;
    Promise.all([
      ...porConsultarProductos.map((id) =>
        queryClient.fetchQuery({
          queryKey: queryKeys.public.producto(id),
          queryFn: ({ signal }) => fetchProducto({ id, signal }),
          staleTime: TIEMPO_CACHE_QUERY_MS,
        })
      ),
      ...porConsultarCategorias.map((id) =>
        queryClient.fetchQuery({
          queryKey: queryKeys.public.categoria(id),
          queryFn: ({ signal }) => fetchCategoria({ id, signal }),
          staleTime: TIEMPO_CACHE_QUERY_MS,
        })
      ),
    ])
      .then((resultados) => {
        if (cancelado) return;
        agregarResueltos(
          [
            ...resueltosProductos,
            ...resultados.slice(0, porConsultarProductos.length),
          ],
          [
            ...resueltosCategorias,
            ...resultados.slice(porConsultarProductos.length),
          ]
        );
      })
      .catch(() => {
        // Sin nombre disponible el chip muestra el ID; no se reintenta para
        // evitar un bucle de consultas fallidas.
      });

    return () => { cancelado = true; };
  }, [
    idReemitir, productosFetching, categoriasFetching, productos, categorias,
    form.productoIds, form.categoriaIds, nombresExtras, queryClient,
  ]);

  const opcionesProductos = useMemo(() => {
    const porId = new Map();
    productos.forEach((p) => {
      if (p?.id != null && p.tipo !== 'COMBO') porId.set(String(p.id), p);
    });
    nombresExtras.productos.forEach((p) => {
      if (p?.id != null) porId.set(String(p.id), p);
    });
    return Array.from(porId.values());
  }, [productos, nombresExtras.productos]);

  const opcionesCategorias = useMemo(() => {
    const porId = new Map();
    categorias.forEach((c) => {
      if (c?.id != null) porId.set(String(c.id), c);
    });
    nombresExtras.categorias.forEach((c) => {
      if (c?.id != null) porId.set(String(c.id), c);
    });
    return Array.from(porId.values());
  }, [categorias, nombresExtras.categorias]);

  // Invalidar la previsualización previa si la configuración cambia,
  // para evitar confirmar con datos desactualizados.
  useEffect(() => {
    if (paso === 'config' && preview) {
      setPreview(null);
    }
  }, [paso, preview]);

  if (faltaDetalle && detalleFetching && paso === 'config') {
    return (
      <div className="crear-emision-page">
        <PaginaFormularioABM
          titulo="Nueva emisión de cupones"
          descripcion="Configurá el descuento, el alcance y los clientes que recibirán los cupones."
          volverA="/superadmin/cupones"
          volverTexto="Volver a emisiones"
        >
          <div className="text-center py-5" role="status" aria-live="polite">
            <div className="spinner-border" role="status"></div>
            <p className="mt-3">Cargando configuración de la emisión para reemitir…</p>
          </div>
        </PaginaFormularioABM>
      </div>
    );
  }

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      if (type === 'checkbox') return { ...prev, [name]: checked };
      return { ...prev, [name]: value };
    });
  };

  const manejarSeleccionMultiple = (name, ids) => {
    setForm((prev) => ({ ...prev, [name]: ids }));
  };

  const manejarTipoCliente = (tipo) => {
    setForm((prev) => ({ ...prev, tiposCliente: [tipo] }));
  };

  const validarTiposCliente = () => {
    if (form.tiposCliente.length !== 1) {
      throw new Error('Seleccioná un tipo de cliente: Nuevo, Inactivo o Activo.');
    }
    if (!form.periodoAnalisisDias) {
      throw new Error('El período de análisis es obligatorio para clasificar clientes.');
    }
  };

  const validarFechas = () => {
    const ahora = new Date();
    const inicio = new Date(form.fechaInicio);
    const fin = new Date(form.fechaFin);

    if (!form.fechaInicio || !form.fechaFin) {
      throw new Error('Las fechas de inicio y fin son obligatorias.');
    }
    if (inicio.getTime() < ahora.getTime()) {
      throw new Error('La fecha de inicio no puede ser anterior a la fecha actual.');
    }
    if (fin.getTime() < ahora.getTime()) {
      throw new Error('La fecha de fin no puede ser anterior a la fecha actual.');
    }
    if (fin.getTime() < inicio.getTime()) {
      throw new Error('La fecha de fin no puede ser anterior a la de inicio.');
    }
    return true;
  };

  const generarPreview = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setEmitirError('');
    setGenerandoPreview(true);
    try {
      validarTiposCliente();
      validarFechas();
      const datos = { ...form };
      const resultado = await previewDestinatarios(datos);
      if (resultado.success) {
        setPreview(resultado.data);
        setPaso('preview');
      } else {
        setError(resultado.error || 'No se pudo obtener la previsualización.');
      }
    } catch (err) {
      setError(err.message || 'Error al generar la previsualización.');
    } finally {
      setGenerandoPreview(false);
    }
  };

  const confirmarEmision = async () => {
    if (!preview) return;
    setEmitirError('');
    setPaso('confirmando');
    try {
      validarTiposCliente();
      validarFechas();
      const datos = {
        ...form,
        destinatariosIds: preview.destinatarios.map((d) => d.usuarioId),
        previewToken: preview.previewToken,
        previewExpiraEn: preview.previewExpiraEn,
      };
      const resultado = await crearEmision(datos);
      if (resultado.success) {
        navigate(`/superadmin/cupones/emisiones/${resultado.data.emision.id}`);
      } else {
        setEmitirError(resultado.error || 'No se pudo emitir.');
        setPaso('preview');
      }
    } catch (err) {
      setEmitirError(err.message || 'Error al emitir.');
      setPaso('preview');
    }
  };

  const esValido = Boolean(
    form.nombre && form.valorDescuento && form.fechaInicio && form.fechaFin &&
      form.tiposCliente.length === 1 && form.periodoAnalisisDias
  );

  if (paso === 'config') {
    return (
      <div className="crear-emision-page">
        <PaginaFormularioABM
          titulo="Nueva emisión de cupones"
          descripcion="Configurá el descuento, el alcance y los clientes que recibirán los cupones."
          volverA="/superadmin/cupones"
          volverTexto="Volver a emisiones"
          acciones={
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/superadmin/cupones')}
            >
              <FaArrowLeft /> Cancelar
            </Button>
          }
        >
          <Card className="shadow-sm formulario-admin-card">
            <Card.Body>
              {reemitirDe && (
                <Alert variant="info" role="alert" className="mb-3">
                  Reemitiendo la emisión <strong>#{reemitirDe}</strong>. Revisá
                  y ajustá la configuración antes de generar la nueva
                  previsualización.
                </Alert>
              )}
              {error && (
                <Alert variant="danger" role="alert" className="mb-3">
                  {error}
                </Alert>
              )}
              <Form noValidate>
                <section className="abm-seccion">
                  <h4 className="abm-seccion-titulo">Información del descuento</h4>
                  <div className="abm-form-grid">
                    <Form.Group className="mb-3" controlId="emision-nombre">
                      <Form.Label>Nombre o descripción</Form.Label>
                      <Form.Control
                        name="nombre"
                        value={form.nombre}
                        onChange={manejarCambio}
                        required
                        placeholder="Ej: Descuento Leales Noviembre"
                      />
                    </Form.Group>
                    <Form.Group
                      className="mb-3"
                      controlId="emision-tipo-descuento"
                    >
                      <Form.Label>Tipo de descuento</Form.Label>
                      <Form.Select
                        name="tipoDescuento"
                        value={form.tipoDescuento}
                        onChange={manejarCambio}
                      >
                        <option value="PORCENTAJE">Porcentaje</option>
                        <option value="MONTO_FIJO">Importe fijo</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group
                      className="mb-3"
                      controlId="emision-valor-descuento"
                    >
                      <Form.Label>Valor del descuento</Form.Label>
                      <Form.Control
                        type="number"
                        name="valorDescuento"
                        value={form.valorDescuento}
                        onChange={manejarCambio}
                        required
                        placeholder="Ej: 15 o 500"
                      />
                    </Form.Group>
                    <Form.Group
                      className="mb-3"
                      controlId="emision-compra-minima"
                    >
                      <Form.Label>Compra mínima (monto)</Form.Label>
                      <Form.Control
                        type="number"
                        name="compraMinima"
                        value={form.compraMinima}
                        onChange={manejarCambio}
                        placeholder="0"
                      />
                      <Form.Text className="text-muted">
                        Monto del carrito necesario para usar el cupón. No
                        define a quién se lo enviamos.
                      </Form.Text>
                    </Form.Group>
                    <Form.Group
                      className="mb-3"
                      controlId="emision-descuento-maximo"
                    >
                      <Form.Label>Descuento máximo (opcional)</Form.Label>
                      <Form.Control
                        type="number"
                        name="descuentoMaximo"
                        value={form.descuentoMaximo}
                        onChange={manejarCambio}
                        placeholder="Ej: 2000"
                      />
                    </Form.Group>
                  </div>
                </section>

                <section className="abm-seccion">
                  <h4 className="abm-seccion-titulo">Vigencia</h4>
                  <Form.Text className="text-muted d-block mb-3">
                    Si la fecha de inicio es futura, los cupones quedan
                    programados: no se envía ningún correo hasta que se
                    activen, y entonces se envía uno solo por destinatario.
                  </Form.Text>
                  <div className="abm-form-grid">
                    <Form.Group
                      className="mb-3"
                      controlId="emision-fecha-inicio"
                    >
                      <Form.Label>Fecha de inicio</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        name="fechaInicio"
                        value={form.fechaInicio}
                        onChange={manejarCambio}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="emision-fecha-fin">
                      <Form.Label>Fecha de fin (vencimiento)</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        name="fechaFin"
                        value={form.fechaFin}
                        onChange={manejarCambio}
                        required
                      />
                    </Form.Group>
                  </div>
                </section>

                <section className="abm-seccion">
                  <h4 className="abm-seccion-titulo">Alcance del descuento</h4>
                  <div className="abm-form-grid">
                    <div className="mb-3">
                      <SelectorMultipleConBusqueda
                        label="Productos alcanzados"
                        valor={form.productoIds}
                        onChange={(ids) => manejarSeleccionMultiple('productoIds', ids)}
                        opciones={opcionesProductos}
                        placeholder="Buscar producto…"
                      />
                    </div>
                    <div className="mb-3">
                      <SelectorMultipleConBusqueda
                        label="Categorías alcanzadas"
                        valor={form.categoriaIds}
                        onChange={(ids) => manejarSeleccionMultiple('categoriaIds', ids)}
                        opciones={opcionesCategorias}
                        placeholder="Buscar categoría…"
                      />
                    </div>
                  </div>
                  <Form.Text className="text-muted">
                    Un producto seleccionado individualmente y por categoría se
                    cuenta una sola vez. Los combos quedan excluidos.
                  </Form.Text>
                </section>

                <section className="abm-seccion">
                  <h4 className="abm-seccion-titulo">Selección de clientes</h4>
                  <div className="abm-form-grid">
                    <Form.Group
                      className="mb-3"
                      controlId="emision-max-destinatarios"
                    >
                      <Form.Label>Máximo de destinatarios (opcional)</Form.Label>
                      <Form.Control
                        type="number"
                        name="maxDestinatarios"
                        value={form.maxDestinatarios}
                        onChange={manejarCambio}
                        placeholder="Ej: 50"
                      />
                      <Form.Text className="text-muted">
                        Se emite hasta esa cantidad de cupones, elegidos entre
                        los clientes que más compraron.
                      </Form.Text>
                    </Form.Group>
                    <Form.Group
                      className="mb-3"
                      controlId="emision-periodo-analisis"
                    >
                      <Form.Label>Período de análisis (días)</Form.Label>
                      <Form.Control
                        type="number"
                        name="periodoAnalisisDias"
                        value={form.periodoAnalisisDias}
                        onChange={manejarCambio}
                        placeholder="Ej: 30"
                      />
                      <Form.Text className="text-muted">
                        Solo se cuentan pedidos ENTREGADOS en este período. Es
                        obligatorio porque siempre se clasifican clientes.
                      </Form.Text>
                    </Form.Group>
                  </div>

                  <div className="mb-3">
                    <Form.Label className="mb-1">Tipo de cliente</Form.Label>
                    <div className="d-flex flex-wrap gap-3">
                      {TIPOS_CLIENTE.map((tipo) => (
                        <Form.Check
                          key={tipo.id}
                          type="radio"
                          name="tipoCliente"
                          id={`tipo-cliente-${tipo.id}`}
                          label={tipo.etiqueta}
                          title={tipo.ayuda}
                          checked={form.tiposCliente[0] === tipo.id}
                          onChange={() => manejarTipoCliente(tipo.id)}
                        />
                      ))}
                    </div>
                    <Form.Text className="text-muted d-block mt-1">
                      Elegí uno solo: Nuevos, Inactivos o Activos. La actividad
                      se mide por pedidos entregados en el período, sin importar
                      qué producto compraron; Nuevos se decide por la fecha de
                      registro. Un cliente nuevo con pedido es Nuevo y Activo a
                      la vez (no se duplican destinatarios ni cupones). El orden
                      se mantiene: primero quienes más compraron del cupón.
                    </Form.Text>
                  </div>

                  <div className="abm-form-grid">
                    <Form.Group
                      className="mb-3"
                      controlId="emision-min-unidades"
                    >
                      <Form.Label>
                        Compra mínima requerida en unidades (opcional)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="minUnidadesCompradas"
                        value={form.minUnidadesCompradas}
                        onChange={manejarCambio}
                        min="0"
                        placeholder="Ej: 3"
                      />
                      <Form.Text className="text-muted">
                        Unidades de los productos o categorías seleccionados en
                        pedidos entregados. Para <strong>Activos</strong> y{' '}
                        <strong>Nuevos</strong> se cuentan las del período; para{' '}
                        <strong>Inactivos</strong>, que no compraron en el
                        período, se cuentan las compras históricas (columna
                        «Históricas»): con 2 se elige a quien compró 2 unidades
                        en el pasado. Quienes no lleguen no reciben el cupón.
                      </Form.Text>
                    </Form.Group>
                  </div>
                </section>

                <Button
                  type="button"
                  variant="primary"
                  className="w-100"
                  onClick={generarPreview}
                  disabled={!esValido || generandoPreview}
                >
                  {generandoPreview ? (
                    <span>Procesando…</span>
                  ) : (
                    <>
                      <FaUsers className="me-1" aria-hidden="true" />
                      Previsualizar destinatarios
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </PaginaFormularioABM>
      </div>
    );
  }

  if (paso === 'preview') {
    return (
      <div className="crear-emision-page">
        <PaginaFormularioABM
          titulo="Previsualización de destinatarios"
          descripcion="Revisá los clientes alcanzados antes de emitir los cupones."
          volverA="/superadmin/cupones"
          volverTexto="Volver a emisiones"
          acciones={
            <Button
              variant="outline-secondary"
              onClick={() => setPaso('config')}
            >
              <FaArrowLeft /> Volver a configuración
            </Button>
          }
        >
          <Card className="shadow-sm formulario-admin-card">
            <Card.Body>
              {error && (
                <Alert variant="danger" role="alert" className="mb-3">
                  {error}
                </Alert>
              )}
              {emitirError && (
                <Alert variant="danger" role="alert" className="mb-3">
                  {emitirError}
                </Alert>
              )}

              {generandoPreview ? (
                <div className="text-center py-4" role="status">
                  Cargando destinatarios…
                </div>
              ) : preview.total === 0 || preview.destinatarios.length === 0 ? (
                <Alert variant="warning" role="alert">
                  No hay clientes que cumplan los criterios de selección con
                  los productos o categorías y el período indicados. Probá
                  ajustar el período, los tipos de cliente o la compra mínima
                  requerida.
                </Alert>
              ) : (
                <>
                  <div className="mb-3">
                    <span className="badge bg-info">{preview.total}</span>{' '}
                    cliente(s) elegible(s){preview.truncado ? ` (mostrando ${preview.solicitados})` : ''}
                  </div>

                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Email</th>
                        <th>Tipo</th>
                        <th>Unidades compradas</th>
                        <th title="Unidades del período más las anteriores. Es la base del mínimo cuando se seleccionan clientes Inactivos; para Activos y Nuevos el mínimo usa sólo las unidades del período.">
                          Históricas
                        </th>
                        <th>Última compra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.destinatarios.map((d) => {
                        const delPeriodo = Number(d.unidades) || 0;
                        const previas = Number(d.unidadesPrevias) || 0;
                        const historicas = d.unidadesHistoricas != null
                          ? Number(d.unidadesHistoricas)
                          : delPeriodo + previas;
                        return (
                          <tr key={d.usuarioId}>
                            <td>{d.nombre} {d.apellido}</td>
                            <td>{d.email}</td>
                            <td>
                              {ETIQUETA_TIPO_DESTINATARIO[d.tipoCliente] ||
                                '—'}
                            </td>
                            <td>{delPeriodo}</td>
                            <td data-label="Históricas">
                              <span className="fw-semibold">{historicas}</span>
                              {previas > 0 && (
                                <small className="text-muted d-block">
                                  {delPeriodo} del período + {previas} previas
                                </small>
                              )}
                            </td>
                            <td>{d.ultimaCompra ? new Date(d.ultimaCompra).toLocaleDateString() : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </>
              )}

              <div className="mb-3">
                {preview.alcance && (
                  <>
                    <strong>Alcance:</strong>{' '}
                    {preview.alcance.productoIdsResueltos.length}{' '}
                    producto(s) alcanzado(s)
                  </>
                )}
              </div>
              <Button
                variant="primary"
                className="w-100"
                onClick={confirmarEmision}
                disabled={
                  !preview.destinatarios ||
                  preview.destinatarios.length === 0 ||
                  generandoPreview
                }
              >
                <FaEnvelope className="me-1" aria-hidden="true" />
                {reemitirDe ? 'Confirmar y reemitir cupones' : 'Confirmar y emitir cupones'}
              </Button>
            </Card.Body>
          </Card>
        </PaginaFormularioABM>
      </div>
    );
  }

  return null;
};

export default CrearEmision;
