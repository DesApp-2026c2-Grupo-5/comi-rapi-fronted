/**
 * Propósito: Página para editar o crear un producto usando Container de Bootstrap.
 * Contenido: Componente EditarProducto con carga de datos por ID, recarga ante
 *            `catalogo_actualizado` de ESTE producto, FormularioProducto y el
 *            aviso de promociones que no alcanzan al producto.
 * Dependencias: react-bootstrap (Container, Alert, Button), react-router-dom,
 *               FormularioProducto, api/productos.js, api/promociones.js,
 *               hooks/useAuth, hooks/useNotificaciones, services/socket,
 *               components/comunes/Skeleton (SkeletonTarjeta), EditarProducto.css.
 * Uso: Ruta "/superadmin/producto/editar/:id" o "/superadmin/producto/nuevo" → <EditarProducto />
 *
 * El alcance de una promoción es una lista explícita de productos
 * (`PromocionProducto`), no una categoría: por eso un producto nuevo nace fuera
 * de todas las promos y el descuento no le aplica. Esta pantalla revisa ese
 * hueco al abrir y al guardar, y ofrece el alta en un clic.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Container, Alert, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioProducto from '../../components/admin/FormularioProducto';
import { obtenerProductoPorId, crearProducto, editarProducto } from '../../api/productos';
import {
  obtenerPromociones,
  obtenerProductosDePromocion,
  asignarProducto,
} from '../../api/promociones';
import { useAuth } from '../../hooks/useAuth';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { conectarSocket, EVENTOS_SOCKET } from '../../services/socket';
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
 * @param {number|string} productoId
 * @param {number|string} categoriaId
 * @returns {Promise<Array<{id: number, nombre: string}>>}
 */
const promocionesQueNoAlcanzan = async (productoId, categoriaId) => {
  const idProducto = Number(productoId);
  const idCategoria = Number(categoriaId);
  if (!Number.isInteger(idProducto) || !Number.isInteger(idCategoria)) {
    return [];
  }

  // Sin argumentos trae solo las promociones activas.
  const resPromociones = await obtenerPromociones();
  if (!resPromociones.success) return [];

  const faltantes = [];
  for (const promocion of resPromociones.data) {
    const resProductos = await obtenerProductosDePromocion(promocion.id);
    if (!resProductos.success) continue;
    const alcanzados = resProductos.data || [];
    if (alcanzados.some((p) => Number(p.id) === idProducto)) continue;
    if (alcanzados.some((p) => Number(p.categoriaId) === idCategoria)) {
      faltantes.push(promocion);
    }
  }
  return faltantes;
};

const EditarProducto = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hydrated } = useAuth();
  const { notificar } = useNotificaciones();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  // Promos de la categoría que todavía no incluyen a este producto.
  const [sugerencias, setSugerencias] = useState([]);
  const [agregandoId, setAgregandoId] = useState(null);
  const [descartado, setDescartado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Un combo se crea en su propia pantalla, así el formulario no le muestra al
  // admin el campo "tipo" para elegir entre producto y combo.
  const forzarTipo = location.pathname.includes('nuevo-combo') ? 'COMBO' : null;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    if (id) {
      const result = await obtenerProductoPorId(id);
      if (result.success) {
        setProducto(result.data);
      } else {
        setProducto(null);
        setError(result.error || 'No se pudo cargar el producto.');
      }
    }
    setCargando(false);
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Si cambia ESTE producto (el que se está editando), se recarga para mostrar
  // los datos vigentes. Eventos de otras entidades se ignoran a propósito:
  // resetear el formulario por cambios ajenos perdería la edición en curso.
  useEffect(() => {
    if (!hydrated || !user) return undefined;
    const instancia = conectarSocket();
    const alEvento = (payload) => {
      if (payload?.tipo !== 'producto') return;
      if (Number(payload?.id) !== Number(id)) return;
      cargar();
    };
    instancia.on(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alEvento);
    return () => {
      instancia.off(EVENTOS_SOCKET.CATALOGO_ACTUALIZADO, alEvento);
    };
  }, [hydrated, user, id, cargar]);

  // El aviso es por producto: al cambiar de pantalla vuelve a mostrarse aunque
  // se haya ocultado en el anterior.
  useEffect(() => {
    setDescartado(false);
    setSugerencias([]);
  }, [id]);

  // Revisión al abrir. Cubre también los productos creados antes de que
  // existiera este aviso, sin obligar a guardarlos de nuevo.
  useEffect(() => {
    if (!id || !producto || producto.tipo === 'COMBO') return undefined;
    let vigente = true;
    promocionesQueNoAlcanzan(producto.id, producto.categoriaId).then((res) => {
      if (vigente) setSugerencias(res);
    });
    return () => {
      vigente = false;
    };
  }, [id, producto]);

  const agregarAPromocion = async (promocion) => {
    const productoId = producto?.id ?? id;
    if (!productoId) return;
    setAgregandoId(promocion.id);
    const result = await asignarProducto(promocion.id, productoId);
    setAgregandoId(null);
    if (!result.success) {
      setError(result.error || 'No se pudo agregar el producto a la promoción.');
      return;
    }
    notificar(`Producto agregado a ${promocion.nombre}.`, 'success');
    setSugerencias((prev) => prev.filter((p) => p.id !== promocion.id));
  };

  const handleGuardar = async (datosProducto) => {
    if (guardando) return;
    setGuardando(true);
    setError('');
    try {
      const result = id
        ? await editarProducto(id, datosProducto)
        : await crearProducto(datosProducto);
      if (!result.success) {
        setError(result.error || 'No se pudo guardar el producto.');
        return;
      }

      // Un combo no puede ser alcanzado por promociones: el backend lo rechaza.
      if (datosProducto.tipo === 'COMBO') {
        navigate('/superadmin/productos');
        return;
      }

      const productoId = id || result.data?.id;
      const nuevas = await promocionesQueNoAlcanzan(
        productoId,
        datosProducto.categoriaId
      );

      if (nuevas.length === 0) {
        navigate('/superadmin/productos');
        return;
      }

      // Se queda en la pantalla en vez de ir al listado: el aviso solo sirve si
      // está a la vista cuando el admin todavía tiene fresco el producto.
      setSugerencias(nuevas);
      setDescartado(false);
      if (!id) {
        // Ya existe: la ruta de alta volvería a crear otro producto.
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
