/**
 * Propósito: Formulario del superadministrador para editar los parámetros de
 *            negocio (envío, cobertura, carrito, pedidos y promociones).
 * Contenido: Componente FormularioParametros que agrupa el catálogo por `grupo`
 *            (con ícono y tarjeta propia), lo muestra en una grilla responsiva
 *            de dos columnas en pantallas grandes, permite editar cada valor y
 *            guarda individualmente cada parámetro (PUT /superadmin/parametros).
 *            Cada parámetro tiene su propio botón Guardar que se habilita solo
 *            cuando el valor cambió. Enter guarda solo el campo en foco.
 * Dependencias: react-bootstrap (Card, Form, Button, Alert, Row, Col,
 *               Badge, Spinner), react-icons/fa (FaSave, FaUndoAlt e íconos por
 *               grupo), useParametros, useNotificaciones,
 *               components/comunes/Skeleton (SkeletonTarjeta).
 * Uso: <FormularioParametros />
 *
 * El backend es la autoridad: acá solo se valida en espejo (tipo/rango) para
 * avisar sin ida y vuelta. Al guardar se envía solo el parámetro modificado;
 * el backend valida y emite evento Socket.IO solo para ese parámetro.
 * Las demás sesiones lo reciben y actualizan su caché sin GET general.
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
  Spinner,
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
  FaClock,
} from 'react-icons/fa';
import { useParametros } from '../../hooks/useParametros';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { SkeletonTarjeta } from '../comunes/Skeleton';
import './FormularioParametros.css';

const TITULOS_GRUPO = {
  envio: 'Envío',
  cobertura: 'Cobertura',
  horarios: 'Horarios',
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
  horarios: FaClock,
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
  'horarios',
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
  const { lista, loading, actualizarParametro } = useParametros();
  const { notificar } = useNotificaciones();
  const [valores, setValores] = useState({});
  const [guardando, setGuardando] = useState({});
  const [valoresOriginales, setValoresOriginales] = useState({});

  // Sincroniza el estado editable cuando llega/actualiza el catálogo.
  useEffect(() => {
    if (lista.length === 0) return;
    setValores(
      lista.reduce((acc, parametro) => {
        acc[parametro.clave] = String(parametro.valor);
        return acc;
      }, {})
    );
    setValoresOriginales(
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

  // Detecta si un parámetro específico cambió respecto a su valor original
  const haCambiado = (clave) => valores[clave] !== valoresOriginales[clave];

  // Validación individual de un parámetro
  const validarParametro = (parametro, valor) => {
    const crudo = valor;
    const numero = Number(crudo);
    if (crudo === '' || crudo === undefined || Number.isNaN(numero)) {
      return 'El valor tiene que ser numérico.';
    }
    if (parametro.tipo === 'entero' && !Number.isInteger(numero)) {
      return 'El valor tiene que ser un entero.';
    }
    if (numero < parametro.minimo) {
      return 'No puede ser menor a ' + parametro.minimo + '.';
    }
    if (parametro.maximo !== undefined && numero > parametro.maximo) {
      return 'No puede ser mayor a ' + parametro.maximo + '.';
    }
    return null;
  };

  // Guarda un único parámetro
  const guardarParametro = async (parametro) => {
    const clave = parametro.clave;
    const valor = valores[clave];
    const error = validarParametro(parametro, valor);
    if (error) {
      notificar('"' + parametro.descripcion + '": ' + error, 'warning');
      return;
    }

    setGuardando((prev) => ({ ...prev, [clave]: true }));

    try {
      const result = await actualizarParametro(clave, Number(valores[clave]));

      setGuardando((prev) => ({ ...prev, [clave]: false }));

      if (result.success) {
        // Actualizar valor original para reflejar que ya no hay cambios pendientes
        setValoresOriginales((prev) => ({ ...prev, [clave]: valores[clave] }));
        notificar('Parámetro "' + parametro.descripcion + '" guardado.', 'success');
      } else {
        notificar(
          result.error || 'No se pudo guardar "' + parametro.descripcion + '".',
          'danger'
        );
      }
    } catch (err) {
      setGuardando((prev) => ({ ...prev, [clave]: false }));
      console.error('Error guardando parámetro:', err);
      notificar(
        'No se pudo guardar "' + parametro.descripcion + '".',
        'danger'
      );
    }
  };

  // Maneja Enter en un campo: guarda solo ese parámetro
  const handleKeyDown = (e, parametro) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (haCambiado(parametro.clave)) {
        guardarParametro(parametro);
      }
    }
  };

  // Previene el submit del formulario global (Enter en cualquier campo)
  const handleSubmit = (e) => {
    e.preventDefault();
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
              className="h5 parametros-grupo-header"
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
                  : grupo.parametros.length + ' parámetros'}
              </Badge>
            </Card.Header>
            <Card.Body>
              <Row xs={1} lg={2} className="g-4">
                {grupo.parametros.map((parametro) => (
                  <Col key={parametro.clave}>
                    <Form.Group
                      controlId={'parametro-' + parametro.clave}
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
                          onKeyDown={(e) => handleKeyDown(e, parametro)}
                        />
                        <div className="parametros-item-actions">
                          <Button
                            type="button"
                            variant="outline-secondary"
                            className="parametros-item-reset"
                            title={'Volver al valor por defecto (' + parametro.valorPorDefecto + ')'}
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
                          <Button
                            type="button"
                            variant="primary"
                            className="parametros-item-save"
                            disabled={!haCambiado(parametro.clave) || guardando[parametro.clave]}
                            onClick={() => guardarParametro(parametro)}
                          >
                            {guardando[parametro.clave] ? (
                              <Spinner animation="border" size="sm" aria-hidden="true" />
                            ) : (
                              <FaSave className="me-1" aria-hidden="true" />
                            )}
                            <span className="visually-hidden">
                              Guardar {parametro.clave}
                            </span>
                          </Button>
                        </div>
                      </div>
                      </Form.Group>
                    </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        );
      })}
      </Form>
  );
};

export default FormularioParametros;