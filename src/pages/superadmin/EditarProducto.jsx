/**
 * Propósito: Página para editar o crear un producto usando Container de Bootstrap.
 * Contenido: Componente EditarProducto con carga de datos por ID, recarga ante
 *            `catalogo_actualizado` de ESTE producto y FormularioProducto.
 * Dependencias: react-bootstrap (Container, Alert, Button), react-router-dom,
 *               FormularioProducto, api/productos.js, hooks/useAuth, services/socket,
 *               components/comunes/Skeleton (SkeletonTarjeta).
 * Uso: Ruta "/superadmin/producto/editar/:id" o "/superadmin/producto/nuevo" → <EditarProducto />
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Container, Alert, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioProducto from '../../components/admin/FormularioProducto';
import { obtenerProductoPorId, crearProducto, editarProducto } from '../../api/productos';
import { useAuth } from '../../hooks/useAuth';
import { conectarSocket, EVENTOS_SOCKET } from '../../services/socket';
import { SkeletonTarjeta } from '../../components/comunes/Skeleton';

const EditarProducto = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hydrated } = useAuth();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

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

  const handleGuardar = async (datosProducto) => {
    setError('');
    const result = id
      ? await editarProducto(id, datosProducto)
      : await crearProducto(datosProducto);
    if (result.success) {
      navigate('/superadmin/productos');
    } else {
      setError(result.error || 'No se pudo guardar el producto.');
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
      <FormularioProducto
        producto={producto}
        onGuardar={handleGuardar}
        forzarTipo={forzarTipo}
      />
    </Container>
  );
};

export default EditarProducto;
