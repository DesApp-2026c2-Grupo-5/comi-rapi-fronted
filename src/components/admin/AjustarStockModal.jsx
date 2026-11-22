/**
 * Propósito: Ajustar el stock de un ingrediente o insumo de la sucursal.
 * Contenido: Modal con el stock actual, un input de cantidad y dos botones
 *            pegados (+ / −) que aplican la cantidad sobre la vista previa.
 * Dependencias: react-bootstrap (Button, Form, InputGroup, Alert),
 *               components/comunes/ModalFormulario.
 * Uso: <AjustarStockModal mostrar={...} fila={fila} onAceptar={fn} ... />
 *
 * El input siempre es una cantidad positiva. El signo lo define el botón que
 * se toca: + suma y − resta. El modal no guarda nada hasta que se pulsa
 * "Aceptar"; ese botón envía la cantidad resultante absoluta al backend. Si la
 * resta supera el stock, la vista previa baja a 0 y nunca queda negativa.
 */

import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Form, InputGroup } from 'react-bootstrap';
import ModalFormulario from '../comunes/ModalFormulario';

const MAX_DECIMALES = 3;
// Tolerancia para comparar números con hasta 3 decimales sin que el error de
// punto flotante marque cambios que no existen (p. ej. 0.1 + 0.2 === 0.3).
const TOLERANCIA = 1e-9;

const redondear = (valor, decimales) => {
  const factor = 10 ** decimales;
  return Math.round((Number(valor) + Number.EPSILON) * factor) / factor;
};

const formatear = (valor, decimales) => {
  const numero = redondear(valor, decimales);
  return Number.isFinite(numero) ? String(numero) : '0';
};

const AjustarStockModal = ({
  mostrar = false,
  fila = null,
  cargando = false,
  error = '',
  onCerrar,
  onAceptar,
}) => {
  const esInsumo = fila?.clase === 'insumo';
  const decimales = esInsumo ? 0 : MAX_DECIMALES;
  const nombre = esInsumo ? fila?.insumo : fila?.ingrediente;
  const unidad = esInsumo ? '' : fila?.unidadMedida || '';

  // `cantidad` es lo que el admin escribe; `stock` es la vista previa que se
  // actualiza con + / − y recién se persiste al pulsar "Aceptar".
  const [cantidad, setCantidad] = useState('0');
  const [stock, setStock] = useState(0);
  const [stockOriginal, setStockOriginal] = useState(0);
  const inputRef = useRef(null);

  // Cada apertura (o cambio de fila) arranca desde el stock real de la fila.
  useEffect(() => {
    if (!mostrar || !fila) return;
    const actual = Number(fila.cantidad) || 0;
    setCantidad('0');
    setStock(actual);
    setStockOriginal(actual);
  }, [mostrar, fila]);

  const cantidadNum = Number(cantidad);
  const cantidadValida =
    cantidad !== '' &&
    Number.isFinite(cantidadNum) &&
    cantidadNum > 0 &&
    (esInsumo
      ? Number.isInteger(cantidadNum)
      : Math.abs(cantidadNum * 1000 - Math.round(cantidadNum * 1000)) <
        TOLERANCIA);

  const huboCambios =
    Number.isFinite(stock) && Math.abs(stock - stockOriginal) > TOLERANCIA;

  const manejarCambio = (evento) => {
    const valor = evento.target.value;
    if (valor === '') {
      setCantidad('');
      return;
    }
    // Se acepta coma o punto como separador decimal y se normaliza a punto.
    // El patrón bloquea negativos, letras, exponentes y más de 3 decimales.
    const normalizado = valor.replace(',', '.');
    if (!/^\d*(\.\d{0,3})?$/.test(normalizado)) return;
    if (esInsumo && normalizado.includes('.')) return;
    setCantidad(normalizado);
  };

  const aplicar = (signo) => {
    if (!cantidadValida) return;
    setStock((actual) =>
      redondear(Math.max(0, actual + signo * cantidadNum), decimales)
    );
  };

  const enviar = (evento) => {
    evento.preventDefault();
    if (!fila || !huboCambios || cargando) return;
    onAceptar(redondear(stock, decimales));
  };

  const cerrar = () => {
    if (cargando) return;
    onCerrar();
  };

  return (
    <ModalFormulario
      mostrar={Boolean(mostrar && fila)}
      onCerrar={cerrar}
      titulo="Ajustar stock"
      onSubmit={enviar}
      cargando={cargando}
      error={error}
      initialFocusRef={inputRef}
      footer={
        <Button
          type="submit"
          variant="primary"
          disabled={!huboCambios || cargando}
        >
          {cargando ? 'Guardando…' : 'Aceptar'}
        </Button>
      }
    >
      {fila && (
        <>
          <div className="mb-3">
            <div className="text-muted small">Ítem</div>
            <div className="fw-semibold">
              {nombre}
              {unidad ? ` (${unidad})` : ''}
            </div>
          </div>

          <div className="mb-3">
            <div className="text-muted small">Stock actual</div>
            <div className="fs-3 fw-bold" aria-live="polite">
              {formatear(stock, decimales)}
              {unidad ? ` ${unidad}` : ''}
            </div>
            {huboCambios && (
              <div className="text-muted small">
                Original: {formatear(stockOriginal, decimales)}
                {unidad ? ` ${unidad}` : ''}
              </div>
            )}
          </div>

          <Form.Group className="mb-2" controlId="ajuste-stock-cantidad">
            <Form.Label>
              Cantidad a sumar o restar{unidad ? ` (${unidad})` : ''}
            </Form.Label>
            <InputGroup>
              <Form.Control
                ref={inputRef}
                type="text"
                inputMode={esInsumo ? 'numeric' : 'decimal'}
                autoComplete="off"
                value={cantidad}
                onChange={manejarCambio}
                onFocus={(evento) => evento.target.select()}
                aria-describedby="ajuste-stock-ayuda"
                disabled={cargando}
              />
              <Button
                type="button"
                variant="outline-success"
                onClick={() => aplicar(1)}
                disabled={!cantidadValida || cargando}
                aria-label="Sumar la cantidad al stock actual"
              >
                +
              </Button>
              <Button
                type="button"
                variant="outline-danger"
                onClick={() => aplicar(-1)}
                disabled={!cantidadValida || cargando || stock <= 0}
                aria-label="Restar la cantidad al stock actual"
              >
                −
              </Button>
            </InputGroup>
            <Form.Text id="ajuste-stock-ayuda" muted>
              {esInsumo ? 'Sólo números enteros. ' : 'Hasta 3 decimales. '}
              El botón + suma y el botón − resta. Si restás más de lo
              disponible, el stock queda en 0.
            </Form.Text>
          </Form.Group>

          {stock === 0 && stockOriginal > 0 && (
            <Alert variant="warning" className="mb-0 py-2">
              Se descuenta todo el stock disponible: queda en 0.
            </Alert>
          )}
        </>
      )}
    </ModalFormulario>
  );
};

AjustarStockModal.propTypes = {
  mostrar: PropTypes.bool,
  fila: PropTypes.shape({
    clase: PropTypes.string,
    ingredienteId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    insumoId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    ingrediente: PropTypes.string,
    insumo: PropTypes.string,
    unidadMedida: PropTypes.string,
    cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    sucursal: PropTypes.string,
  }),
  cargando: PropTypes.bool,
  error: PropTypes.node,
  onCerrar: PropTypes.func.isRequired,
  onAceptar: PropTypes.func.isRequired,
};

export default AjustarStockModal;
