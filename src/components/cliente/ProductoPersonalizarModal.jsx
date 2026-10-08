import { useState, useMemo } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useCarrito } from '../../hooks/useCarrito';
import { useParametros } from '../../hooks/useParametros';
import { usePersonalizacion } from '../../hooks/usePersonalizacion';
import { LIMITES, calcularPrecioUnitario } from '../../services/personalizacionConfig';
import { formatPrice } from '../../utils/formatters';
import GrupoOpciones from './GrupoOpciones';
import Contador from './Contador';
import './ProductoPersonalizarModal.css';

const ProductoPersonalizarModal = ({ show, onHide, producto }) => {
  const { agregarAlCarrito } = useCarrito();
  const { parametros } = useParametros();
  const { getConfigParaProducto } = usePersonalizacion();
  const config = getConfigParaProducto(producto);
  const [vista, setVista] = useState('principal');
  const [unidades, setUnidades] = useState(1);
  const [extraCant, setExtraCant] = useState({});
  const [sinCant, setSinCant] = useState({});
  const [acompCant, setAcompCant] = useState({});
  const [condCant, setCondCant] = useState({});

  const reset = () => {
    setVista('principal');
    setUnidades(1);
    setExtraCant({});
    setSinCant({});
    setAcompCant({});
    setCondCant({});
  };

  const handleClose = () => {
    reset();
    onHide();
  };

  const cambiar = (grupo, key, delta, limite) => {
    const setters = { extra: setExtraCant, acompanar: setAcompCant, condimento: setCondCant };
    const estados = { extra: extraCant, acompanar: acompCant, condimento: condCant };
    const actual = estados[grupo][key] || 0;
    let nuevo = actual + delta;
    nuevo = Math.max(0, Math.min(limite, nuevo));
    const totalSel = Object.values(estados[grupo]).reduce((a, b) => a + b, 0) - actual + nuevo;
    if (totalSel > limite) return;
    setters[grupo]((prev) => ({ ...prev, [key]: nuevo }));
  };

  /* Respetar el delta que manda el Contador: si se usara un toggle, el botón
     "+" sólo llegaría a 1 aunque el límite permita más, y el "−" no distinguiría
     entre bajar de 2 a 1 y de 1 a 0. */
  const cambiarSin = (key, delta) => {
    const actual = sinCant[key] || 0;
    const nuevo = actual + delta;
    if (nuevo < 0 || nuevo > LIMITES.personalizar) return;
    const totalSel = Object.values(sinCant).reduce((a, b) => a + b, 0);
    if (nuevo > actual && totalSel >= LIMITES.personalizar) return;
    setSinCant((prev) => ({ ...prev, [key]: nuevo }));
  };

  const MAX_UNIDADES = parametros.cantidadMaximaProductoCarrito;

const cambiarUnidades = (d) =>
    setUnidades((u) => Math.max(1, Math.min(MAX_UNIDADES, u + d)));

  const extrasLista = useMemo(
    () =>
      (config.extra || [])
        .filter((op) => (extraCant[op.id] || 0) > 0)
        .map((op) => ({ ...op, cantidad: extraCant[op.id] })),
    [config.extra, extraCant]
  );

  const acompLista = useMemo(
    () =>
      (config.acompanar || [])
        .filter((op) => (acompCant[op.id] || 0) > 0)
        .map((op) => ({ ...op, cantidad: acompCant[op.id] })),
    [config.acompanar, acompCant]
  );

  const condLista = useMemo(
    () =>
      (config.condimento || [])
        .filter((n) => (condCant[n] || 0) > 0)
        .map((n) => ({ nombre: n, cantidad: condCant[n] })),
    [config.condimento, condCant]
  );

  const sinLista = useMemo(() => Object.entries(sinCant).filter(([, v]) => v).map(([k]) => k), [sinCant]);

  const precioUnitario = useMemo(
    () => calcularPrecioUnitario(producto?.precio || 0, extrasLista, acompLista),
    [producto, extrasLista, acompLista]
  );

  const total = precioUnitario * unidades;

  const extraCount = Object.values(extraCant).reduce((a, b) => a + b, 0);
  const extraCosto = extrasLista.reduce((s, e) => s + e.precio * e.cantidad, 0);
  const acompCount = Object.values(acompCant).reduce((a, b) => a + b, 0);
  const acompCosto = acompLista.reduce((s, e) => s + e.precio * e.cantidad, 0);
  const sinCount = sinLista.length;
  const condCount = Object.values(condCant).reduce((a, b) => a + b, 0);

  const handleAgregar = () => {
    const personalizacion = {
      extras: extrasLista,
      sin: sinLista,
      acompanamientos: acompLista,
      condimentos: condLista,
    };
    agregarAlCarrito(producto, unidades, personalizacion);
    handleClose();
  };

  if (!producto) return null;

  const tienePersonalizacion =
    (config.extra?.length || 0) > 0 ||
    (config.personalizar?.length || 0) > 0 ||
    (config.acompanar?.length || 0) > 0 ||
    (config.condimento?.length || 0) > 0;

  if (!tienePersonalizacion) {
    return (
      // `Modal.Title` es lo que le da nombre accesible al diálogo (react-bootstrap
      // lo conecta por aria-labelledby); sin él el Modal queda sin título.
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{producto.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {/* alt vacío: el nombre ya está en el título del diálogo. */}
          <img
            src={producto.imagen}
            alt=""
            width={160}
            height={110}
            className="rounded-4 mb-3 modal-producto-imagen"
          />
          <p className="text-muted small">{producto.descripcion}</p>
          <p className="fw-bold modal-precio">{formatPrice(producto.precio)}</p>
          <div className="d-flex justify-content-center align-items-center gap-2">
            <span className="fw-bold small" id="unidades-label">
              Unidades
            </span>
            <Contador
              etiqueta="una unidad"
              valor={unidades}
              min={1}
              max={MAX_UNIDADES}
              onCambiar={cambiarUnidades}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button className="btn-primary" onClick={handleAgregar}>
            Agregar — {formatPrice(producto.precio * unidades)}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      dialogClassName="modal-personalizar"
      contentClassName="modal-personalizar-content"
      fullscreen="sm-down"
      // Esta variante no usa Modal.Header/Title, así que el nombre accesible
      // se declara a mano apuntando al <h2> del producto.
      aria-labelledby="personalizar-titulo"
    >
      <Modal.Body className="p-0">
        {vista === 'principal' && (
          <div className="personalizar-principal">
            <div className="text-center p-3 position-relative">
              <Button className="btn-cerrar" onClick={handleClose} aria-label="Cerrar">
                <span aria-hidden="true">×</span>
              </Button>
              {/* alt vacío: el nombre del producto está en el h2 de abajo. */}
              <img src={producto.imagen} alt="" width={220} height={150} className="personalizar-imagen" />
            </div>
            <div className="px-3 pb-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h2 id="personalizar-titulo" className="h5 fw-bold mb-1">
                    {producto.nombre}
                  </h2>
                  <p className="text-muted small mb-0 personalizar-descripcion">
                    {producto.descripcion}
                  </p>
                </div>
                <div className="text-end ms-2">
                  {/* `aria-live`: el total cambia con cada customization y hay que
                      anunciarlo, no alcanza con que cambie el color. */}
                  <div className="fw-bold personalize-total" role="status" aria-live="polite">
                    {formatPrice(total)}
                  </div>
                  <div className="text-muted personalize-total-unitario">
                    {unidades > 1 ? `${formatPrice(precioUnitario)} c/u` : 'Precio unitario'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-3 mb-3 p-2 card-comi personalize-grupos">
              <div className="fila-grupo">
                <div>
                  <div className="fw-bold small">Extra</div>
                  <div className={`badge-grupo ${extraCount ? 'badge-grupo-activo' : ''}`}>
                    {extraCount ? `${extraCount} seleccionados (+${formatPrice(extraCosto * unidades)})` : '—'}
                  </div>
                </div>
                <Button className="btn-seleccionar" onClick={() => setVista('extra')}>Seleccionar</Button>
              </div>
              <div className="fila-grupo">
                <div>
                  <div className="fw-bold small">Personalizar</div>
                  <div className={`badge-grupo ${sinCount ? 'badge-grupo-ambar' : ''}`}>
                    {sinCount ? sinLista.join(', ') : '—'}
                  </div>
                </div>
                <Button className="btn-seleccionar" onClick={() => setVista('personalizar')}>Seleccionar</Button>
              </div>
              <div className="fila-grupo">
                <div>
                  <div className="fw-bold small">Acompaña tu orden con</div>
                  <div className={`badge-grupo ${acompCount ? 'badge-grupo-activo' : ''}`}>
                    {acompCount ? `${acompCount} seleccionados (+${formatPrice(acompCosto * unidades)})` : '—'}
                  </div>
                </div>
                <Button className="btn-seleccionar" onClick={() => setVista('acompanar')}>Seleccionar</Button>
              </div>
              <div className="fila-grupo border-0">
                <div>
                  <div className="fw-bold small">Condimentos adicionales</div>
                  <div className="badge-grupo">
                    {condCount
                      ? Object.entries(condCant)
                          .filter(([, v]) => v)
                          .map(([k, v]) => `${k} x${v}`)
                          .join(', ')
                      : '—'}
                  </div>
                </div>
                <Button className="btn-seleccionar" onClick={() => setVista('condimentos')}>Seleccionar</Button>
              </div>
            </div>

            <div className="mx-3 mb-3 p-3 card-comi d-flex justify-content-between align-items-center personalizar-unidades">
              <span className="fw-bold small">Unidades</span>
              <Contador
                etiqueta="una unidad"
                valor={unidades}
                min={1}
                max={MAX_UNIDADES}
                onCambiar={cambiarUnidades}
              />
            </div>

            <div className="p-3 pt-0">
              <Button
                className="btn-primary w-100 py-3 fw-bold d-flex justify-content-between align-items-center btn-agregar"
                onClick={handleAgregar}
              >
                <span className="badge bg-white btn-agregar-cantidad">{unidades}</span>
                <span>Agregar a mi pedido</span>
                <span className="ms-auto">{formatPrice(total)}</span>
              </Button>
            </div>
          </div>
        )}

        {vista === 'extra' && (
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <Button className="btn-volver" onClick={() => setVista('principal')} aria-label="Volver a la selección">
                <span aria-hidden="true">‹</span>
              </Button>
              <h3 className="h6 fw-bold mb-0 flex-grow-1 text-center">Extra</h3>
              {/* Espaciador para que el título quede centrado respecto al botón. */}
              <span className="espaciador-volver" />
            </div>
            <GrupoOpciones opciones={config.extra} valores={extraCant} onCambiar={(k, d) => cambiar('extra', k, d, LIMITES.extra)} conPrecio limite={LIMITES.extra} />
            <Button className="btn-primary w-100 mt-3 py-3 fw-bold" onClick={() => setVista('principal')}>Aceptar</Button>
          </div>
        )}

        {vista === 'personalizar' && (
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <Button className="btn-volver" onClick={() => setVista('principal')} aria-label="Volver a la selección">
                <span aria-hidden="true">‹</span>
              </Button>
              <h3 className="h6 fw-bold mb-0 flex-grow-1 text-center">Personalizar</h3>
              <span className="espaciador-volver" />
            </div>
            <p className="fw-bold small">
              Elige entre 0 y {LIMITES.personalizar} ingredientes para quitar; quitar no descuenta.
            </p>
            <div className="card-comi-grupo">
              {config.personalizar.map((nombre) => (
                <div key={nombre} className="fila-opcion">
                  <span className="small">Sin {nombre}</span>
                  <Contador
                    etiqueta={`el ingrediente ${nombre}`}
                    valor={sinCant[nombre] || 0}
                    min={0}
                    max={LIMITES.personalizar}
                    onCambiar={(delta) => cambiarSin(nombre, delta)}
                  />
                </div>
              ))}
            </div>
            <Button className="btn-primary w-100 mt-3 py-3 fw-bold" onClick={() => setVista('principal')}>Aceptar</Button>
          </div>
        )}

        {vista === 'acompanar' && (
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <Button className="btn-volver" onClick={() => setVista('principal')} aria-label="Volver a la selección">
                <span aria-hidden="true">‹</span>
              </Button>
              <h3 className="h6 fw-bold mb-0 flex-grow-1 text-center">Acompaña tu orden con</h3>
              <span className="espaciador-volver" />
            </div>
            <GrupoOpciones opciones={config.acompanar} valores={acompCant} onCambiar={(k, d) => cambiar('acompanar', k, d, LIMITES.acompanar)} conPrecio limite={LIMITES.acompanar} />
            <Button className="btn-primary w-100 mt-3 py-3 fw-bold" onClick={() => setVista('principal')}>Aceptar</Button>
          </div>
        )}

        {vista === 'condimentos' && (
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <Button className="btn-volver" onClick={() => setVista('principal')} aria-label="Volver a la selección">
                <span aria-hidden="true">‹</span>
              </Button>
              <h3 className="h6 fw-bold mb-0 flex-grow-1 text-center">Condimentos adicionales</h3>
              <span className="espaciador-volver" />
            </div>
            <p className="fw-bold small">
              Elige entre 0 y {LIMITES.condimento}; sin costo.
            </p>
            <div className="card-comi-grupo">
              {config.condimento.map((nombre) => (
                <div key={nombre} className="fila-opcion">
                  <span className="small">{nombre}</span>
                  <Contador
                    etiqueta={nombre}
                    valor={condCant[nombre] || 0}
                    min={0}
                    max={LIMITES.condimento}
                    onCambiar={(d) => cambiar('condimento', nombre, d, LIMITES.condimento)}
                  />
                </div>
              ))}
            </div>
            <Button className="btn-primary w-100 mt-3 py-3 fw-bold" onClick={() => setVista('principal')}>Aceptar</Button>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ProductoPersonalizarModal;
