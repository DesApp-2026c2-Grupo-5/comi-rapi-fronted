/**
 * Propósito: Tabla de elementos de personalización (por producto o plantilla
 *            por categoría) con edición en línea de mínimo/máximo.
 * Contenido: CeldaCantidadInline y TablaPersonalizacion.
 * Dependencias: react-bootstrap, react-icons, formatters.
 * Uso: <TablaPersonalizacion elementos={...} productos={...} onEditar={...} />
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Table, Button, Badge, Form } from 'react-bootstrap';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { formatPrice } from '../../utils/formatters';

/**
 * Celda de cantidad editable en línea (mínimo o máximo).
 *
 * Muestra un input numérico que persiste al perder el foco o al presionar
 * Enter, y revierte con Escape. La validación de rango y el guardado real los
 * maneja el padre vía `onGuardar`, que resuelve `true` si el cambio se guardó.
 */
export const CeldaCantidadInline = ({
  valor,
  min,
  etiqueta,
  onGuardar,
  disabled,
}) => {
  const [texto, setTexto] = useState(String(valor ?? ''));
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setTexto(String(valor ?? ''));
  }, [valor]);

  const confirmar = async () => {
    if (disabled || guardando) return;
    const limpio = texto.trim();
    if (limpio === String(valor ?? '')) return;
    const numero = Number(limpio);
    if (!Number.isInteger(numero) || numero < min) {
      setTexto(String(valor ?? ''));
      return;
    }
    setGuardando(true);
    const ok = await onGuardar(numero);
    setGuardando(false);
    if (!ok) setTexto(String(valor ?? ''));
  };

  const manejarTecla = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setTexto(String(valor ?? ''));
      e.currentTarget.blur();
    }
  };

  return (
    <Form.Control
      type="number"
      size="sm"
      className="text-center mx-auto"
      style={{ maxWidth: 80 }}
      value={texto}
      min={min}
      step="1"
      inputMode="numeric"
      disabled={disabled || guardando}
      aria-label={etiqueta}
      title="Editable: cambiá el valor y presioná Enter o salí del campo"
      onChange={(e) => setTexto(e.target.value)}
      onBlur={confirmar}
      onKeyDown={manejarTecla}
    />
  );
};

CeldaCantidadInline.propTypes = {
  valor: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  min: PropTypes.number,
  etiqueta: PropTypes.string,
  onGuardar: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

const etiquetaDe = (el) => (el.tipo === 'acompanar' ? `→ ${el.nombre}` : el.nombre);

const TablaPersonalizacion = ({
  elementos,
  productos = [],
  soloLectura = false,
  mensajeVacio = 'No hay elementos para esta selección.',
  onEditar,
  onEliminar,
  onGuardarCantidad,
}) => (
  <>
    <Table striped bordered hover responsive className="shadow-sm">
      <thead className="table-dark">
        <tr>
          <th style={{ width: 70 }}>ID</th>
          <th>Nombre / Producto</th>
          <th style={{ width: 130 }}>Tipo</th>
          <th style={{ width: 120 }}>Precio</th>
          <th style={{ width: 80 }} className="text-center">
            Mínimo
          </th>
          <th style={{ width: 80 }} className="text-center">
            Máximo
          </th>
          <th style={{ width: 100 }}>Estado</th>
          {!soloLectura && <th style={{ width: 180 }}>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {elementos.length === 0 && (
          <tr>
            <td colSpan={soloLectura ? 7 : 8} className="text-center">
              {mensajeVacio}
            </td>
          </tr>
        )}
        {elementos.map((el) => {
          const refProd = el.productoReferenciaId
            ? productos.find(
                (p) => String(p.id) === String(el.productoReferenciaId)
              )
            : null;
          return (
            <tr key={el.id}>
              <td>#{el.id}</td>
              <td>
                {el.tipo === 'acompanar' ? (
                  refProd ? (
                    <>
                      → <strong>{refProd.nombre}</strong>{' '}
                      <Badge bg="light" text="dark" className="border">
                        {refProd.categoria}
                      </Badge>
                    </>
                  ) : el.productoReferenciaId ? (
                    <span className="text-danger">
                      Producto eliminado (id:{el.productoReferenciaId})
                    </span>
                  ) : (
                    <span className="text-muted">Sin producto asociado</span>
                  )
                ) : el.tipo === 'personalizar' ? (
                  <>
                    Sin <strong>{el.nombre}</strong>{' '}
                    <span className="text-muted" style={{ fontSize: '.78rem' }}>
                      (no descuenta)
                    </span>
                  </>
                ) : el.tipo === 'condimento' ? (
                  <>
                    {el.nombre}{' '}
                    <span className="text-muted" style={{ fontSize: '.78rem' }}>
                      (sin costo)
                    </span>
                  </>
                ) : (
                  <>
                    Extra: <strong>{el.nombre}</strong>
                  </>
                )}
              </td>
              <td>
                <Badge
                  bg={
                    el.tipo === 'extra'
                      ? 'warning'
                      : el.tipo === 'acompanar'
                        ? 'success'
                        : el.tipo === 'personalizar'
                          ? 'secondary'
                          : 'light'
                  }
                  text={
                    el.tipo === 'extra' || el.tipo === 'condimento'
                      ? 'dark'
                      : undefined
                  }
                  className={el.tipo === 'condimento' ? 'border' : ''}
                >
                  {el.tipo === 'extra'
                    ? 'Extra'
                    : el.tipo === 'personalizar'
                      ? 'Personalizar'
                      : el.tipo === 'acompanar'
                        ? 'Acompaña'
                        : 'Condimento'}
                </Badge>
              </td>
              <td
                className={
                  el.tipo === 'extra' || el.tipo === 'acompanar'
                    ? 'fw-bold'
                    : 'text-muted'
                }
                style={
                  el.tipo === 'extra' || el.tipo === 'acompanar'
                    ? { color: '#e63946' }
                    : {}
                }
              >
                {el.tipo === 'extra' || el.tipo === 'acompanar'
                  ? formatPrice(el.precio)
                  : '—'}
              </td>
              <td className="text-center">
                {soloLectura ? (
                  el.minimo ?? 0
                ) : (
                  <CeldaCantidadInline
                    valor={el.minimo ?? 0}
                    min={0}
                    etiqueta={`Mínimo de ${etiquetaDe(el)}`}
                    onGuardar={(v) => onGuardarCantidad(el, 'minimo', v)}
                  />
                )}
              </td>
              <td className="text-center">
                {soloLectura ? (
                  el.maximo ?? 1
                ) : (
                  <CeldaCantidadInline
                    valor={el.maximo ?? 1}
                    min={1}
                    etiqueta={`Máximo de ${etiquetaDe(el)}`}
                    onGuardar={(v) => onGuardarCantidad(el, 'maximo', v)}
                  />
                )}
              </td>
              <td>
                <Badge bg={el.activo ? 'success' : 'secondary'}>
                  {el.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </td>
              {!soloLectura && (
                <td className="text-nowrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => onEditar(el.id)}
                  >
                    <FaEdit className="me-1" aria-hidden="true" /> Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onEliminar(el)}
                  >
                    <FaTrashAlt className="me-1" aria-hidden="true" /> Eliminar
                  </Button>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </Table>
    <div className="small text-muted">
      <Badge bg="warning" text="dark">
        Extra
      </Badge>{' '}
      cobra · <Badge bg="secondary">Personalizar</Badge> no cobra ·{' '}
      <Badge bg="success">Acompaña</Badge> cobra (selector de producto) ·{' '}
      <Badge bg="light" text="dark" className="border">
        Condimento
      </Badge>{' '}
      no cobra
    </div>
  </>
);

TablaPersonalizacion.propTypes = {
  elementos: PropTypes.arrayOf(PropTypes.object).isRequired,
  productos: PropTypes.arrayOf(PropTypes.object),
  soloLectura: PropTypes.bool,
  mensajeVacio: PropTypes.string,
  onEditar: PropTypes.func,
  onEliminar: PropTypes.func,
  onGuardarCantidad: PropTypes.func,
};

export default TablaPersonalizacion;
