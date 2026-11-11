/**
 * Propósito: Página de detalle de un pedido con datos, sucursal asignada y stepper de
 *            estados (el mismo visual que usa el admin: iconos que se encienden/apagan).
 * Contenido: Componente DetallePedido con Card, Table, Badge y stepper horizontal de estados.
 * Dependencias: react-bootstrap (Container, Card, Table, Badge, Button, Row, Col),
 *               react-router-dom, hooks/usePedidos, utils/constants.js, utils/formatters.js,
 *               componentes/comunes/HistorialStepper, DetallePedido.css.
 * Uso: Ruta "/cliente/pedido/:id" → <DetallePedido />
 */

import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Card,
  Table,
  Badge,
  Button,
  Row,
  Col,
  Alert,
} from "react-bootstrap";
import { FaArrowLeft, FaRedo, FaShippingFast, FaStar, FaPen, FaExclamationCircle } from "react-icons/fa";
import { usePedidos } from "../../hooks/usePedidos";
import { useRepetirPedido } from "../../hooks/useRepetirPedido";
import { useParametros } from "../../hooks/useParametros";
import {
  obtenerMisResenas,
  obtenerProductosElegiblesParaResenar,
} from "../../api/resenas";
import { obtenerMisQuejas, responderQueja, cerrarQueja } from "../../api/quejas";
import {
  ESTADOS_PEDIDO,
  ETIQUETAS_ESTADO_PEDIDO,
  VARIANTE_ESTADO_PEDIDO,
} from "../../utils/constants";
import { formatPrice } from "../../utils/formatters";
import { calcularCostoEnvio } from "../../services/envio";
import {
  conectarSocket,
  EVENTOS_SOCKET,
  suscribirPedido,
  desuscribirPedido,
} from "../../services/socket";
import { formatearDireccion } from "../../utils/direccion";
import IconoEstado from "../../components/comunes/IconoEstado";
import HistorialStepper from "../../components/comunes/HistorialStepper";
import ConfirmarModal from "../../components/comunes/ConfirmarModal";
import ResenaModal from "../../components/cliente/ResenaModal";
import QuejaModal from "../../components/cliente/QuejaModal";
import ConversacionQuejaCliente from "../../components/cliente/ConversacionQuejaCliente";
import { SkeletonTabla } from "../../components/comunes/Skeleton";
import {
  mensajeConfirmarRepetir,
  mensajeNoRepetible,
} from "../../utils/avisoRepetir";
import { textoLlegada } from "../../utils/llegada";
import EtaPillBadge from "../../components/comunes/EtaPillBadge";
import "./DetallePedido.css";

const DetallePedido = () => {
  const { id } = useParams();
  const { pedidos, cargandoPedidos } = usePedidos();
  const { parametros } = useParametros();
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
  const pedido = pedidos.find((p) => p.id === Number(id));

  // Anuncio accesible de cambios de estado (WebSocket → refetch): solo en
  // transiciones, no en el tick de minutos, para no spamear al lector.
  const [anuncioEstado, setAnuncioEstado] = useState("");
  const estadoAnterior = useRef(pedido?.estado);
  useEffect(() => {
    if (!pedido) return;
    if (
      estadoAnterior.current !== undefined &&
      estadoAnterior.current !== pedido.estado
    ) {
      const etiqueta = ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || pedido.estado;
      setAnuncioEstado(`Tu pedido #${pedido.id} pasó a estado: ${etiqueta}.`);
    }
    estadoAnterior.current = pedido.estado;
  }, [pedido]);

  // Reseñas: solo se consultan si el pedido está entregado. `elegibles` son los
  // productos de ESTE pedido que el cliente todavía no reseñó; `misResenas`
  // permite ofrecer "Editar" en los que ya tienen reseña.
  const [elegibles, setElegibles] = useState([]);
  const [misResenas, setMisResenas] = useState([]);
  const [productoAResenar, setProductoAResenar] = useState(null);
  const [queja, setQueja] = useState(null);
  const [cargandoQueja, setCargandoQueja] = useState(false);
  const [mostrarQuejaModal, setMostrarQuejaModal] = useState(false);
  const [recargaQueja, setRecargaQueja] = useState(0);
  const [respuestaQueja, setRespuestaQueja] = useState("");
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);
  const [errorQueja, setErrorQueja] = useState("");
  const [mostrarCerrarQueja, setMostrarCerrarQueja] = useState(false);
  const [cerrandoQueja, setCerrandoQueja] = useState(false);
  const esEntregado = pedido?.estado === ESTADOS_PEDIDO.ENTREGADO;
  const pedidoId = pedido?.id;

  // Reclamos: un pedido entregado admite una sola queja. Se consulta solo en
  // ese estado para no pedir datos que no se van a mostrar.
  useEffect(() => {
    if (!esEntregado || !pedidoId) {
      setQueja(null);
      return undefined;
    }
    let vivo = true;
    setCargandoQueja(true);
    obtenerMisQuejas(pedidoId).then((res) => {
      if (!vivo) return;
      if (res.success) setQueja(res.data[0] || null);
      setCargandoQueja(false);
    });
    return () => {
      vivo = false;
    };
  }, [esEntregado, pedidoId, recargaQueja]);

  useEffect(() => {
    if (!esEntregado || !pedidoId) return undefined;
    const socket = conectarSocket();
    const alActualizar = () => setRecargaQueja((valor) => valor + 1);
    socket.on(EVENTOS_SOCKET.QUEJA_ACTUALIZADA, alActualizar);

    // Suscribirse al pedido para recibir notificaciones del cliente
    const suscribir = async () => {
      const resp = await suscribirPedido(pedidoId);
      if (!resp.success) console.warn('Suscripción al pedido falló', resp.error);
    };
    suscribir();

    // Re-suscribir al reconectar
    const onConnect = () => {
      suscribir();
    };
    socket.on('connect', onConnect);

    return () => {
      socket.off(EVENTOS_SOCKET.QUEJA_ACTUALIZADA, alActualizar);
      socket.off('connect', onConnect);
      desuscribirPedido(pedidoId);
    };
  }, [esEntregado, pedidoId]);

  useEffect(() => {
    if (!esEntregado || !pedidoId) {
      setElegibles([]);
      setMisResenas([]);
      return undefined;
    }
    let vivo = true;
    (async () => {
      const [resElegibles, resMias] = await Promise.all([
        obtenerProductosElegiblesParaResenar(pedidoId),
        obtenerMisResenas(),
      ]);
      if (!vivo) return;
      if (resElegibles.success) setElegibles(resElegibles.data);
      if (resMias.success) setMisResenas(resMias.data);
    })();
    return () => {
      vivo = false;
    };
  }, [esEntregado, pedidoId]);

  // A6: badge estático de llegada (la hora es fija, no necesita countdown).
  // Va ANTES de cualquier early return: los hooks deben correr siempre.

  if (!pedido) {
    if (cargandoPedidos) {
      return (
        <Container className="py-5" role="status" aria-live="polite">
          <span className="visually-hidden">Cargando tu pedido…</span>
          <SkeletonTabla filas={4} columnas={3} />
        </Container>
      );
    }
    return (
      <Container className="py-5 text-center">
        <h1 className="h2 detalle-no-encontrado">Pedido no encontrado</h1>
        <p className="text-muted mb-4">No se encontró el pedido con ID #{id}</p>
        <Button
          as={Link}
          to="/cliente/mis-pedidos"
          className="boton-volver-btn"
        >
          <FaArrowLeft className="me-1" aria-hidden="true" />
          Volver a Mis Pedidos
        </Button>
      </Container>
    );
  }

  const estadoLabel = ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || pedido.estado;
  // El total del backend ya incluye el envío (los seed más viejos lo calculan).
  const costoEnvio =
    pedido.costoEnvio ?? calcularCostoEnvio(pedido.total, parametros);
  const subtotal = pedido.total - costoEnvio;
  const esFinal =
    pedido.estado === ESTADOS_PEDIDO.ENTREGADO ||
    pedido.estado === ESTADOS_PEDIDO.CANCELADO;
  // A6: solo visible en en_camino con hora estimada persistida.
  const textoLlegadaEnCamino =
    pedido.estado === ESTADOS_PEDIDO.EN_CAMINO && pedido.horaEstimadaLlegada
      ? textoLlegada(pedido.horaEstimadaLlegada)
      : null;
  // T4: aviso de reasignación — el cliente ve que su pedido cambió de
  // sucursal (detectado por la observación "Reasignado..." en el historial).
  const reasignado = (pedido.historialEstados || []).some(
    (h) => h.observacion && /reasignado/i.test(h.observacion),
  );

  // Reseñas por ítem: la propia (para editar) y si está habilitado (para
  // calificar). El backend vuelve a validar la compra entregada.
  const miResenaDe = (productoId) =>
    misResenas.find((r) => String(r.productoId) === String(productoId));

  const esElegible = (productoId) =>
    elegibles.some((p) => String(p.productoId) === String(productoId));

  const alGuardarResena = async () => {
    setProductoAResenar(null);
    const [resElegibles, resMias] = await Promise.all([
      obtenerProductosElegiblesParaResenar(pedido.id),
      obtenerMisResenas(),
    ]);
    if (resElegibles.success) setElegibles(resElegibles.data);
    if (resMias.success) setMisResenas(resMias.data);
  };

  const alGuardarQueja = (nuevaQueja) => {
    setQueja(nuevaQueja);
    setMostrarQuejaModal(false);
  };

  const enviarRespuestaQueja = async (evento) => {
    evento.preventDefault();
    if (!queja || !respuestaQueja.trim()) return;
    setEnviandoRespuesta(true);
    setErrorQueja("");
    const res = await responderQueja(queja.id, respuestaQueja.trim());
    setEnviandoRespuesta(false);
    if (res.success) {
      setQueja(res.data);
      setRespuestaQueja("");
    } else {
      setErrorQueja(res.error || "No se pudo enviar la respuesta");
    }
  };

  const confirmarCierreQueja = async () => {
    if (!queja) return;
    setCerrandoQueja(true);
    setErrorQueja("");
    const res = await cerrarQueja(queja.id);
    setCerrandoQueja(false);
    if (res.success) {
      setQueja(res.data);
      setMostrarCerrarQueja(false);
    } else {
      setErrorQueja(res.error || "No se pudo cerrar el reclamo");
    }
  };

  return (
    <Container className="py-5">
      <Link to="/cliente/mis-pedidos" className="boton-volver mb-4">
        <span className="boton-volver-arrow" aria-hidden="true">
          ←
        </span>
        Volver a Mis Pedidos
      </Link>

      <Card className="detalle-card">
        <Card.Header className="detalle-card-header d-flex justify-content-between align-items-center">
          <h1 className="h4 mb-0">Pedido #{pedido.id}</h1>
          <div className="d-flex align-items-center gap-2">
            <Badge
              bg={VARIANTE_ESTADO_PEDIDO[pedido.estado] || "secondary"}
              className="badge-estado fs-6 d-inline-flex align-items-center gap-1"
            >
              <IconoEstado estado={pedido.estado} size={16} />
              {estadoLabel}
            </Badge>
          </div>
        </Card.Header>

        <Card.Body className="p-4">
{/* A6: alert prominente cuando el pedido sale en camino. La hora
              es fija (persistida al pasar a en_camino), no un countdown. */}
           {textoLlegadaEnCamino && (
             <Alert
               variant="success"
               className="d-flex align-items-center gap-3 mb-4"
               role="status"
             >
               <FaShippingFast
                 size={28}
                 aria-hidden="true"
                 className="flex-shrink-0"
               />
               <div className="flex-grow-1">
                 <strong className="d-block">Tu pedido está en camino</strong>
                 <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                   <span className="small">{textoLlegadaEnCamino}</span>
                   {pedido.etaMinutos && (
                      <EtaPillBadge
                        variant="map"
                        minutes={pedido.etaMinutos}
                        arrivalTime={pedido.horaEstimadaLlegada}
                      />
                   )}
                 </div>
               </div>
             </Alert>
           )}
          {/* T4: aviso de reasignación de sucursal */}
          {reasignado && (
            <Alert variant="warning" className="mb-4">
              <strong>Tu pedido fue reasignado de sucursal.</strong> El tiempo
              de entrega puede verse afectado.
            </Alert>
          )}
          {/* Información del cliente y sucursal asignada */}
          <Row className="g-3 mb-4">
            <Col md={6}>
              <div className="detalle-info">
                <span className="detalle-etiqueta">Cliente</span>
                <p className="detalle-valor mb-0">{pedido.cliente}</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="detalle-info">
                <span className="detalle-etiqueta">Sucursal asignada</span>
                <p className="detalle-valor mb-0">
                  {pedido.sucursal?.nombre || pedido.sucursal}
                </p>
                {pedido.sucursal?.direccion && (
                  <p className="detalle-valor-secundario mb-0">
                    {formatearDireccion(pedido.sucursal.direccion)}
                  </p>
                )}
              </div>
            </Col>
          </Row>

          <h2 className="h5 detalle-tabla-titulo mb-3">Productos</h2>

          {/* Tabla de productos */}
          <Table hover responsive className="detalle-tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
                {esEntregado && <th>Reseña</th>}
              </tr>
            </thead>
            <tbody>
              {pedido.productos.map((prod, idx) => {
                const tieneDesglose =
                  (prod.extras && prod.extras.length > 0) ||
                  (prod.sin && prod.sin.length > 0) ||
                  (prod.acompanamientos && prod.acompanamientos.length > 0) ||
                  (prod.condimentos && prod.condimentos.length > 0);
                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td>{prod.nombre}</td>
                      <td>{prod.cantidad}</td>
                      <td>{formatPrice(prod.precio)}</td>
                      <td>{formatPrice(prod.precio * prod.cantidad)}</td>
                      {esEntregado && (
                        <td>
                          {prod.productoId ? (
                            miResenaDe(prod.productoId) ? (
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() =>
                                  setProductoAResenar({
                                    id: prod.productoId,
                                    nombre: prod.nombre,
                                    resena: miResenaDe(prod.productoId),
                                  })
                                }
                              >
                                <FaPen className="me-1" aria-hidden="true" />
                                Editar
                              </Button>
                            ) : esElegible(prod.productoId) ? (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() =>
                                  setProductoAResenar({
                                    id: prod.productoId,
                                    nombre: prod.nombre,
                                    resena: null,
                                  })
                                }
                              >
                                <FaStar className="me-1" aria-hidden="true" />
                                Calificar
                              </Button>
                            ) : (
                              <span className="text-muted small">—</span>
                            )
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                    {tieneDesglose && (
                      <tr>
                        <td colSpan={esEntregado ? 5 : 4} className="small text-muted bg-crema">
                          {prod.extras?.map((ex) => (
                            <div key={ex.id}>
                              › Extra: {ex.nombre} (+{formatPrice(ex.precio)}) x
                              {ex.cantidad}
                            </div>
                          ))}
                          {prod.acompanamientos?.map((ac) => (
                            <div key={ac.id}>
                              › Acompañamiento: {ac.nombre} (+
                              {formatPrice(ac.precio)}) x{ac.cantidad}
                            </div>
                          ))}
                          {prod.sin?.map((s) => (
                            <div key={s}>
                              › <strong>Sin {s}</strong>
                            </div>
                          ))}
                          {prod.condimentos?.map((c) => (
                            <div key={c.nombre}>
                              › {c.nombre} x{c.cantidad}{" "}
                              <span className="text-muted">(sin costo)</span>
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                    {prod.nota && (
                      <tr>
                        <td
                          colSpan={esEntregado ? 5 : 4}
                          className="small bg-crema"
                        >
                          &rsaquo; <strong>Nota para cocina:</strong> {prod.nota}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </Table>

          {/* Totales (el total del backend ya incluye el envío) */}
          <div className="detalle-subtotal-envio mt-4 mb-2">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="detalle-subtotal-envio mb-2">
            <span>Envío</span>
            <span>{costoEnvio === 0 ? "Gratis" : formatPrice(costoEnvio)}</span>
          </div>
          <div className="detalle-total mt-2 mb-4">
            <span>Total</span>
            <span className="text-danger">{formatPrice(pedido.total)}</span>
          </div>
          {(pedido.promociones || []).length > 0 && (
            <div className="detalle-subtotal-envio mb-4">
              <span>
                Descuento{" "}
                <span className="text-muted small">
                  (
                  {(pedido.promociones || [])
                    .map((promo) => promo.nombre || `#${promo.promocionId}`)
                    .join(" · ")}
                  )
                </span>
              </span>
              <span className="text-success">
                −
                {formatPrice(
                  (pedido.promociones || []).reduce(
                    (acc, promo) => acc + Number(promo.descuentoAplicado ?? 0),
                    0,
                  ),
                )}
              </span>
            </div>
          )}

          {/* Stepper de estados (mismo visual que el admin) */}
          <div className="historial-box">
            <span className="historial-titulo">Progreso del pedido</span>
            <HistorialStepper pedido={pedido} />
            <div className="visually-hidden" role="status" aria-live="polite">
              {anuncioEstado}
            </div>
          </div>

          {/* Reclamos: solo en pedidos entregados. El cliente puede reclamar
              una vez; después ve el estado y la respuesta del negocio. */}
          {esEntregado && (
            <div className="historial-box mt-4">
              <span className="historial-titulo">Reclamos</span>
              {cargandoQueja ? (
                <p className="text-muted small mb-0">Cargando reclamo…</p>
              ) : queja ? (
                <ConversacionQuejaCliente
                  queja={queja}
                  respuestaActual={respuestaQueja}
                  setRespuestaActual={setRespuestaQueja}
                  enviandoRespuesta={enviandoRespuesta}
                  cerrandoQueja={cerrandoQueja}
                  error={errorQueja}
                  onResponder={enviarRespuestaQueja}
                  onCerrar={() => setMostrarCerrarQueja(true)}
                />
              ) : (
                <>
                  <p className="text-muted small mb-2">
                    Si algo salió mal con este pedido, podés reclamarlo y el
                    local te responde.
                  </p>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setMostrarQuejaModal(true)}
                  >
                    <FaExclamationCircle className="me-1" aria-hidden="true" />
                    Hacer un reclamo
                  </Button>
                </>
              )}
            </div>
          )}

          {esFinal && (
            <div className="d-flex gap-2 mt-4 flex-wrap">
              <Button
                variant="outline-primary"
                onClick={() => pedirRepeticion(pedido)}
                disabled={repitiendoId === pedido.id}
              >
                <FaRedo className="me-1" aria-hidden="true" />
                {repitiendoId === pedido.id ? "Agregando…" : "Repetir pedido"}
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <ConfirmarModal
        mostrar={Boolean(pedidoARepetir)}
        titulo="Repetir pedido"
        mensaje={mensajeConfirmarRepetir(
          pedidoARepetir,
          vistaPrevia,
          formatPrice,
        )}
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

      <ResenaModal
        mostrar={Boolean(productoAResenar)}
        producto={productoAResenar}
        resena={productoAResenar?.resena || null}
        onGuardada={alGuardarResena}
        onCerrar={() => setProductoAResenar(null)}
      />

      <QuejaModal
        mostrar={mostrarQuejaModal}
        pedido={pedido}
        onGuardada={alGuardarQueja}
        onCerrar={() => setMostrarQuejaModal(false)}
      />

      <ConfirmarModal
        mostrar={mostrarCerrarQueja}
        titulo="Cerrar reclamo"
        mensaje="Si cerrás el reclamo no vas a poder volver a responder. ¿Confirmás que ya está solucionado?"
        textoConfirmar="Sí, cerrar reclamo"
        cargando={cerrandoQueja}
        onConfirmar={confirmarCierreQueja}
        onCancelar={() => setMostrarCerrarQueja(false)}
      />
    </Container>
  );
};

export default DetallePedido;
