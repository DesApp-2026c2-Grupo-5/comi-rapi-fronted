/**
 * Propósito: Pedidos activos del cliente (confirmado, en preparación,
 *            listo para entregar, en camino) con filtros y acceso al Historial.
 * Contenido: Componente MisPedidos que reusa FiltrosPedidos + ListaPedidos.
 * Uso: Ruta "/cliente/mis-pedidos" → <MisPedidos />
 *
 * NOTA: Los pedidos provienen de la API real; el backend ya devuelve solo los
 * pedidos del cliente autenticado (scope por usuarioId).
 *
 * Un pedido en PENDIENTE (creado pero todavía sin pagar) NO aparece acá: recién
 * entra a la lista cuando el pago lo pasa a CONFIRMADO. Mientras tanto el único
 * lugar donde se lo ve es la pantalla de pago, a la que se llega en el momento
 * de crearlo (ver `pages/cliente/Pago.jsx`, que lo recupera de la API si la
 * página se recarga).
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button } from 'react-bootstrap';
import { FaUtensils, FaHistory } from 'react-icons/fa';
import { usePedidos } from '../../hooks/usePedidos';
import { useRepetirPedido } from '../../hooks/useRepetirPedido';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { useAuth } from '../../hooks/useAuth';
import { ESTADOS_PEDIDO, ESTADOS_ACTIVOS_PEDIDO, ETIQUETAS_ESTADO_PEDIDO } from '../../utils/constants';
import { formatPrice } from '../../utils/formatters';
import { obtenerSucursales } from '../../api/sucursales';
import { filtrarPedidos, FILTRO_INICIAL } from '../../utils/filtrosPedidos';
import FiltrosPedidos from '../../components/cliente/FiltrosPedidos';
import ListaPedidos from '../../components/cliente/ListaPedidos';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';
import { mensajeConfirmarRepetir, mensajeNoRepetible } from '../../utils/avisoRepetir';

// Sin PENDIENTE: el pedido todavía no se pagó, así que no cuenta como pedido
// activo del cliente. Mismo criterio que la pantalla "Pedidos" del admin.
const ESTADOS_ACTIVOS = ESTADOS_ACTIVOS_PEDIDO;

const MisPedidos = () => {
  const { pedidos, cambiarEstado } = usePedidos();
  const { notificar } = useNotificaciones();
  const { user } = useAuth();
  // Evita doble clic mientras una cancelación está en curso
  const [cancelandoId, setCancelandoId] = useState(null);
  // Pedido que está esperando confirmación de cancelación en el modal
  const [pedidoACancelar, setPedidoACancelar] = useState(null);
  // Pedido que no puede cancelarse (se muestra el aviso "ya comenzó a prepararse")
  const [pedidoNoCancelable, setPedidoNoCancelable] = useState(null);
  const [filtros, setFiltros] = useState(FILTRO_INICIAL);
  const [sucursales, setSucursales] = useState([]);
  const {
    repitiendoId,
    pedidoARepetir,
    vistaPrevia,
    noRepetible,
    pedirRepeticion,
    cancelarRepeticion,
    cerrarAviso,
    confirmarRepeticion,
  } = useRepetirPedido();

  useEffect(() => {
    let vivo = true;
    obtenerSucursales().then((res) => {
      if (vivo && res.success) setSucursales(res.data);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const activos = useMemo(
    () => pedidos.filter((p) => ESTADOS_ACTIVOS.includes(p.estado)),
    [pedidos]
  );
  const visibles = useMemo(() => filtrarPedidos(activos, filtros), [activos, filtros]);
  const estadosFiltro = useMemo(
    () =>
      ESTADOS_ACTIVOS.map((valor) => ({
        valor,
        etiqueta: ETIQUETAS_ESTADO_PEDIDO[valor] || valor,
      })),
    []
  );

  // Sólo se cancela antes de iniciar la preparación. Como a esta pantalla los
  // pedidos sin pagar ya no llegan, el único estado cancelable es CONFIRMADO.
  const esCancelable = (pedido) => pedido.estado === ESTADOS_PEDIDO.CONFIRMADO;

  // Pide confirmación con el modal antes de cancelar y persiste en la API.
  const pedirCancelacion = (pedido) => {
    if (esCancelable(pedido)) {
      setPedidoACancelar(pedido);
    } else {
      setPedidoNoCancelable(pedido);
    }
  };

  const handleCancelar = async () => {
    if (!pedidoACancelar) return;
    setCancelandoId(pedidoACancelar.id);
    try {
      const actualizado = await cambiarEstado(
        pedidoACancelar.id,
        ESTADOS_PEDIDO.CANCELADO
      );
      if (actualizado) {
        notificar(`Pedido #${pedidoACancelar.id} cancelado`, 'success');
      }
      setPedidoACancelar(null);
    } finally {
      setCancelandoId(null);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h1 className="mb-0">Mis Pedidos</h1>
        {/* `as={Link}` en vez de Link > Button: un botón anidado dentro de un
            enlace duplica el nodo accesible y lo agrega dos veces al tabulador. */}
        <Button as={Link} to="/cliente/historial" variant="outline-secondary" size="sm">
          <FaHistory aria-hidden="true" />
          {' '}Ver historial
        </Button>
      </div>

      <FiltrosPedidos
        filtros={filtros}
        onChange={setFiltros}
        estados={estadosFiltro}
        sucursales={sucursales}
      />

      {activos.length === 0 ? (
        <Card className="shadow-sm text-center p-5">
          <h2 className="h4 fw-bold mb-2">No tenés pedidos en curso</h2>
          <p className="text-muted mb-4">¡Hacé tu primer pedido y seguí su estado acá!</p>
          <Button as={Link} to="/cliente/catalogo" variant="primary" className="rounded-pill px-4">
            <FaUtensils aria-hidden="true" />
            Ir al catálogo
          </Button>
        </Card>
      ) : visibles.length === 0 ? (
        <Card className="shadow-sm text-center p-5">
          <h2 className="h4 fw-bold mb-2">Sin resultados para los filtros</h2>
          <p className="text-muted mb-0">Probá ampliando fecha, estado o sucursal.</p>
        </Card>
      ) : (
        <ListaPedidos
          pedidos={visibles}
          user={user}
          cancelandoId={cancelandoId}
          repitiendoId={repitiendoId}
          pedirCancelacion={pedirCancelacion}
          pedirRepeticion={pedirRepeticion}
          mostrarCancelar
        />
      )}

      <ConfirmarModal
        mostrar={Boolean(pedidoACancelar)}
        titulo="Cancelar pedido"
        mensaje={
          pedidoACancelar ? '¿Seguro que querés cancelar el pedido?' : ''
        }
        textoConfirmar="Sí, cancelar pedido"
        cargando={Boolean(cancelandoId)}
        onConfirmar={handleCancelar}
        onCancelar={() => setPedidoACancelar(null)}
      />

      <ConfirmarModal
        aviso
        mostrar={Boolean(pedidoNoCancelable)}
        titulo="No se puede cancelar"
        mensaje={
          pedidoNoCancelable
            ? 'Este pedido ya comenzó a prepararse, por lo que no puede cancelarse.'
            : ''
        }
        onCancelar={() => setPedidoNoCancelable(null)}
      />

      <ConfirmarModal
        mostrar={Boolean(pedidoARepetir)}
        titulo="Repetir pedido"
        mensaje={mensajeConfirmarRepetir(pedidoARepetir, vistaPrevia, formatPrice)}
        textoConfirmar="Sí, repetir pedido"
        cargando={Boolean(repitiendoId) || Boolean(vistaPrevia?.cargando)}
        onConfirmar={confirmarRepeticion}
        onCancelar={cancelarRepeticion}
      />

      <ConfirmarModal
        aviso
        mostrar={Boolean(noRepetible)}
        titulo="No se puede repetir"
        mensaje={mensajeNoRepetible(noRepetible)}
        onCancelar={cerrarAviso}
      />
    </Container>
  );
};

export default MisPedidos;
