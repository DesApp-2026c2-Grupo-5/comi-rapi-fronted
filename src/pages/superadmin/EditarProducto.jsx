/**
 * Propósito: Página para editar o crear un producto usando Container de Bootstrap.
 * Contenido: Componente EditarProducto con carga de datos por ID vía TanStack
 *            Query, FormularioProducto y el aviso de promociones que no
 *            alcanzan al producto.
 * Dependencias: react-bootstrap (Container, Alert, Button), react-router-dom,
 *               FormularioProducto, api/productos.js, api/promociones.js,
 *               hooks/queries, hooks/useNotificaciones,
 *               components/comunes/Skeleton (SkeletonTarjeta), EditarProducto.css.
 * Uso: Ruta "/superadmin/producto/editar/:id" o "/superadmin/producto/nuevo" → <EditarProducto />
 *
 * El alcance de una promoción es una lista explícita de productos
 * (`PromocionProducto`), no una categoría: por eso un producto nuevo nace fuera
 * de todas las promos y el descuento no le aplica. Esta pantalla revisa ese
 * hueco al abrir y al guardar, y ofrece el alta en un clic.
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Container, Alert, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioProducto from '../../components/admin/FormularioProducto';
import { crearProducto, editarProducto } from '../../api/productos';
import { asignarProducto } from '../../api/promociones';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { useProducto, usePromociones } from '../../hooks/queries';
import { SkeletonTarjeta } from '../../components/comunes/Skeleton';
import './EditarProducto.css';

/**
 * Promociones activas que ya alcanzan productos de la misma categoría que el
 * producto dado, pero que no lo incluyen a él.
 *
 * Se compara por categoría porque es la unidad con la que el superadmin piensa
 * las promos ("10% Hamburguesas"), aunque el modelo guarde el alcance producto
 * por producto. Devuelve solo los huecos: lo que ya está asignado no se repite.
 *
 * @param {Array} promociones promociones activas con `productos` incluidos
 * @param {number|string} productoId
 * @param {number|string} categoriaId
 * @returns {Array<{id: number, nombre: string}>}
 */
const promocionesQueNoAlcanzan = (promociones, productoId, categoriaId) => {
  const idProducto = Number(productoId);
  const idCategoria = Number(categoriaId);
  if (!Number.isInteger(idProducto) || !Number.isInteger(idCategoria)) {
    return [];
  }

  return promociones.filter((promocion) => {
    const alcanzados = Array.isArray(promocion.productos)
      ? promocion.productos
      : [];
    if (alcanzados.some((p) => Number(p.id) === idProducto)) return false;
    return alcanzados.some((p) => Number(p.categoriaId) === idCategoria);
  });
};

const EditarProducto = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notificar } = useNotificaciones();
  // `staleTime: Infinity` evita que un refetch al volver a la pestaña pise la
  // edición en curso. Las claves se invalidan cuando el backend avisa cambios.
  const {
    data: producto = null,
    isPending,
    error: errorProducto,
  } = useProducto(id, { enabled: Boolean(id), staleTime: Infinity });
  const [errorLocal, setErrorLocal] = useState('');
  const [agregandoId, setAgregandoId] = useState(null);
  const [descartado, setDescartado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const error = errorLocal || errorProducto?.message || '';
  const cargando = Boolean(id) && isPending;

  // Las promos activas traen sus productos incluidos: el aviso se deduce de esa
  // misma lectura, sin una petición por cada promo.
  const { data: promociones = [] } = usePromociones({
    incluirProductos: true,
    enabled: Boolean(id),
  });
  const sugerencias = useMemo(
    () =>
      producto && producto.tipo !== 'COMBO'
        ? promocionesQueNoAlcanzan(
            promociones,
            producto.id,
            producto.categoriaId
          )
        : [],
    [promociones, producto]
  );

  // Un combo se crea en su propia pantalla, así el formulario no le muestra al
  // admin el campo "tipo" para elegir entre producto y combo.
  const forzarTipo = location.pathname.includes('nuevo-combo') ? 'COMBO' : null;

  // El aviso es por producto: al cambiar de pantalla vuelve a mostrarse aunque
  // se haya ocultado en el anterior.
  useEffect(() => {
    setDescartado(false);
  }, [id]);

  const agregarAPromocion = async (promocion) => {
    const productoId = producto?.id ?? id;
    if (!productoId) return;
    setAgregandoId(promocion.id);
    const result = await asignarProducto(promocion.id, productoId);
    setAgregandoId(null);
    if (!result.success) {
      setErrorLocal(result.error || 'No se pudo agregar el producto a la promoción.');
      return;
    }
    notificar(`Producto agregado a ${promocion.nombre}.`, 'success');
    // La lista de promociones incluye los productos asignados: al invalidarla,
    // el aviso recalcula y esta promoción deja de aparecer.
    await queryClient.invalidateQueries({ queryKey: ['public', 'promociones'] });
  };

  const handleGuardar = async (datosProducto) => {
    if (guardando) return;
    setGuardando(true);
    setErrorLocal('');
    try {
      const result = id
        ? await editarProducto(id, datosProducto)
        : await crearProducto(datosProducto);
      if (!result.success) {
        setErrorLocal(result.error || 'No se pudo guardar el producto.');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['public'] });

      // Un combo no puede ser alcanzado por promociones: el backend lo rechaza.
      if (datosProducto.tipo === 'COMBO') {
        navigate('/superadmin/productos');
        return;
      }

      const productoId = id || result.data?.id;
      const nuevas = promocionesQueNoAlcanzan(
        promociones,
        productoId,
        datosProducto.categoriaId
      );

      if (nuevas.length === 0) {
        navigate('/superadmin/productos');
        return;
      }

      setDescartado(false);
      if (!id) {
        // Ya existe: la ruta de alta volvería a crear otro producto. La pantalla
        // de edición recalcula el aviso con los datos recién creados.
        navigate(`/superadmin/producto/editar/${productoId}`, { replace: true });
      }
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <Container className="py-5" role="status" aria-live="polite">
        <span className="visually-hidden">Cargando producto…</span>
        <SkeletonTarjeta />
      </Container>
    );
  }

  if (id && !producto) {
    return (
      <Container className="py-5 text-center">
        <h1 className="h2">{error || 'Producto no encontrado'}</h1>
        <Button as={Link} to="/superadmin/productos" variant="secondary" className="mt-3">
          <FaArrowLeft className="me-1" aria-hidden="true" />
          Volver a productos
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Link to="/superadmin/productos" className="text-danger text-decoration-none mb-3 d-inline-block">
        ← Volver a productos
      </Link>
      <h1 className="h2 mb-4">
        {id ? `Editar Producto #${id}` : forzarTipo ? 'Nuevo Combo' : 'Nuevo Producto'}
      </h1>
      {error && <Alert variant="danger" role="alert">{error}</Alert>}

      {sugerencias.length > 0 && !descartado && (
        <section
          className="aviso-promocion"
          aria-labelledby="aviso-promocion-titulo"
          aria-live="polite"
        >
          <div className="aviso-promocion-cabecera">
            <h2 id="aviso-promocion-titulo" className="aviso-promocion-titulo">
              {sugerencias.length === 1
                ? 'Este producto quedó fuera de una promoción de su categoría'
                : `Este producto quedó fuera de ${sugerencias.length} promociones de su categoría`}
            </h2>
            <Button
              variant="link"
              size="sm"
              className="aviso-promocion-ocultar"
              onClick={() => setDescartado(true)}
            >
              Ocultar
            </Button>
          </div>
          <p className="aviso-promocion-detalle">
            Ya descuentan otros productos de la misma categoría. Si querés que
            también alcancen a este, agregalo:
          </p>
          <ul className="aviso-promocion-lista">
            {sugerencias.map((promocion) => (
              <li key={promocion.id} className="aviso-promocion-item">
                <span className="aviso-promocion-nombre">{promocion.nombre}</span>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={agregandoId === promocion.id}
                  onClick={() => agregarAPromocion(promocion)}
                >
                  {agregandoId === promocion.id ? 'Agregando…' : 'Agregar'}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <FormularioProducto
        producto={producto}
        onGuardar={guardando ? undefined : handleGuardar}
        forzarTipo={forzarTipo}
      />
    </Container>
  );
};

export default EditarProducto;
