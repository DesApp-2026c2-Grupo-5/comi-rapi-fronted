import { useState, useMemo } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useCarrito } from '../../hooks/useCarrito';
import { getConfigParaCategoria, LIMITES, calcularPrecioUnitario } from '../../services/personalizacionConfig';
import { formatPrice } from '../../utils/formatters';
import GrupoOpciones from './GrupoOpciones';
import './ProductoPersonalizarModal.css';

const ProductoPersonalizarModal = ({ show, onHide, producto }) => {
  const { agregarAlCarrito } = useCarrito();
  const config = getConfigParaCategoria(producto?.categoria);
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

  const toggleSin = (key) => {
    const actual = sinCant[key] || 0;
    const totalSel = Object.values(sinCant).reduce((a, b) => a + b, 0);
    if (!actual && totalSel >= LIMITES.personalizar) return;
    setSinCant((prev) => ({ ...prev, [key]: actual ? 0 : 1 }));
  };

  const cambiarUnidades = (d) => setUnidades((u) => Math.max(1, Math.min(20, u + d)));

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
      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>{producto.nombre}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <img src={producto.imagen} alt={producto.nombre} className="rounded-4 mb-3" style={{ width: 160, height: 110, objectFit: 'cover' }} />
          <p className="text-muted small">{producto.descripcion}</p>
          <p className="fw-bold" style={{ color: '#e63946' }}>{formatPrice(producto.precio)}</p>
          <div className="d-flex justify-content-center align-items-center gap-2">
            <span className="fw-bold small">Unidades</span>
            <span className="pill-control">
              <button type="button" onClick={() => cambiarUnidades(-1)}>−</button>
              <span>{unidades}</span>
              <button type="button" onClick={() => cambiarUnidades(1)}>+</button>
            </span>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button className="btn-primary" onClick={handleAgregar}>Agregar — {formatPrice(producto.precio * unidades)}</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} centered dialogClassName="modal-personalizar" contentClassName="modal-personalizar-content" fullscreen="sm-down">
      <Modal.Body className="p-0">
        {vista === 'principal' && (
          <div className="personalizar-principal">
            <div className="text-center p-3 position-relative">
              <Button className="btn-cerrar" onClick={handleClose} aria-label="Cerrar">×</Button>
              <img src={producto.imagen} alt={producto.nombre} className="personalizar-imagen" />
            </div>
            <div className="px-3 pb-3">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5 className="fw-bold mb-1">{producto.nombre}</h5>
                  <p className="text-muted small mb-0" style={{ maxWidth: 320 }}>{producto.descripcion}</p>
                </div>
                <div className="text-end ms-2">
                  <div className="fw-bold" style={{ fontSize: '1.1rem' }}>{formatPrice(total)}</div>
                  <div className="text-muted" style={{ fontSize: '.7rem' }}>{unidades > 1 ? `${formatPrice(precioUnitario)} c/u` : 'Precio unitario'}</div>
                </div>
              </div>
            </div>

            <div className="mx-3 mb-3 p-2 card-comi" style={{ borderRadius: 14 }}>
              <div className="fila-grupo">
                <div>
                  <div className="fw-bold small">Extra</div>
                  <div className="badge-grupo" style={{ color: extraCount ? '#198754' : '' }}>
                    {extraCount ? `${extraCount} seleccionados (+${formatPrice(extraCosto * unidades)})` : '—'}
                  </div>
                </div>
                <Button className="btn-seleccionar" onClick={() => setVista('extra')}>Seleccionar</Button>
              </div>
              <div className="fila-grupo">
                <div>
                  <div className="fw-bold small">Personalizar</div>
                  <div className="badge-grupo" style={{ color: sinCount ? '#b55d00' : '' }}>
                    {sinCount ? sinLista.join(', ') : '—'}
                  </div>
                </div>
                <Button className="btn-seleccionar" onClick={() => setVista('personalizar')}>Seleccionar</Button>
              </div>
              <div className="fila-grupo">
                <div>
                  <div className="fw-bold small">Acompaña tu orden con</div>
                  <div className="badge-grupo" style={{ color: acompCount ? '#198754' : '' }}>
                    {acompCount ? `${acompCount} seleccionados (+${formatPrice(acompCosto * unidades)})` : '—'}
                  </div>
                </div>
                <Button className="btn-seleccionar" onClick={() => setVista('acompanar')}>Seleccionar</Button>
              </div>
              <div className="fila-grupo border-0">
                <div>
                  <div className="fw-bold small">Condimentos adicionales</div>
                  <div className="badge-grupo">
                    {condCount ? Object.entries(condCant).filter(([,v])=>v).map(([k,v])=> `${k} x${v}`).join(', ') : '—'}
                  </div>
                </div>
                <Button className="btn-seleccionar" onClick={() => setVista('condimentos')}>Seleccionar</Button>
              </div>
            </div>

            <div className="mx-3 mb-3 p-3 card-comi d-flex justify-content-between align-items-center" style={{ borderRadius: 14 }}>
              <span className="fw-bold small">Unidades</span>
              <span className="pill-control">
                <button type="button" onClick={() => cambiarUnidades(-1)}>−</button>
                <span>{unidades}</span>
                <button type="button" onClick={() => cambiarUnidades(1)}>+</button>
              </span>
            </div>

            <div className="p-3 pt-0">
              <Button className="btn-primary w-100 py-3 fw-bold d-flex justify-content-between align-items-center" onClick={handleAgregar}>
                <span className="badge bg-white" style={{ color: '#ff9f1c', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{unidades}</span>
                <span>Agregar a mi pedido</span>
                <span className="ms-auto">{formatPrice(total)}</span>
              </Button>
            </div>
          </div>
        )}

        {vista === 'extra' && (
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <Button className="btn-volver" onClick={() => setVista('principal')}>‹</Button>
              <h6 className="fw-bold mb-0 flex-grow-1 text-center">Extra</h6>
              <span style={{ width: 36 }} />
            </div>
            <GrupoOpciones opciones={config.extra} valores={extraCant} onCambiar={(k, d) => cambiar('extra', k, d, LIMITES.extra)} conPrecio limite={LIMITES.extra} />
            <Button className="btn-primary w-100 mt-3 py-3 fw-bold" onClick={() => setVista('principal')}>Aceptar</Button>
          </div>
        )}

        {vista === 'personalizar' && (
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <Button className="btn-volver" onClick={() => setVista('principal')}>‹</Button>
              <h6 className="fw-bold mb-0 flex-grow-1 text-center">Personalizar</h6>
              <span style={{ width: 36 }} />
            </div>
            <p className="fw-bold small">Elige entre 0 y {LIMITES.personalizar} — quitar no descuenta</p>
            <div className="card-comi-grupo">
              {config.personalizar.map((nombre) => (
                <div key={nombre} className="fila-opcion">
                  <span className="small">Sin {nombre}</span>
                  <span className="pill-control">
                    <button type="button" onClick={() => toggleSin(nombre)}>−</button>
                    <span>{sinCant[nombre] || 0}</span>
                    <button type="button" onClick={() => toggleSin(nombre)}>+</button>
                  </span>
                </div>
              ))}
            </div>
            <Button className="btn-primary w-100 mt-3 py-3 fw-bold" onClick={() => setVista('principal')}>Aceptar</Button>
          </div>
        )}

        {vista === 'acompanar' && (
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <Button className="btn-volver" onClick={() => setVista('principal')}>‹</Button>
              <h6 className="fw-bold mb-0 flex-grow-1 text-center">Acompaña tu orden con</h6>
              <span style={{ width: 36 }} />
            </div>
            <GrupoOpciones opciones={config.acompanar} valores={acompCant} onCambiar={(k, d) => cambiar('acompanar', k, d, LIMITES.acompanar)} conPrecio limite={LIMITES.acompanar} />
            <Button className="btn-primary w-100 mt-3 py-3 fw-bold" onClick={() => setVista('principal')}>Aceptar</Button>
          </div>
        )}

        {vista === 'condimentos' && (
          <div className="p-3">
            <div className="d-flex align-items-center mb-3">
              <Button className="btn-volver" onClick={() => setVista('principal')}>‹</Button>
              <h6 className="fw-bold mb-0 flex-grow-1 text-center">Condimentos adicionales</h6>
              <span style={{ width: 36 }} />
            </div>
            <p className="fw-bold small">Elige entre 0 y {LIMITES.condimento} — sin costo</p>
            <div className="card-comi-grupo">
              {config.condimento.map((nombre) => (
                <div key={nombre} className="fila-opcion">
                  <span className="small">{nombre}</span>
                  <span className="pill-control">
                    <button type="button" onClick={() => cambiar('condimento', nombre, -1, LIMITES.condimento)}>−</button>
                    <span>{condCant[nombre] || 0}</span>
                    <button type="button" onClick={() => cambiar('condimento', nombre, 1, LIMITES.condimento)}>+</button>
                  </span>
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
