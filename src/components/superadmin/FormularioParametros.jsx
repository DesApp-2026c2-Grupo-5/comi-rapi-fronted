/**
 * Propósito: Formulario del superadministrador para editar los parámetros de
 *            negocio (envío, cobertura, carrito, pedidos y promociones).
 * Contenido: Componente FormularioParametros que agrupa el catálogo por `grupo`,
 *            permite editar cada valor y guarda el lote completo con
 *            useParametros().actualizar (PUT /superadmin/parametros).
 * Dependencias: react-bootstrap (Card, Form, Button, Spinner, Alert, Row, Col,
 *               Badge), react-icons (FaSave, FaUndoAlt), useParametros,
 *               useNotificaciones.
 * Uso: <FormularioParametros />
 *
 * El backend es la autoridad: acá solo se valida en espejo (tipo/rango) para
 * avisar sin ida y vuelta. Al guardar se envían todos los valores; el backend
 * valida el lote completo y rechaza todo si alguno es inválido.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Form,
  Button,
  Spinner,
  Alert,
  Row,
  Col,
  Badge,
} from 'react-bootstrap';
import { FaSave, FaUndoAlt } from 'react-icons/fa';
import { useParametros } from '../../hooks/useParametros';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import './FormularioParametros.css';

const TITULOS_GRUPO = {
  envio: 'Envío',
  cobertura: 'Cobertura',
  carrito: 'Carrito',
  pedido: 'Pedidos',
  promociones: 'Promociones',
  catalogo: 'Catálogo',
};

// Orden de aparición de los grupos en el formulario.
const ORDEN_GRUPOS = [
  'envio',
  'cobertura',
  'carrito',
  'pedido',
  'promociones',
  'catalogo',
];

/** Ordena los grupos según ORDEN_GRUPOS y deja los desconocidos al final. */
const ordenDeGrupo = (grupo) => {
  const indice = ORDEN_GRUPOS.indexOf(grupo);
  return indice === -1 ? ORDEN_GRUPOS.length : indice;
};

const FormularioParametros = () => {
  const { lista, loading, actualizar } = useParametros();
  const { notificar } = useNotificaciones();
  const [valores, setValores] = useState({});
  const [guardando, setGuardando] = useState(false);

  // Sincroniza el estado editable cuando llega/actualiza el catálogo.
  useEffect(() => {
    if (lista.length === 0) return;
    setValores(
      lista.reduce((acc, parametro) => {
        acc[parametro.clave] = String(parametro.valor);
        return acc;
      }, {})
    );
  }, [lista]);

  const grupos = useMemo(() => {
    const porGrupo = new Map();
    for (const parametro of lista) {
      const grupo = parametro.grupo || 'otros';
      if (!porGrupo.has(grupo)) porGrupo.set(grupo, []);
      porGrupo.get(grupo).push(parametro);
    }
    return [...porGrupo.entries()]
      .map(([grupo, parametros]) => ({
        grupo,
        titulo: TITULOS_GRUPO[grupo] || grupo,
        parametros,
      }))
      .sort((a, b) => ordenDeGrupo(a.grupo) - ordenDeGrupo(b.grupo));
  }, [lista]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación en espejo del backend, para avisar sin ida y vuelta.
    for (const parametro of lista) {
      const crudo = valores[parametro.clave];
      const numero = Number(crudo);
      if (crudo === '' || crudo === undefined || Number.isNaN(numero)) {
        notificar(
          `El valor de "${parametro.clave}" tiene que ser numérico.`,
          'warning'
        );
        return;
      }
      if (parametro.tipo === 'entero' && !Number.isInteger(numero)) {
        notificar(
          `El valor de "${parametro.clave}" tiene que ser un entero.`,
          'warning'
        );
        return;
      }
      if (numero < parametro.minimo) {
        notificar(
          `"${parametro.clave}" no puede ser menor a ${parametro.minimo}.`,
          'warning'
        );
        return;
      }
      if (parametro.maximo !== undefined && numero > parametro.maximo) {
        notificar(
          `"${parametro.clave}" no puede ser mayor a ${parametro.maximo}.`,
          'warning'
        );
        return;
      }
    }

    const cambios = Object.fromEntries(
      lista.map((parametro) => [parametro.clave, Number(valores[parametro.clave])])
    );

    setGuardando(true);
    const result = await actualizar(cambios);
    setGuardando(false);

    if (result.success) {
      notificar('Parámetros guardados.', 'success');
    } else {
      notificar(
        result.error || 'No se pudieron guardar los parámetros.',
        'danger'
      );
    }
  };

  if (loading && lista.length === 0) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  if (lista.length === 0) {
    return (
      <Alert variant="warning" role="alert">
        No se pudieron cargar los parámetros.
      </Alert>
    );
  }

  return (
    <Form onSubmit={handleSubmit} noValidate>
      {grupos.map((grupo) => (
        <Card key={grupo.grupo} className="shadow-sm parametros-card mb-4">
          <Card.Body>
            <Card.Title as="h5" className="parametros-grupo-titulo mb-3">
              {grupo.titulo}
            </Card.Title>
            {grupo.parametros.map((parametro) => (
              <Form.Group
                key={parametro.clave}
                className="mb-4"
                controlId={`parametro-${parametro.clave}`}
              >
                <Form.Label className="mb-1">
                  {parametro.descripcion}
                  {parametro.unidad ? (
                    <Badge bg="secondary" className="ms-2 parametros-unidad">
                      {parametro.unidad}
                    </Badge>
                  ) : null}
                </Form.Label>
                <Row className="g-2 align-items-center">
                  <Col className="flex-grow-1">
                    <Form.Control
                      type="number"
                      name={parametro.clave}
                      min={parametro.minimo}
                      max={parametro.maximo}
                      step={parametro.tipo === 'entero' ? 1 : 'any'}
                      inputMode={
                        parametro.tipo === 'entero' ? 'numeric' : 'decimal'
                      }
                      value={valores[parametro.clave] ?? ''}
                      onChange={(e) =>
                        setValores((prev) => ({
                          ...prev,
                          [parametro.clave]: e.target.value,
                        }))
                      }
                    />
                  </Col>
                  <Col xs="auto">
                    <Button
                      type="button"
                      variant="outline-secondary"
                      title={`Volver al valor por defecto (${parametro.valorPorDefecto})`}
                      onClick={() =>
                        setValores((prev) => ({
                          ...prev,
                          [parametro.clave]: String(parametro.valorPorDefecto),
                        }))
                      }
                    >
                      <FaUndoAlt aria-hidden="true" />
                      <span className="visually-hidden">
                        Restablecer {parametro.clave}
                      </span>
                    </Button>
                  </Col>
                </Row>
                <Form.Text className="text-muted">
                  Clave: {parametro.clave} · por defecto {parametro.valorPorDefecto}
                </Form.Text>
              </Form.Group>
            ))}
          </Card.Body>
        </Card>
      ))}
      <Button variant="primary" type="submit" disabled={guardando}>
        <FaSave className="me-1" aria-hidden="true" />
        {guardando ? 'Guardando…' : 'Guardar parámetros'}
      </Button>
    </Form>
  );
};

export default FormularioParametros;