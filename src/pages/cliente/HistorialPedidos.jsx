/**
 * Propósito: Historial de pedidos terminados del cliente (entregado, cancelado)
 * con filtros por fecha, estado y sucursal. Permite volver a comprar (Repetir).
 * Reusa FiltrosPedidos + ListaPedidos de Mis Pedidos.
 * Uso: Ruta "/cliente/historial" → <HistorialPedidos />
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button } from 'react-bootstrap';
import { FaUtensils } from 'react-icons/fa';
import { usePedidos } from '../../hooks/usePedidos';
import { useRepetirPedido } from '../../hooks/useRepetirPedido';
import { useAuth } from '../../hooks/useAuth';
import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO_PEDIDO } from '../../utils/constants';
import { formatPrice } from '../../utils/formatters';
import { obtenerSucursales } from '../../api/sucursales';
import { filtrarPedidos, FILTRO_INICIAL } from '../../utils/filtrosPedidos';
import FiltrosPedidos from '../../components/cliente/FiltrosPedidos';
import ListaPedidos from '../../components/cliente/ListaPedidos';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';
import { mensajeConfirmarRepetir, mensajeNoRepetible } from '../../utils/avisoRepetir';

const ESTADOS_FINALES = [ESTADOS_PEDIDO.ENTREGADO, ESTADOS_PEDIDO.CANCELADO];

const HistorialPedidos = () => {
  const { pedidos } = usePedidos();
  const { user } = useAuth();
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

  const terminados = useMemo(
    () => pedidos.filter((p) => ESTADOS_FINALES.includes(p.estado)),
    [pedidos]
  );
  const visibles = useMemo(() => filtrarPedidos(terminados, filtros), [terminados, filtros]);
  const estadosFiltro = useMemo(
    () =>
      ESTADOS_FINALES.map((valor) => ({
        valor,
        etiqueta: ETIQUETAS_ESTADO_PEDIDO[valor] || valor,
      })),
    []
  );

  return (
    <Container className="py-4">
      <Link to="/cliente/mis-pedidos" className="boton-volver mb-3 d-inline-block">
        <span className="boton-volver-arrow" aria-hidden="true">←</span>
        {' '}Volver a Mis Pedidos
      </Link>
      <h1 className="mb-3">Historial de pedidos</h1>

      <FiltrosPedidos
        filtros={filtros}
        onChange={setFiltros}
        estados={estadosFiltro}
        sucursales={sucursales}
      />

      {terminados.length === 0 ? (
        <Card className="shadow-sm text-center p-5">
          <h4 className="fw-bold mb-2">Todavía no tenés historial</h4>
          <p className="text-muted mb-4">Cuando se entreguen o cancelen tus pedidos van a aparecer acá.</p>
          <div>
            <Link to="/cliente/catalogo">
              <Button variant="primary" className="rounded-pill px-4">
                <FaUtensils aria-hidden="true" />
                Ir al catálogo
              </Button>
            </Link>
          </div>
        </Card>
      ) : visibles.length === 0 ? (
        <Card className="shadow-sm text-center p-5">
          <h4 className="fw-bold mb-2">Sin resultados para los filtros</h4>
          <p className="text-muted mb-0">Probá ampliando fecha, estado o sucursal.</p>
        </Card>
      ) : (
        <ListaPedidos
          pedidos={visibles}
          user={user}
          repitiendoId={repitiendoId}
          pedirRepeticion={pedirRepeticion}
          mostrarCancelar={false}
        />
      )}

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

export default HistorialPedidos;
