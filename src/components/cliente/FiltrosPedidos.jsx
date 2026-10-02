/**
 * Propósito: Barra de filtros compartida (fecha, estado, sucursal) para
 * Mis Pedidos e Historial. Controlada: recibe filtros + onChange.
 */

import { useId } from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';

/* El proyecto no usa PropTypes en ningún componente. */
/* eslint-disable react/prop-types */
const FiltrosPedidos = ({ filtros, onChange, estados, sucursales }) => {
  const set = (clave, valor) => onChange({ ...filtros, [clave]: valor });
  const limpiar = () => onChange({ desde: '', hasta: '', estado: '', sucursalId: '' });

  // Los labels existían pero sin `htmlFor`: visualmente parecían correctos, pero
  // no apuntaban a ningún control, así que al tabular el lector de pantalla
  // decía "cuadro de texto" a secas. `useId` garantiza ids únicos por instancia
  // (el componente se usa en varias pantallas).
  const idBase = useId();

  return (
    // `role="group"` + etiqueta: el bloque es un conjunto de filtros, no un
    // grupo de campos cualquiera.
    <div className="mb-3 p-3 border rounded bg-light" role="group" aria-label="Filtros de pedidos">
      <Row className="g-2 align-items-end">
        <Col xs={6} md={3}>
          <Form.Label htmlFor={`${idBase}-desde`} className="small mb-1">Desde</Form.Label>
          <Form.Control
            id={`${idBase}-desde`}
            name="desde"
            type="date"
            size="sm"
            value={filtros.desde || ''}
            onChange={(e) => set('desde', e.target.value)}
          />
        </Col>
        <Col xs={6} md={3}>
          <Form.Label htmlFor={`${idBase}-hasta`} className="small mb-1">Hasta</Form.Label>
          <Form.Control
            id={`${idBase}-hasta`}
            name="hasta"
            type="date"
            size="sm"
            value={filtros.hasta || ''}
            onChange={(e) => set('hasta', e.target.value)}
            min={filtros.desde || undefined}
          />
        </Col>
        <Col xs={6} md={3}>
          <Form.Label htmlFor={`${idBase}-estado`} className="small mb-1">Estado</Form.Label>
          <Form.Select
            id={`${idBase}-estado`}
            name="estado"
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
          <Form.Label htmlFor={`${idBase}-sucursal`} className="small mb-1">Sucursal</Form.Label>
          <Form.Select
            id={`${idBase}-sucursal`}
            name="sucursalId"
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
/* eslint-enable react/prop-types */

export default FiltrosPedidos;
