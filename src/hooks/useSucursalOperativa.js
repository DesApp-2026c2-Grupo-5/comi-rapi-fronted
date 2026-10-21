/**
 * Propósito: Acceso a la sucursal OPERATIVA de la sesión (la del admin
 *            asignada; la del superadmin elegida como contexto).
 * Contenido: hook useSucursalOperativa.
 * Dependencias: context/SucursalOperativaContext.
 * Uso: const { sucursalOperativa, sucursalOperativaId, esOperadorDeSucursal,
 *              elegirSucursal, limpiarSucursal } = useSucursalOperativa();
 *
 * Es la única fuente del frontend para "¿en qué sucursal opera esta sesión?":
 * nunca se lee `user.sucursalId` directo en pantallas operativas, porque el
 * superadmin no tiene sucursal asignada (solo contexto).
 */

import { useSucursalOperativaContext } from '../context/SucursalOperativaContext';

export const useSucursalOperativa = useSucursalOperativaContext;

export default useSucursalOperativa;
