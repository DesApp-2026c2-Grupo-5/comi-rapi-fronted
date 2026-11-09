/**
 * Propósito: Lista reutilizable de tarjetas de pedido (Mis Pedidos / Historial).
 * Extraída de MisPedidos: mismo visual, stepper y acciones.
 * Las tarjetas entregadas muestran, por producto, "Calificar" o "Editar" y
 * abren el modal de reseña en la misma pantalla (sin pasar por el detalle).
 * Props: pedidos ya filtrados, user, cancelandoId, repitiendoId,
 * pedirCancelacion?, pedirRepeticion, mostrarCancelar (default true).
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Card, Badge, Button } from "react-bootstrap";
import {
  FaEye,
  FaTimesCircle,
  FaRedo,
  FaClock,
  FaStar,
  FaPen,
} from "react-icons/fa";
import {
  ESTADOS_PEDIDO,
  ETIQUETAS_ESTADO_PEDIDO,
  VARIANTE_ESTADO_PEDIDO,
} from "../../utils/constants";
import { formatPrice, formatDate } from "../../utils/formatters";
import { calcularCostoEnvio } from "../../services/envio";
import {
  obtenerMisResenas,
  obtenerProductosElegiblesParaResenar,
} from "../../api/resenas";
import BadgeLlegada from "./BadgeLlegada";
import IconoEstado from "../comunes/IconoEstado";
import HistorialStepper from "../comunes/HistorialStepper";
import MiniaturasPedido from "./MiniaturasPedido";
import ResenaModal from "./ResenaModal";
import "./ListaPedidos.css";

const ListaPedidos = ({
  pedidos,
  user,
  cancelandoId,
  repitiendoId,
  pedirCancelacion,
  pedirRepeticion,
  mostrarCancelar = true,
}) => {
  // Reseñas: se cargan solo si hay alguna tarjeta entregada. `elegibles` son
  // los productos comprados y todavía sin reseñar; `misResenas` permite
  // ofrecer "Editar" en los que ya tienen una.
  const [elegibles, setElegibles] = useState([]);
  const [misResenas, setMisResenas] = useState([]);
  const [productoAResenar, setProductoAResenar] = useState(null);
  const hayEntregado = pedidos.some(
    (pedido) => pedido.estado === ESTADOS_PEDIDO.ENTREGADO,
  );

  const cargarResenas = useCallback(async () => {
    const [resElegibles, resMias] = await Promise.all([
      obtenerProductosElegiblesParaResenar(),
      obtenerMisResenas(),
    ]);
    if (resElegibles.success) setElegibles(resElegibles.data);
    if (resMias.success) setMisResenas(resMias.data);
  }, []);

  useEffect(() => {
    if (!hayEntregado) {
      setElegibles([]);
      setMisResenas([]);
      return;
    }
    cargarResenas();
  }, [hayEntregado, cargarResenas]);

  const miResenaDe = (productoId) =>
    productoId
      ? misResenas.find((r) => String(r.productoId) === String(productoId))
      : undefined;

  const esElegible = (productoId) =>
    elegibles.some((p) => String(p.productoId) === String(productoId));

  const alGuardarResena = async () => {
    setProductoAResenar(null);
    await cargarResenas();
  };

  return (
  <>
    {pedidos.map((pedido) => {
      const estadoLabel =
        ETIQUETAS_ESTADO_PEDIDO[pedido.estado] || pedido.estado;
      const costoEnvio = pedido.costoEnvio ?? calcularCostoEnvio(pedido.total);
      const subtotal = pedido.total - costoEnvio;
      const esFinal =
        pedido.estado === ESTADOS_PEDIDO.ENTREGADO ||
        pedido.estado === ESTADOS_PEDIDO.CANCELADO;
      const esEntregado = pedido.estado === ESTADOS_PEDIDO.ENTREGADO;
      const esCancelado = pedido.estado === ESTADOS_PEDIDO.CANCELADO;
      const registroCancelacion = (pedido.historialEstados || []).find(
        (h) => h.estado === ESTADOS_PEDIDO.CANCELADO,
      );
      const esCancelacionPropia =
        Boolean(registroCancelacion?.usuarioId) &&
        registroCancelacion.usuarioId === user?.id;
      const fechaCancelacion = registroCancelacion
        ? formatDate(registroCancelacion.fecha)
        : null;
      return (
        <Card key={pedido.id} className="mb-3 shadow-sm">
          {/* El header lleva título + badges. En móvil (< sm) los badges van
              debajo del "Pedido #X" para que quede uniforme entre todas las
              tarjetas. En escritorio, el título va a la izquierda y los
              badges se empujan al extremo derecho. */}
          <Card.Header className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-start gap-2 gap-sm-4">
            <strong>Pedido #{pedido.id}</strong>
            <div className="d-flex align-items-center gap-2 flex-wrap ms-sm-auto">
              {!esFinal &&
                pedido.etaMinutos !== null &&
                pedido.etaMinutos !== undefined && (
                  <Badge bg="info">
                    <FaClock className="me-1" aria-hidden="true" size={11} />~
                    {pedido.etaMinutos} min
                  </Badge>
                )}
              {/* A6: badge de llegada solo en en_camino (hora fija,
                  sin countdown — el texto completo está en el detalle). */}
              {pedido.estado === ESTADOS_PEDIDO.EN_CAMINO &&
                pedido.horaEstimadaLlegada && (
                  <BadgeLlegada hora={pedido.horaEstimadaLlegada} />
                )}
              {/* T4: badge de reasignación de sucursal */}
              {(pedido.historialEstados || []).some(
                (h) => h.observacion && /reasignado/i.test(h.observacion),
              ) && (
                <Badge bg="warning" className="text-dark">
                  Reasignado
                </Badge>
              )}
              <Badge
                bg={VARIANTE_ESTADO_PEDIDO[pedido.estado] || "secondary"}
                className="d-inline-flex align-items-center gap-1"
              >
                <IconoEstado estado={pedido.estado} size={15} />
                {estadoLabel}
              </Badge>
            </div>
          </Card.Header>
          <Card.Body>
            <p className="mb-1">
              <strong>Fecha:</strong> {formatDate(pedido.fecha)}
            </p>
            <div className="pedido-productos mb-1">
              <MiniaturasPedido productos={pedido.productos} />
              <div className="pedido-productos-detalle">
                <strong>Productos:</strong>
                {pedido.productos.map((p, i) => {
                  const resena = miResenaDe(p.productoId);
                  const puedeCalificar =
                    esEntregado &&
                    p.productoId &&
                    !resena &&
                    esElegible(p.productoId);
                  return (
                    <div
                      key={i}
                      className="ms-2 small d-flex flex-wrap justify-content-between align-items-start gap-1"
                    >
                      <div>
                        <span>
                          {p.nombre} x{p.cantidad}
                        </span>
                        {p.extras?.length > 0 && (
                          <span className="text-muted">
                            {" "}
                            —{" "}
                            {p.extras
                              .map((e) => `${e.nombre} (+${formatPrice(e.precio)})`)
                              .join(", ")}
                          </span>
                        )}
                        {p.sin?.length > 0 && (
                          <span className="text-muted">
                            {" "}
                            — Sin {p.sin.join(", ")}
                          </span>
                        )}
                        {p.acompanamientos?.length > 0 && (
                          <span className="text-muted">
                            {" "}
                            — {p.acompanamientos.map((a) => a.nombre).join(", ")}
                          </span>
                        )}
                        {p.condimentos?.length > 0 && (
                          <span className="text-muted">
                            {" "}
                            — {p.condimentos.map((c) => c.nombre).join(", ")}
                          </span>
                        )}
                      </div>
                      {(resena || puedeCalificar) && (
                        <Button
                          variant={resena ? "outline-secondary" : "outline-primary"}
                          size="sm"
                          className="flex-shrink-0"
                          onClick={() =>
                            setProductoAResenar({
                              id: p.productoId,
                              nombre: p.nombre,
                              resena: resena || null,
                            })
                          }
                          aria-label={`${resena ? "Editar la reseña de" : "Calificar"} ${p.nombre}`}
                        >
                          {resena ? (
                            <FaPen aria-hidden="true" />
                          ) : (
                            <FaStar aria-hidden="true" />
                          )}
                          <span className="ms-1">
                            {resena ? "Editar" : "Calificar"}
                          </span>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mb-1">
              <strong>Subtotal:</strong> {formatPrice(subtotal)}
            </p>
            <p className="mb-1">
              <strong>Envío:</strong>{" "}
              {costoEnvio === 0 ? (
                <span className="text-success">Gratis</span>
              ) : (
                formatPrice(costoEnvio)
              )}
            </p>
            <p className="mb-2">
              <strong>Total:</strong> {formatPrice(pedido.total)}
            </p>
            {(pedido.promociones || []).length > 0 && (
              <p className="mb-2 small">
                <strong>Descuento:</strong>{" "}
                <span className="text-success">
                  −
                  {formatPrice(
                    (pedido.promociones || []).reduce(
                      (acc, promo) =>
                        acc + Number(promo.descuentoAplicado ?? 0),
                      0,
                    ),
                  )}
                </span>{" "}
                <span className="text-muted">
                  (
                  {(pedido.promociones || [])
                    .map((promo) => promo.nombre || `#${promo.promocionId}`)
                    .join(" · ")}
                  )
                </span>
              </p>
            )}
            <p className="mb-2">
              <strong>Sucursal:</strong>{" "}
              {pedido.sucursal?.nombre || pedido.sucursal || "-"}
            </p>

            <div className="historial-box">
              <span className="historial-titulo">Progreso del pedido</span>
              <HistorialStepper pedido={pedido} sinNodoCancelado />
              {esCancelado && (
                <div className="d-flex align-items-start gap-2 mt-3 panel-crema p-2">
                  <FaTimesCircle
                    className="text-danger flex-shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="text-danger">
                      {esCancelacionPropia
                        ? "Cancelaste este pedido."
                        : "Tu pedido ha sido cancelado."}
                    </strong>
                    {fechaCancelacion && (
                      <span className="small text-muted d-block">
                        Cancelado el {fechaCancelacion}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="d-flex gap-2 mt-2 flex-wrap">
              <Button
                as={Link}
                to={`/cliente/pedido/${pedido.id}`}
                variant="outline-secondary"
                size="sm"
              >
                <FaEye aria-hidden="true" />
                Ver detalle
              </Button>
              {mostrarCancelar && !esFinal && pedirCancelacion && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => pedirCancelacion(pedido)}
                  disabled={cancelandoId === pedido.id}
                >
                  <FaTimesCircle aria-hidden="true" />
                  {cancelandoId === pedido.id ? "Cancelando…" : "Cancelar"}
                </Button>
              )}
              {esFinal && pedirRepeticion && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => pedirRepeticion(pedido)}
                  disabled={repitiendoId === pedido.id}
                >
                  <FaRedo aria-hidden="true" />
                  {repitiendoId === pedido.id ? "Agregando…" : "Repetir"}
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      );
    })}

    <ResenaModal
      mostrar={Boolean(productoAResenar)}
      producto={productoAResenar}
      resena={productoAResenar?.resena || null}
      onGuardada={alGuardarResena}
      onCerrar={() => setProductoAResenar(null)}
    />
  </>
  );
};

ListaPedidos.propTypes = {
  pedidos: PropTypes.arrayOf(PropTypes.object).isRequired,
  user: PropTypes.shape({ id: PropTypes.number }),
  cancelandoId: PropTypes.number,
  repitiendoId: PropTypes.number,
  pedirCancelacion: PropTypes.func,
  pedirRepeticion: PropTypes.func,
  mostrarCancelar: PropTypes.bool,
};

export default ListaPedidos;
