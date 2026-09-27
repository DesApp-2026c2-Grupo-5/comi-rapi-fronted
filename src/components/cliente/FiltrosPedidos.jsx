/**
 * Propósito: Barra de filtros compartida (fecha, estado, sucursal) para
 * Mis Pedidos e Historial. Controlada: recibe filtros + onChange.
 */

import { Row, Col, Form, Button } from 'react-bootstrap';

const FiltrosPedidos = ({ filtros, onChange, estados, sucursales }) => {
  const set = (clave, valor) => onChange({ ...filtros, [clave]: valor });
  const limpiar = () => onChange({ desde: '', hasta: '', estado: '', sucursalId: '' });

  return (
    <div className="mb-3 p-3 border rounded bg-light">
      <Row className="g-2 align-items-end">
        <Col xs={6} md={3}>
          <Form.Label className="small mb-1">Desde</Form.Label>
          <Form.Control
            type="date"
            size="sm"
            value={filtros.desde || ''}
            onChange={(e) => set('desde', e.target.value)}
          />
        </Col>
        <Col xs={6} md={3}>
          <Form.Label className="small mb-1">Hasta</Form.Label>
          <Form.Control
            type="date"
            size="sm"
            value={filtros.hasta || ''}
            onChange={(e) => set('hasta', e.target.value)}
            min={filtros.desde || undefined}
          />
        </Col>
        <Col xs={6} md={3}>
          <Form.Label className="small mb-1">Estado</Form.Label>
          <Form.Select
            size="sm"
            value={filtros.estado || ''}
            onChange={(e) => set('estado', e.target.value)}
          >
            <option value="">Todos</option>
            {(estados || []).map((est) => (
              <option key={est.valor} value={est.valor}>
                {est.etiqueta}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={6} md={2}>
          <Form.Label className="small mb-1">Sucursal</Form.Label>
          <Form.Select
            size="sm"
            value={filtros.sucursalId || ''}
            onChange={(e) => set('sucursalId', e.target.value)}
          >
            <option value="">Todas</option>
            {(sucursales || []).map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.nombre}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col xs={12} md={1}>
          <Button variant="outline-secondary" size="sm" className="w-100" onClick={limpiar}>
            Limpiar
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default FiltrosPedidos;
