/**
 * Propósito: Utilidades de horarios de atención para el frontend.
 * Contenido: nombres de días, normalización del payload de la API, cálculo del
 *            corte de pedidos (horario del local menos el margen global),
 *            validación en espejo del backend, texto legible de los horarios y
 *            formato de la cuenta regresiva.
 * Dependencias: ninguna (módulo puro).
 * Uso: import { normalizarHorarios, formatearHorarios } from '../utils/horarios';
 *
 * El BACKEND es la autoridad: estas funciones replican solo lo necesario para
 * que el editor del superadmin avise sin ida y vuelta y para que el cliente vea
 * el aviso. Los valores `abiertaAhora`, `cierrePedidos` y `segundosRestantes`
 * los calcula el backend y no se recalculan acá.
 */

export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MINUTOS_DIA = 24 * 60;

/** Hora 'HH:MM' (o 'HH:MM:SS') → minutos desde la medianoche (o null). */
const aMinutos = (hora) => {
  const match = String(hora ?? '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const horas = Number(match[1]);
  const minutos = Number(match[2]);
  if (horas > 23 || minutos > 59) return null;
  return horas * 60 + minutos;
};

/** Minutos desde la medianoche → 'HH:MM' con vuelta de día. */
const aHora = (minutos) => {
  const normalizado =
    ((Number(minutos) % MINUTOS_DIA) + MINUTOS_DIA) % MINUTOS_DIA;
  const horas = Math.floor(normalizado / 60);
  return `${String(horas).padStart(2, '0')}:${String(normalizado % 60).padStart(
    2,
    '0',
  )}`;
};

/** Normaliza una hora de la API ('HH:MM:SS') a 'HH:MM' para los inputs. */
const aHoraCorta = (hora) => {
  const minutos = aMinutos(hora);
  return minutos === null ? '' : aHora(minutos);
};

/**
 * Estructura editable de un horario: siempre los siete días, en orden.
 * @param {Array} [horarios] - `horarios` agrupado que devuelve la API.
 * @returns {Array<{diaSemana:number, dia:string, diaCorto:string, franjas:Array}>}
 */
export const normalizarHorarios = (horarios) => {
  const porDia = new Map();
  (Array.isArray(horarios) ? horarios : []).forEach((entrada) => {
    const diaSemana = Number(entrada?.diaSemana);
    if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 7) {
      return;
    }
    const franjas = Array.isArray(entrada?.franjas) ? entrada.franjas : [];
    const normalizadas = franjas
      .map((franja) => ({
        apertura: aHoraCorta(franja?.apertura),
        cierre: aHoraCorta(franja?.cierre),
      }))
      .filter((franja) => franja.apertura !== '' || franja.cierre !== '');
    porDia.set(diaSemana, normalizadas);
  });

  return DIAS_SEMANA.map((dia, indice) => ({
    diaSemana: indice + 1,
    dia,
    diaCorto: DIAS_CORTOS[indice],
    franjas: porDia.get(indice + 1) || [],
  }));
};

/**
 * Horario inicial de una sucursal nueva: todos los días de 10:00 a 23:00. Es
 * el mismo valor por defecto que aplica el backend cuando no se manda horario,
 * para que el formulario no arranque con la sucursal cerrada.
 */
export const crearHorarioPorDefecto = () =>
  DIAS_SEMANA.map((dia, indice) => ({
    diaSemana: indice + 1,
    dia,
    diaCorto: DIAS_CORTOS[indice],
    franjas: [{ apertura: '10:00', cierre: '23:00' }],
  }));

/**
 * Duración en minutos de una franja. El cierre tiene que ser posterior a la
 * apertura: la franja no puede pasar al día siguiente.
 */
const duracionMinutos = (franja) => {
  const apertura = aMinutos(franja?.apertura);
  const cierre = aMinutos(franja?.cierre);
  if (apertura === null || cierre === null) return 0;
  return Math.max(0, cierre - apertura);
};

/**
 * Corte de pedidos de una franja: el cierre REAL del local menos el margen
 * global. Ej.: cierra 23:00 con margen 30 → toma pedidos hasta las 22:30.
 * @returns {string|null} 'HH:MM' o null si el cierre no es válido.
 */
export const corteDePedidos = (cierre, margenMinutos = 0) => {
  const minutos = aMinutos(cierre);
  if (minutos === null) return null;
  return aHora(minutos - Math.max(0, Number(margenMinutos) || 0));
};

/**
 * Valida el horario completo en espejo del backend.
 * @param {Array} horarios - Estructura editable (siete días).
 * @param {number} [margenMinutos] - Margen global de cierre.
 * @returns {{valido: boolean, errores: Array<{diaSemana: number, mensaje: string}>}}
 */
export const validarHorarios = (horarios, margenMinutos = 0) => {
  const errores = [];
  (horarios || []).forEach((dia) => {
    const vistas = new Set();
    (dia.franjas || []).forEach((franja) => {
      const mensaje = (texto) =>
        errores.push({ diaSemana: dia.diaSemana, mensaje: texto });
      const apertura = aMinutos(franja.apertura);
      const cierre = aMinutos(franja.cierre);
      if (apertura === null || cierre === null) {
        mensaje('Completá la apertura y el cierre.');
        return;
      }
      if (apertura === cierre) {
        mensaje('No puede abrir y cerrar a la misma hora.');
        return;
      }
      if (cierre < apertura) {
        mensaje(
          'El cierre tiene que ser posterior a la apertura y dentro del mismo día: un horario no puede pasar al día siguiente.',
        );
        return;
      }
      const clave = `${franja.apertura}|${franja.cierre}`;
      if (vistas.has(clave)) {
        mensaje('Este horario está repetido.');
        return;
      }
      vistas.add(clave);
      const margen = Math.max(0, Number(margenMinutos) || 0);
      const duracion = duracionMinutos(franja);
      if (duracion < margen) {
        mensaje(
          `La franja dura menos que el margen de cierre (${margen} min): no quedaría ventana para tomar pedidos.`,
        );
      }
    });
  });
  return { valido: errores.length === 0, errores };
};

/** ¿Hay al menos una franja cargada en todo el horario? */
export const tieneFranjas = (horarios) =>
  (horarios || []).some((dia) => (dia.franjas || []).length > 0);

/** Cantidad total de franjas cargadas. */
export const contarFranjas = (horarios) =>
  (horarios || []).reduce((total, dia) => total + (dia.franjas || []).length, 0);

/**
 * Texto legible del horario, con el mismo formato que el backend:
 * "Lun a Dom 10:00 a 23:00 · Sáb y Dom cerrado".
 * @param {Array} horarios - Estructura editable (siete días).
 * @returns {string}
 */
export const formatearHorarios = (horarios) => {
  const agrupado = normalizarHorarios(horarios);
  const bloques = [];
  agrupado.forEach((dia) => {
    const firma =
      dia.franjas.length === 0
        ? 'cerrado'
        : dia.franjas.map((f) => `${f.apertura}-${f.cierre}`).join('|');
    const ultimo = bloques[bloques.length - 1];
    if (ultimo && ultimo.firma === firma) {
      ultimo.hasta = dia.diaSemana;
    } else {
      bloques.push({ firma, desde: dia.diaSemana, hasta: dia.diaSemana });
    }
  });

  return bloques
    .map((bloque) => {
      const dias =
        bloque.desde === bloque.hasta
          ? DIAS_CORTOS[bloque.desde - 1]
          : bloque.hasta - bloque.desde === 1
            ? `${DIAS_CORTOS[bloque.desde - 1]} y ${
                DIAS_CORTOS[bloque.hasta - 1]
              }`
            : `${DIAS_CORTOS[bloque.desde - 1]} a ${
                DIAS_CORTOS[bloque.hasta - 1]
              }`;
      if (bloque.firma === 'cerrado') {
        return `${dias} cerrado`;
      }
      const franjas = bloque.firma
        .split('|')
        .map((par) => {
          const [apertura, cierre] = par.split('-');
          return `${apertura} a ${cierre}`;
        })
        .join(' y ');
      return `${dias} ${franjas}`;
    })
    .join(' · ');
};

/** Nombre del día para un `diaSemana` 1..7. */
export const nombreDia = (diaSemana) => DIAS_SEMANA[Number(diaSemana) - 1] || '';

/**
 * Próxima apertura entre varias sucursales (la más cercana en el tiempo).
 * @param {Array} sucursales - Sucursales serializadas por la API.
 * @returns {{diaSemana: number, diaOffset: number, apertura: string, minutosHasta: number}|null}
 */
export const proximaAperturaEntre = (sucursales) => {
  let mejor = null;
  (sucursales || []).forEach((sucursal) => {
    const proxima = sucursal?.proximaApertura;
    if (!proxima) return;
    if (!mejor || proxima.minutosHasta < mejor.minutosHasta) {
      mejor = proxima;
    }
  });
  return mejor;
};

/**
 * Texto de la próxima apertura: "hoy a las 19:00" / "el lunes a las 11:00".
 * @param {object|null} proxima - Objeto `proximaApertura` del backend.
 * @returns {string|null}
 */
export const formatearProximaApertura = (proxima) => {
  if (!proxima) return null;
  const dia =
    proxima.diaOffset === 0
      ? 'hoy'
      : proxima.diaOffset === 1
        ? 'mañana'
        : `el ${nombreDia(proxima.diaSemana).toLowerCase()}`;
  return `${dia} a las ${proxima.apertura}`;
};

/**
 * Minutos antes del cierre en los que se muestra el aviso de "última chance".
 * El backend sigue revalidando: esto sólo decide CUÁNDO mostrarlo, no si se
 * puede pagar.
 */
export const MINUTOS_AVISO_CIERRE = 10;

/**
 * ¿Ya corresponde mostrar el aviso de cierre inminente?
 * @param {number} segundos - `segundosRestantes` calculado por el backend.
 * @returns {boolean} true si quedan entre 1 segundo y el umbral.
 */
export const dentroDelAvisoDeCierre = (segundos) => {
  const restantes = Number(segundos);
  return restantes > 0 && restantes <= MINUTOS_AVISO_CIERRE * 60;
};

/**
 * Cuenta regresiva legible: "17:05" (mm:ss) o "1 h 05 min" si falta más de una
 * hora.
 * @param {number} segundos
 * @returns {string}
 */
export const formatearCuentaRegresiva = (segundos) => {
  const restantes = Math.max(0, Math.floor(Number(segundos) || 0));
  const horas = Math.floor(restantes / 3600);
  const minutos = Math.floor((restantes % 3600) / 60);
  const segundosRestantes = restantes % 60;
  if (horas > 0) {
    return `${horas} h ${String(minutos).padStart(2, '0')} min`;
  }
  return `${String(minutos).padStart(2, '0')}:${String(
    segundosRestantes,
  ).padStart(2, '0')}`;
};
