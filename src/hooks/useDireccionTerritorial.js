/**
 * Propósito: Hook con la lógica territorial de los formularios de dirección
 *            (iteración 3): cascada provincia → partido/comuna → localidad,
 *            autocompletado de calles, aviso de cobertura por provincia y
 *            flujo de preview (selección de coincidencias ANTES de guardar).
 * Contenido: useDireccionTerritorial.
 * Dependencias: api/geo.js (proxy del backend con cache), react.
 * Uso: shared por FormularioDireccion y FormularioSucursal (misma lógica,
 *      sin duplicarla).
 *
 * Fixes de los bugs reportados en el testeo (iteración 3):
 *   - Bug A: al elegir una opción ambigua NO se copia la localidad censal al
 *     filtro `localidad` (Georef lo interpreta como localidad BAHRA y da 0
 *     resultados). Solo se aplican el `departamento` y la calle OFICIAL de
 *     la opción elegida → reintento determinista.
 *   - Bug B: no queda estado territorial oculto: el partido/comuna es un
 *     select visible (también en CABA) y cualquier edición de calle/altura/
 *     provincia/partido invalida la resolución anterior.
 *
 * Flujo: submit → POST /api/geo/preview → si es única, confirmación con los
 * datos que resolvió Georef → recién ahí el formulario guarda (el backend
 * re-geocodifica y aplica la cobertura definitiva).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  obtenerDepartamentos,
  obtenerLocalidades,
  buscarCalles,
  obtenerZonas,
  previsualizarDireccion,
} from '../api/geo';
import { PROVINCIAS } from '../utils/territorio';

export const PROVINCIA_PARTIDO_OBLIGATORIO = 'Buenos Aires';

// Aviso al seleccionar una provincia fuera de la zona de operación.
export const MENSAJE_FUERA_DE_ZONA =
  'Por el momento solo operamos en CABA y en algunos partidos de la provincia Buenos Aires.';

export const MENSAJE_NO_ENCONTRADA =
  'La dirección no pudo ser ubicada: revisá los datos ingresados.';

// Comparación insensible a mayúsculas/acentos (mismo criterio que el backend).
export function normalizarTextoZona(valor) {
  return String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const useDireccionTerritorial = ({
  inicial = null,
  onConfirmado,
  validarCobertura = false,
} = {}) => {
  // ---- Campos territoriales ------------------------------------------------
  const [calle, setCalle] = useState('');
  const [altura, setAltura] = useState('');
  const [provincia, setProvincia] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [localidad, setLocalidad] = useState('');

  // ---- Opciones de los selects en cascada ----------------------------------
  const [departamentosOpts, setDepartamentosOpts] = useState([]);
  const [localidadesOpts, setLocalidadesOpts] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);

  // ---- Autocompletado --------------------------------------------------------
  const [sugerencias, setSugerencias] = useState([]);
  // Fix bug 1: feedback visible cuando la búsqueda de sugerencias falla
  // (antes el fallo era silencioso y "no funcionaba" sin explicación).
  const [errorSugerencias, setErrorSugerencias] = useState(null);
  // Fix bug 4: nombre oficial elegido de la lista. Mientras el texto de la
  // calle coincida con esta selección, el cambio provino de la propia
  // selección y NO debe disparar una nueva búsqueda (la lista se mantenía
  // reabriéndose).
  const calleSeleccionadaRef = useRef(null);

  // ---- Aviso de cobertura por provincia -------------------------------------
  const [zonas, setZonas] = useState([]);
  const [avisoFueraZona, setAvisoFueraZona] = useState(false);

  // ---- Resolución (preview) de la dirección --------------------------------
  // preview: { estado: 'unica'|'ambigua', resultado?, opciones?, cobertura? } | null
  const [preview, setPreview] = useState(null);
  const [opcionElegida, setOpcionElegida] = useState('');
  const [cargandoPreview, setCargandoPreview] = useState(false);
  // Iteración 6: estado UNIFICADO de resultados (reemplaza al trío
  // errores+tipoError+bloqueo del Alert separado — evita presentaciones
  // contradictorias). La lógica de invalidación y guard no cambia.
  // resultado: null | {
  //   tipo: 'datos' | 'cobertura-zona' | 'cobertura-sucursal' | 'tecnico',
  //   mensaje?: string,      // mensaje principal (cuando no hay items)
  //   items?: string[],      // correcciones de campo (tipo 'datos')
  //   detalle?: object,     // cobertura del preview o detalle del 422 del save
  // }
  const [resultado, setResultado] = useState(null);
  // Iteración 5: guard anti doble-submit del guardado final.
  const [guardando, setGuardando] = useState(false);

  // El guardado final lo dispara el hook, pero el payload completo lo arma el
  // formulario (alias/referencia o datos de sucursal): se llama SIEMPRE a la
  // última versión del callback.
  const onConfirmadoRef = useRef(onConfirmado);
  useEffect(() => {
    onConfirmadoRef.current = onConfirmado;
  });

  // Cualquier edición de los datos de ubicación invalida la resolución previa.
  const limpiarResolucion = useCallback(() => {
    setPreview(null);
    setOpcionElegida('');
    setResultado(null);
  }, []);

  // ---- Precarga (modo edición) ----------------------------------------------
  // La localidad persistida NO se precarga: es la localidad CENSAL
  // normalizada por el backend, y este select usa localidades BAHRA (la
  // semántica del filtro `localidad` de Georef). Precargarla reintroduciría
  // el bug A.
  useEffect(() => {
    setCalle(inicial?.calle || '');
    setAltura(inicial?.altura ?? '');
    setProvincia(inicial?.provincia || '');
    setDepartamento(inicial?.departamento || '');
    setLocalidad('');
    setPreview(null);
    setOpcionElegida('');
    setResultado(null);
    setSugerencias([]);
    setErrorSugerencias(null);
    calleSeleccionadaRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicial?.id]);

  // ---- Zonas de operación (una sola vez) -------------------------------------
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const result = await obtenerZonas();
      if (!cancelado && result.success) {
        setZonas(result.data);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // ---- Aviso de cobertura al cambiar la provincia ----------------------------
  useEffect(() => {
    if (!provincia || zonas.length === 0) {
      setAvisoFueraZona(false);
      return;
    }
    const normalizada = normalizarTextoZona(provincia);
    const habilitada = zonas.some((zona) =>
      (zona.provincias || []).some((p) => normalizarTextoZona(p) === normalizada)
    );
    setAvisoFueraZona(!habilitada);
  }, [provincia, zonas]);

  // ---- Iteración 4: aviso informativo a nivel PARTIDO -----------------------
  // Si la zona que habilita la provincia filtra por partidos (AMBA) y el
  // partido elegido no integra la lista, se avisa de inmediato. Informativo:
  // el backend sigue validando la zona al guardar. Mismos datos que expone
  // /api/geo/zonas (misma fuente que la validación real).
  const [avisoPartidoFueraZona, setAvisoPartidoFueraZona] = useState(false);
  useEffect(() => {
    if (zonas.length === 0 || !provincia || !departamento) {
      setAvisoPartidoFueraZona(false);
      return;
    }
    const normalizada = normalizarTextoZona(provincia);
    const zona = zonas.find((z) =>
      (z.provincias || []).some((p) => normalizarTextoZona(p) === normalizada)
    );
    if (!zona) {
      setAvisoPartidoFueraZona(false);
      return;
    }
    const habilitados = (zona.departamentos || []).map(normalizarTextoZona);
    // Lista vacía = la zona no filtra por partido (toda la provincia, ej. CABA).
    setAvisoPartidoFueraZona(
      habilitados.length > 0 && !habilitados.includes(normalizarTextoZona(departamento))
    );
  }, [zonas, provincia, departamento]);

  // ---- Cascada: departamentos de la provincia -------------------------------
  useEffect(() => {
    if (!provincia) {
      setDepartamentosOpts([]);
      return undefined;
    }
    let cancelado = false;
    (async () => {
      setCargandoCatalogo(true);
      const result = await obtenerDepartamentos(provincia);
      if (!cancelado) {
        setDepartamentosOpts(result.success ? result.data : []);
        setCargandoCatalogo(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [provincia]);

  // ---- Cascada: localidades del partido/comuna -------------------------------
  useEffect(() => {
    if (!provincia) {
      setLocalidadesOpts([]);
      return undefined;
    }
    let cancelado = false;
    (async () => {
      const result = await obtenerLocalidades({
        provincia,
        departamento: departamento || undefined,
      });
      if (!cancelado) {
        setLocalidadesOpts(result.success ? result.data : []);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [provincia, departamento]);

  // ---- Autocompletado de calles (debounce) ------------------------------------
  useEffect(() => {
    setErrorSugerencias(null);
    const texto = String(calle ?? '').trim();
    // Fix bug 4: si el texto fue escrito por la selección de una sugerencia,
    // no se re-busca por ese cambio (la calle matchea consigo misma).
    if (
      calleSeleccionadaRef.current &&
      calle === calleSeleccionadaRef.current
    ) {
      setSugerencias([]);
      return undefined;
    }
    if (!provincia || texto.length < 3) {
      setSugerencias([]);
      return undefined;
    }
    // Fix bug 1/4: las respuestas de consultas anteriores se descartan
    // (antes, una respuesta lenta podía sobrescribir la actual).
    let cancelado = false;
    const timer = setTimeout(async () => {
      const result = await buscarCalles({
        provincia,
        departamento: departamento || undefined,
        localidad: localidad || undefined,
        nombre: texto,
      });
      if (cancelado) {
        return;
      }
      if (result.success) {
        setSugerencias(result.data);
      } else {
        // Fix bug 1: sin rama else la falla era invisible.
        setSugerencias([]);
        setErrorSugerencias(
          result.error || 'No se pudieron cargar las sugerencias de calle.'
        );
      }
    }, 300);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [calle, provincia, departamento, localidad]);

  // ---- Actualizadores de campo (con invalidación) -----------------------------
  const actualizarProvincia = (valor) => {
    setProvincia(valor);
    setDepartamento('');
    setLocalidad('');
    setSugerencias([]);
    setErrorSugerencias(null);
    calleSeleccionadaRef.current = null;
    limpiarResolucion();
  };

  const actualizarDepartamento = (valor) => {
    setDepartamento(valor);
    setLocalidad('');
    limpiarResolucion();
  };

  const actualizarLocalidad = (valor) => {
    setLocalidad(valor);
    limpiarResolucion();
  };

  const actualizarCalle = (valor) => {
    // Fix bug 4: si el texto vuelve a diferir de la selección previa, es
    // porque el usuario volvió a tipear: se re-habilita la búsqueda.
    if (valor !== calleSeleccionadaRef.current) {
      calleSeleccionadaRef.current = null;
    }
    setCalle(valor);
    limpiarResolucion();
  };

  const actualizarAltura = (valor) => {
    setAltura(valor);
    limpiarResolucion();
  };

  const seleccionarSugerencia = (nombre) => {
    // Fix bug 4: se marca la selección para que el cambio de texto que ella
    // misma produce no dispare una nueva búsqueda.
    calleSeleccionadaRef.current = nombre;
    setCalle(nombre);
    setSugerencias([]);
    setErrorSugerencias(null);
    limpiarResolucion();
  };

  // ---- Validación y resolución -------------------------------------------------
  const requierePartido =
    String(provincia ?? '').trim() === PROVINCIA_PARTIDO_OBLIGATORIO;

  const validar = () => {
    const nuevos = [];
    if (!String(calle ?? '').trim()) {
      nuevos.push('La calle es obligatoria.');
    }
    if (
      altura === '' ||
      altura === null ||
      !Number.isInteger(Number(altura)) ||
      Number(altura) < 0
    ) {
      nuevos.push(
        'La altura es obligatoria y debe ser un número entero mayor o igual a 0.'
      );
    }
    if (!String(provincia ?? '').trim()) {
      nuevos.push('La provincia es obligatoria.');
    } else if (!PROVINCIAS.includes(provincia)) {
      nuevos.push('Seleccioná una provincia de la lista.');
    }
    if (requierePartido && !String(departamento ?? '').trim()) {
      nuevos.push(
        'El partido es obligatorio para direcciones de la provincia de Buenos Aires.'
      );
    }
    // Selección explícita válida: los campos territoriales admiten texto
    // libre para BUSCAR, pero solo se aceptan valores de la lista (se valida
    // cuando la lista ya cargó, para no dar falsos positivos en el arranque).
    if (
      String(departamento ?? '').trim() &&
      departamentosOpts.length > 0 &&
      !departamentosOpts.some((d) => d.nombre === departamento)
    ) {
      nuevos.push('Seleccioná un partido/comuna de la lista.');
    }
    if (
      String(localidad ?? '').trim() &&
      localidadesOpts.length > 0 &&
      !localidadesOpts.some((l) => l.nombre === localidad)
    ) {
      nuevos.push('Seleccioná una localidad de la lista.');
    }
    return nuevos;
  };

  const construirDatos = () => ({
    calle: String(calle ?? '').trim(),
    altura: Number(altura),
    provincia: String(provincia ?? '').trim(),
    departamento: String(departamento ?? '').trim() || null,
    localidad: String(localidad ?? '').trim() || null,
  });

  /**
   * Resuelve la dirección con el backend (preview: sin persistir).
   * 'unica' → confirmación; 'ambigua' → opciones para elegir;
   * 'no_encontrada' → error amigable.
   * Iteración 5: con `validarCobertura` el preview incluye el resultado de
   * la validación real (zona + sucursal activa ≤5 km por ruta); los fallos
   * se clasifican en funcionales (bloquean) vs técnicos/temporales (reintentar).
   */
  const previsualizar = async () => {
    const erroresValidacion = validar();
    if (erroresValidacion.length > 0) {
      setResultado({ tipo: 'datos', items: erroresValidacion });
      setPreview(null);
      return;
    }
    setResultado(null);
    setCargandoPreview(true);
    try {
      const result = await previsualizarDireccion(construirDatos(), {
        cobertura: validarCobertura,
      });
      if (!result.success) {
        // Taxonomía de resultados: 5xx (o sin status) = técnico/temporal →
        // reintentar; el resto (400/409/422) = funcional → corregir datos.
        const esTecnico =
          result.status === undefined || result.status >= 500;
        setResultado({
          tipo: esTecnico ? 'tecnico' : 'datos',
          mensaje:
            result.error ||
            (esTecnico
              ? 'Servicio temporalmente no disponible. Esperá unos segundos y volvé a intentar.'
              : 'No se pudo verificar la dirección.'),
        });
        setPreview(null);
        return;
      }
      const { estado, resultado, opciones, cobertura } = result.data;
      if (estado === 'no_encontrada') {
        setResultado({ tipo: 'datos', mensaje: MENSAJE_NO_ENCONTRADA });
        setPreview(null);
        return;
      }
      setPreview({
        estado,
        resultado: resultado || null,
        opciones: opciones || [],
        cobertura: cobertura || null,
      });
      setOpcionElegida('');
      // Iteración 6: la cobertura bloqueante se presenta como resultado
      // diferenciado (zona vs sucursal), no como un Alert aparte.
      if (validarCobertura && cobertura && !cobertura.coberturaDisponible) {
        setResultado({
          tipo: cobertura.dentroZona
            ? 'cobertura-sucursal'
            : 'cobertura-zona',
          mensaje: cobertura.mensaje,
          detalle: cobertura,
        });
      } else {
        setResultado(null);
      }
    } finally {
      setCargandoPreview(false);
    }
  };

  /**
   * Fix bug A/B: al elegir una opción ambigua solo se aplican el
   * `departamento` y la calle OFICIAL de la opción. Nunca la localidad
   * censal (el filtro `localidad` de Georef espera localidades BAHRA).
   */
  const elegirOpcion = (nomenclatura) => {
    const opcion = (preview?.opciones || []).find(
      (o) => o.nomenclatura === nomenclatura
    );
    if (!opcion) return;
    if (opcion.departamento) {
      setDepartamento(opcion.departamento);
    }
    if (opcion.calle) {
      setCalle(opcion.calle);
    }
    setOpcionElegida(nomenclatura);
    setResultado(null);
  };

  /**
   * Iteración 5: la cobertura del preview bloquea la confirmación cuando la
   * dirección no es atendible (fuera de zona o sin sucursal activa ≤5 km).
   * Guard anti doble-submit: el botón queda deshabilitado mientras dura el
   * guardado (un doble click creaba dos direcciones).
   */
  const bloqueadaPorCobertura = Boolean(
    validarCobertura &&
      preview?.estado === 'unica' &&
      preview?.cobertura &&
      !preview.cobertura.coberturaDisponible
  );

  const confirmar = async () => {
    if (guardando) return;
    if (preview?.estado !== 'unica') return;
    if (bloqueadaPorCobertura) return;
    if (onConfirmadoRef.current) {
      setGuardando(true);
      try {
        await onConfirmadoRef.current(construirDatos());
      } finally {
        setGuardando(false);
      }
    }
  };

  /** Vuelve a editar los datos (descarta la resolución). */
  const editarDatos = () => {
    setPreview(null);
    setOpcionElegida('');
    setResultado(null);
  };

  // ---- Superficie para que el formulario procese el resultado del guardado ----
  /** Muestra opciones de ambigüedad recibidas del propio guardado (409 residual). */
  const mostrarOpcionesExternas = (opcionesExternas) => {
    setResultado(null);
    setPreview({
      estado: 'ambigua',
      resultado: null,
      opciones: opcionesExternas || [],
    });
    setOpcionElegida('');
  };

  /**
   * Muestra un error del guardado (cobertura, geolocalización, etc.).
   * Iteración 6: clasifica en el estado unificado. 'tecnico' es temporal y
   * se reintenta; los funcionales se refinan por mensaje/detalle (el 422 de
   * sin cobertura trae `detalle.distanciaMasCercanaMetros`).
   */
  const mostrarError = (mensaje, { tipo, detalle } = {}) => {
    setPreview(null);
    const texto = mensaje || 'No se pudo guardar la dirección.';
    if (tipo === 'tecnico') {
      setResultado({ tipo: 'tecnico', mensaje: texto });
      return;
    }
    if (detalle && detalle.distanciaMasCercanaMetros !== undefined) {
      setResultado({
        tipo: 'cobertura-sucursal',
        mensaje: texto,
        detalle,
      });
      return;
    }
    if (/fuera de la zona/i.test(texto)) {
      setResultado({ tipo: 'cobertura-zona', mensaje: texto });
      return;
    }
    setResultado({ tipo: 'datos', mensaje: texto });
  };

  return {
    // campos
    calle,
    altura,
    provincia,
    departamento,
    localidad,
    // actualizadores
    actualizarProvincia,
    actualizarDepartamento,
    actualizarLocalidad,
    actualizarCalle,
    actualizarAltura,
    seleccionarSugerencia,
    // opciones de selects
    departamentosOpts,
    localidadesOpts,
    cargandoCatalogo,
    requierePartido,
    // autocomplete
    sugerencias,
    errorSugerencias,
    // aviso de cobertura
    avisoFueraZona,
    avisoPartidoFueraZona,
    MENSAJE_FUERA_DE_ZONA,
    // resolución
    preview,
    opcionElegida,
    cargandoPreview,
    // Iteración 6: estado unificado de resultados (antes errores+tipoError).
    resultado,
    guardando,
    bloqueadaPorCobertura,
    previsualizar,
    elegirOpcion,
    confirmar,
    editarDatos,
    mostrarOpcionesExternas,
    mostrarError,
    // utilidades
    construirDatos,
  };
};
