import {
  createContext,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import { useQueryClient } from '@tanstack/react-query';
import {
  crearElemento,
  actualizarElemento,
  eliminarElemento,
} from '../api/personalizacion';
import {
  crearPlantilla,
  actualizarPlantilla as actualizarPlantillaApi,
  eliminarPlantilla as eliminarPlantillaApi,
} from '../api/personalizacionCategorias';
import {
  queryKeys,
  useElementosPersonalizacionQuery,
  usePlantillasPersonalizacionQuery,
} from '../hooks/queries';

// El contexto y el provider conviven en el mismo archivo por cohesión.
// eslint-disable-next-line react-refresh/only-export-components
export const PersonalizacionContext = createContext(null);

const CONFIG_VACIA = {
  extra: [],
  personalizar: [],
  acompanar: [],
  condimento: [],
};

// Array estable para no cambiar la identidad del contexto antes de la primera
// lectura.
const LISTA_VACIA = [];

// Da al modal del cliente la forma uniforme que espera:
// { id, nombre, precio, productoReferenciaId, minimo, maximo, insumoId,
//   stockTotal, agotado }.
const normalizarPlantilla = (plantilla) => ({
  id: String(plantilla.id),
  nombre: plantilla.nombre,
  precio:
    plantilla.precio !== null && plantilla.precio !== undefined
      ? Number(plantilla.precio)
      : undefined,
  productoReferenciaId: plantilla.productoReferenciaId,
  minimo: plantilla.minimo ?? 0,
  maximo: plantilla.maximo ?? 1,
  insumoId: plantilla.insumoId ?? null,
  stockTotal: plantilla.stockTotal ?? null,
  agotado: Boolean(plantilla.agotado),
});

export const PersonalizacionProvider = ({ children }) => {
  const queryClient = useQueryClient();
  // Carga perezosa: el provider ya no pide nada al montar. Las pantallas que
  // usan personalización llaman a `cargar()` al entrar (o al abrir el modal) y
  // TanStack Query reutiliza los datos mientras estén frescos.
  //
  // Cada lectura tiene su propio interruptor: la gestión de elementos no
  // necesita las plantillas de categoría y viceversa, así que pedir ambas
  // duplicaría GETs en pantallas que sólo usan una.
  const [elementosSolicitados, setElementosSolicitados] = useState(false);
  const [plantillasSolicitadas, setPlantillasSolicitadas] = useState(false);
  const [loading, setLoading] = useState(false);
  // Verdadero recién después del primer `cargar()`: las pantallas de edición lo
  // usan para no mostrar "no encontrado" mientras la carga perezosa está en curso.
  const [cargado, setCargado] = useState(false);

  const {
    data: elementos = LISTA_VACIA,
    refetch: refetchElementos,
    isStale: elementosStale,
  } = useElementosPersonalizacionQuery({ enabled: elementosSolicitados });

  const {
    data: plantillas = LISTA_VACIA,
    refetch: refetchPlantillas,
    isStale: plantillasStale,
  } = usePlantillasPersonalizacionQuery({ enabled: plantillasSolicitadas });

  const elementosRef = useRef(elementos);
  elementosRef.current = elementos;
  const elementosStaleRef = useRef(elementosStale);
  elementosStaleRef.current = elementosStale;
  const plantillasRef = useRef(plantillas);
  plantillasRef.current = plantillas;
  const plantillasStaleRef = useRef(plantillasStale);
  plantillasStaleRef.current = plantillasStale;

  const cargar = useCallback(
    async ({ elementos: conElementos = true, plantillas: conPlantillas = true } = {}) => {
      if (conElementos) setElementosSolicitados(true);
      if (conPlantillas) setPlantillasSolicitadas(true);
      setLoading(true);
      try {
        const tareas = [];
        // Si ya hay datos frescos en la caché no se repite la petición.
        if (
          conElementos &&
          (!elementosRef.current || elementosStaleRef.current)
        ) {
          tareas.push(refetchElementos());
        }
        if (
          conPlantillas &&
          (!plantillasRef.current || plantillasStaleRef.current)
        ) {
          tareas.push(refetchPlantillas());
        }
        // allSettled: si falla el endpoint de plantillas (por ejemplo en una base
        // todavía sin migrar), la personalización por producto sigue funcionando.
        if (tareas.length > 0) await Promise.allSettled(tareas);
      } finally {
        setLoading(false);
        setCargado(true);
      }
    },
    [refetchElementos, refetchPlantillas]
  );

  const agregar = useCallback(
    async (datos) => {
      const res = await crearElemento(datos);
      if (res.success) {
        queryClient.setQueryData(
          queryKeys.public.personalizacion(),
          (prev) => [...(Array.isArray(prev) ? prev : []), res.data]
        );
      }
      return res;
    },
    [queryClient]
  );

  const actualizar = useCallback(
    async (id, datos) => {
      const res = await actualizarElemento(id, datos);
      if (res.success) {
        queryClient.setQueryData(
          queryKeys.public.personalizacion(),
          (prev) =>
            (Array.isArray(prev) ? prev : []).map((e) =>
              String(e.id) === String(id) ? res.data : e
            )
        );
      }
      return res;
    },
    [queryClient]
  );

  const eliminar = useCallback(
    async (id) => {
      const res = await eliminarElemento(id);
      if (res.success) {
        queryClient.setQueryData(
          queryKeys.public.personalizacion(),
          (prev) =>
            (Array.isArray(prev) ? prev : []).filter(
              (e) => String(e.id) !== String(id)
            )
        );
      }
      return res;
    },
    [queryClient]
  );

  const agregarPlantilla = useCallback(
    async (datos) => {
      const res = await crearPlantilla(datos);
      if (res.success) {
        queryClient.setQueryData(queryKeys.public.plantillas, (prev) => [
          ...(Array.isArray(prev) ? prev : []),
          res.data,
        ]);
      }
      return res;
    },
    [queryClient]
  );

  const actualizarPlantilla = useCallback(
    async (id, datos) => {
      const res = await actualizarPlantillaApi(id, datos);
      if (res.success) {
        queryClient.setQueryData(queryKeys.public.plantillas, (prev) =>
          (Array.isArray(prev) ? prev : []).map((e) =>
            String(e.id) === String(id) ? res.data : e
          )
        );
      }
      return res;
    },
    [queryClient]
  );

  const eliminarPlantilla = useCallback(
    async (id) => {
      const res = await eliminarPlantillaApi(id);
      if (res.success) {
        queryClient.setQueryData(queryKeys.public.plantillas, (prev) =>
          (Array.isArray(prev) ? prev : []).filter(
            (e) => String(e.id) !== String(id)
          )
        );
      }
      return res;
    },
    [queryClient]
  );

  const getPorProducto = useCallback(
    (productoId) =>
      elementos.filter(
        (e) =>
          String(e.productoId) === String(productoId) && e.activo
      ),
    [elementos]
  );

  const getPorProductoYTipo = useCallback(
    (productoId, tipo) =>
      elementos.filter(
        (e) =>
          String(e.productoId) === String(productoId) &&
          e.tipo === tipo &&
          e.activo
      ),
    [elementos]
  );

  const getPlantillasDeCategoria = useCallback(
    (categoriaId) =>
      plantillas.filter(
        (p) => String(p.categoriaId) === String(categoriaId)
      ),
    [plantillas]
  );

  // Plantillas activas agrupadas por categoría, ya con el shape del modal.
  const plantillasPorCategoria = useMemo(() => {
    const mapa = {};
    plantillas.forEach((p) => {
      if (!p.activo) return;
      // Los ingredientes (`personalizar`) son propios de cada producto y se
      // cargan desde su formulario: las plantillas de categoría ya no se usan
      // como fallback para ese tipo.
      if (p.tipo === 'personalizar') return;
      const clave = String(p.categoriaId);
      if (!mapa[clave]) {
        mapa[clave] = {
          extra: [],
          personalizar: [],
          acompanar: [],
          condimento: [],
        };
      }
      if (!mapa[clave][p.tipo]) return;
      mapa[clave][p.tipo].push(normalizarPlantilla(p));
    });
    return mapa;
  }, [plantillas]);

  // Adaptador para el modal cliente. El fallback es por tipo: si el producto no
  // tiene ningún elemento de un tipo, usa las plantillas activas de su
  // categoría (antes vivían hardcodeadas en personalizacionConfig.js). Si tiene
  // elementos de ese tipo, respeta sólo lo configurado para el producto.
  // Excepción: `personalizar` (ingredientes) no tiene fallback; son datos
  // propios del producto y se cargan en su formulario.
  const getConfigParaProducto = useCallback(
    (producto) => {
      if (!producto) return CONFIG_VACIA;
      const todosPorProducto = elementos.filter(
        (e) => String(e.productoId) === String(producto.id)
      );
      const activos = todosPorProducto.filter((e) => e.activo);
      const cfgCategoria = producto.categoriaId
        ? plantillasPorCategoria[String(producto.categoriaId)] ||
          CONFIG_VACIA
        : CONFIG_VACIA;

      if (todosPorProducto.length === 0) return cfgCategoria;

      const porTipo = (tipo) =>
        todosPorProducto.filter((e) => e.tipo === tipo);
      const activosPorTipo = (tipo) =>
        activos.filter((e) => e.tipo === tipo);

      return {
        extra:
          porTipo('extra').length === 0
            ? cfgCategoria.extra
            : activosPorTipo('extra').map((e) => ({
                id: String(e.id),
                nombre: e.nombre,
                precio: e.precio,
                minimo: e.minimo ?? 0,
                maximo: e.maximo ?? 1,
                insumoId: e.insumoId ?? null,
                stockTotal: e.stockTotal ?? null,
                agotado: Boolean(e.agotado),
              })),
        personalizar:
          porTipo('personalizar').length === 0
            ? []
            : activosPorTipo('personalizar').map((e) => ({
                id: String(e.id),
                nombre: e.nombre,
                minimo: e.minimo ?? 0,
                maximo: e.maximo ?? 1,
              })),
        acompanar:
          porTipo('acompanar').length === 0
            ? cfgCategoria.acompanar
            : activosPorTipo('acompanar').map((e) => ({
                id: String(e.id),
                nombre: e.nombre,
                precio: e.precio,
                productoReferenciaId: e.productoReferenciaId,
                minimo: e.minimo ?? 0,
                maximo: e.maximo ?? 1,
              })),
        condimento:
          porTipo('condimento').length === 0
            ? cfgCategoria.condimento
            : activosPorTipo('condimento').map((e) => ({
                id: String(e.id),
                nombre: e.nombre,
                minimo: e.minimo ?? 0,
                maximo: e.maximo ?? 1,
                insumoId: e.insumoId ?? null,
                stockTotal: e.stockTotal ?? null,
                agotado: Boolean(e.agotado),
              })),
      };
    },
    [elementos, plantillasPorCategoria]
  );

  const value = useMemo(
    () => ({
      elementos,
      plantillas,
      loading,
      cargado,
      cargar,
      agregar,
      actualizar,
      eliminar,
      agregarPlantilla,
      actualizarPlantilla,
      eliminarPlantilla,
      getPorProducto,
      getPorProductoYTipo,
      getPlantillasDeCategoria,
      getConfigParaProducto,
    }),
    [
      elementos,
      plantillas,
      loading,
      cargado,
      cargar,
      agregar,
      actualizar,
      eliminar,
      agregarPlantilla,
      actualizarPlantilla,
      eliminarPlantilla,
      getPorProducto,
      getPorProductoYTipo,
      getPlantillasDeCategoria,
      getConfigParaProducto,
    ]
  );

  return (
    <PersonalizacionContext.Provider value={value}>
      {children}
    </PersonalizacionContext.Provider>
  );
};

PersonalizacionProvider.propTypes = {
  children: PropTypes.node,
};

export default PersonalizacionProvider;
