/**
 * Propósito: Formulario del superadministrador para editar los parámetros de
 *            negocio (envío, cobertura, carrito, pedidos y promociones).
 * Contenido: Componente FormularioParametros que agrupa el catálogo por `grupo`
 *            (con ícono y tarjeta propia), lo muestra en una grilla responsiva
 *            de dos columnas en pantallas grandes, permite editar cada valor y
 *            guarda el lote completo con useParametros().actualizar
 *            (PUT /superadmin/parametros). Paleta y formas: styles/tokens.css.
 * Dependencias: react-bootstrap (Card, Form, Button, Alert, Row, Col,
 *               Badge), react-icons/fa (FaSave, FaUndoAlt e íconos por
 *               grupo), useParametros, useNotificaciones,
 *               components/comunes/Skeleton (SkeletonTarjeta).
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
  Alert,
  Row,
  Col,
  Badge,
} from 'react-bootstrap';
import {
  FaSave,
  FaUndoAlt,
  FaShippingFast,
  FaMapMarkedAlt,
  FaShoppingCart,
  FaClipboardList,
  FaTags,
  FaBookOpen,
  FaBoxes,
} from 'react-icons/fa';
import { useParametros } from '../../hooks/useParametros';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { SkeletonTarjeta } from '../comunes/Skeleton';
import './FormularioParametros.css';

const TITULOS_GRUPO = {
  envio: 'Envío',
  cobertura: 'Cobertura',
  carrito: 'Carrito',
  pedido: 'Pedidos',
  promociones: 'Promociones',
  catalogo: 'Catálogo',
  stock: 'Stock',
};

// Ícono decorativo por grupo (solo presentación).
const ICONOS_GRUPO = {
  envio: FaShippingFast,
  cobertura: FaMapMarkedAlt,
  carrito: FaShoppingCart,
  pedido: FaClipboardList,
  promociones: FaTags,
  catalogo: FaBookOpen,
  stock: FaBoxes,
};

// Orden de aparición de los grupos en el formulario.
const ORDEN_GRUPOS = [
  'envio',
  'cobertura',
  'carrito',
  'pedido',
  'promociones',
  'catalogo',
  'stock',
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
      <div role="status" aria-live="polite">
        <span className="visually-hidden">Cargando parámetros…</span>
        <SkeletonTarjeta />
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
      {grupos.map((grupo, indiceGrupo) => {
        const IconoGrupo = ICONOS_GRUPO[grupo.grupo];
        return (
          <Card
            key={grupo.grupo}
            className="shadow-sm parametros-card mb-4"
            style={{ '--parametros-orden': indiceGrupo }}
          >
            <Card.Header
              as="h2"
              className="h5 bg-white parametros-grupo-header"
            >
              {IconoGrupo ? (
                <span className="parametros-grupo-icono" aria-hidden="true">
                  <IconoGrupo />
                </span>
              ) : null}
              <span className="parametros-grupo-titulo">{grupo.titulo}</span>
              <Badge bg={null} className="parametros-grupo-cantidad">
                {grupo.parametros.length === 1
                  ? '1 parámetro'
                  : `${grupo.parametros.length} parámetros`}
              </Badge>
            </Card.Header>
            <Card.Body>
              <Row xs={1} lg={2} className="g-4">
                {grupo.parametros.map((parametro) => (
                  <Col key={parametro.clave}>
                    <Form.Group
                      controlId={`parametro-${parametro.clave}`}
                      className="parametros-item"
                    >
                      <Form.Label className="parametros-item-label">
                        {parametro.descripcion}
                        {parametro.unidad ? (
                          <Badge bg={null} className="ms-2 parametros-unidad">
                            {parametro.unidad}
                          </Badge>
                        ) : null}
                      </Form.Label>
                      <div className="parametros-item-control">
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
                        <Button
                          type="button"
                          variant="outline-secondary"
                          className="parametros-item-reset"
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
                      </div>
                    </Form.Group>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        );
      })}
      <div className="parametros-pie">
        <Button
          variant="primary"
          type="submit"
          size="lg"
          disabled={guardando}
          className="parametros-guardar"
        >
          <FaSave className="me-2" aria-hidden="true" />
          {guardando ? 'Guardando…' : 'Guardar parámetros'}
        </Button>
      </div>
    </Form>
  );
};

export default FormularioParametros;