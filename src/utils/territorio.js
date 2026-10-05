/**
 * Proposito: Datos territoriales estaticos y versionados para los formularios
 *            de direccion.
 * Contenido: PROVINCIAS (24, nombres oficiales de Georef/INDEC).
 * Fuente: https://apis.datos.gob.ar/georef/api/provincias?campos=nombre
 *         (exportadas tal cual; los nombres coinciden con los que el backend
 *         envia como filtro a Georef y persiste normalizados).
 *
 * Iteracion 3: los partidos/comunas y las localidades ya NO son listas
 * estaticas: se cargan desde el proxy del backend (/api/geo, con cache),
 * unico punto de contacto con Georef y misma fuente que usa el backend al
 * geocodificar. Las provincias se mantienen estaticas (24 valores oficiales
 * que no cambian).
 */

export const PROVINCIAS = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego, Antártida e Islas del Atlántico Sur',
  'Tucumán',
];
