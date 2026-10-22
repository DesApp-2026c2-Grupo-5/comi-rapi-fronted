/**
 * Propósito: Badge con la hora estimada de llegada del pedido (A6).
 * Contenido: Badge verde con la hora de llegada. En pantallas chicas muestra
 *            la versión corta ("Llega ~16:21") porque el texto completo no
 *            entra en el header de la tarjeta junto a los otros badges y se
 *            sale de la pantalla (el badge de Bootstrap no corta el texto).
 * Dependencias: utils/llegada.js (textoLlegada / textoLlegadaCorto).
 * Uso: <BadgeLlegada hora={pedido.horaEstimadaLlegada} />
 */

import PropTypes from "prop-types";
import { Badge } from "react-bootstrap";
import { FaShippingFast } from "react-icons/fa";
import { textoLlegada, textoLlegadaCorto } from "../../utils/llegada";

const BadgeLlegada = ({ hora }) => {
  if (!hora) return null;
  const textoCorto = textoLlegadaCorto(hora);
  const textoLargo = textoLlegada(hora);
  if (!textoCorto || !textoLargo) return null;
  return (
    <Badge
      bg="success"
      className="d-inline-flex align-items-center gap-1 text-wrap"
    >
      <FaShippingFast size={11} aria-hidden="true" className="flex-shrink-0" />
      {/* Sólo una de las dos versiones está visible a la vez: la corta en
          mobile, la larga desde md. La oculta (`display: none`) no la lee
          el lector de pantalla. */}
      <span className="d-md-none">{textoCorto}</span>
      <span className="d-none d-md-inline">{textoLargo}</span>
    </Badge>
  );
};

BadgeLlegada.propTypes = {
  hora: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(Date),
  ]),
};

export default BadgeLlegada;
