/**
 * Propósito: Alta y edición de un insumo (extra o condimento) en un modal.
 * Contenido: formulario con nombre, tipo, precio (sólo extra) y estado; valida
 *            localmente antes de avisar al padre.
 * Dependencias: react-bootstrap (Modal, Form, Button, InputGroup), react-icons.
 * Uso: <FormularioInsumo mostrar insumo={...} onGuardar={fn} onCancelar={fn} />
 *
 * El insumo es una entidad propia del catálogo: no es un producto. El alta
 * crea sus filas de stock en 0; las cantidades se cargan desde Stock.
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Button, InputGroup } from 'react-bootstrap';
import { FaSave } from 'react-icons/fa';

const VACIO = { nombre: '', tipo: 'extra', precio: '', activo: true };

const FormularioInsumo = ({
  mostrar,
  insumo,
  cargando = false,
  onGuardar,
  onCancelar,
}) => {
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState({});

  // Cada vez que se abre el modal se sincroniza con el insumo recibido. Se
  // compara por id para no pisar lo que el usuario está escribiendo si el
  // padre vuelve a renderizar.
  useEffect(() => {
    if (!mostrar) return;
    setDatos(
      insumo
        ? {
            nombre: insumo.nombre || '',
            tipo: insumo.tipo || 'extra',
            precio:
              insumo.precio !== null && insumo.precio !== undefined
                ? String(insumo.precio)
                : '',
            activo: insumo.activo !== false,
          }
        : VACIO
    );
    setErrores({});
  }, [mostrar, insumo]);

  const cambiar = (campo, valor) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const validar = () => {
    const nuevos = {};
    if (!String(datos.nombre).trim()) {
      nuevos.nombre = 'El nombre es obligatorio';
    }
    if (!['extra', 'condimento'].includes(datos.tipo)) {
      nuevos.tipo = 'Elegí extra o condimento';
    }
    if (datos.tipo === 'extra') {
      if (datos.precio === '' || datos.precio === null) {
        nuevos.precio = 'El precio es obligatorio para un extra';
      } else if (!Number.isFinite(Number(datos.precio)) || Number(datos.precio) < 0) {
        nuevos.precio = 'El precio debe ser un número mayor o igual a 0';
      }
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = (evento) => {
    evento.preventDefault();
    if (!validar()) return;
    onGuardar({
      nombre: String(datos.nombre).trim(),
      tipo: datos.tipo,
      // El condimento es gratis: el backend ignora cualquier precio.
      precio: datos.tipo === 'extra' ? Number(datos.precio) : null,
      ...(insumo ? { activo: datos.activo } : {}),
    });
  };

  const esEdicion = Boolean(insumo);

  return (
    <Modal show={mostrar} onHide={onCancelar} centered aria-labelledby="titulo-form-insumo">
      <Form onSubmit={enviar}>
        <Modal.Header closeButton>
          <Modal.Title id="titulo-form-insumo" className="h5">
            {esEdicion ? 'Editar insumo' : 'Nuevo insumo'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="insumo-nombre">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              value={datos.nombre}
              onChange={(e) => cambiar('nombre', e.target.value)}
              isInvalid={Boolean(errores.nombre)}
              placeholder="Ej.: Queso extra, Mayonesa"
              autoFocus
            />
            <Form.Control.Feedback type="invalid">
              {errores.nombre}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="insumo-tipo">
            <Form.Label>Tipo</Form.Label>
            <Form.Select
              value={datos.tipo}
              onChange={(e) => cambiar('tipo', e.target.value)}
              isInvalid={Boolean(errores.tipo)}
            >
              <option value="extra">Extra</option>
              <option value="condimento">Condimento</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errores.tipo}
            </Form.Control.Feedback>
          </Form.Group>

          {datos.tipo === 'extra' && (
            <Form.Group className="mb-3" controlId="insumo-precio">
              <Form.Label>Precio</Form.Label>
              <InputGroup hasValidation>
                <InputGroup.Text>$</InputGroup.Text>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  value={datos.precio}
                  onChange={(e) => cambiar('precio', e.target.value)}
                  isInvalid={Boolean(errores.precio)}
                />
                <Form.Control.Feedback type="invalid">
                  {errores.precio}
                </Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
          )}

          {esEdicion && (
            <Form.Group controlId="insumo-activo">
              <Form.Check
                type="switch"
                label="Disponible en el catálogo"
                checked={datos.activo}
                onChange={(e) => cambiar('activo', e.target.checked)}
              />
              <Form.Text className="text-muted">
                Si lo desactivás, deja de ofrecerse pero conserva el stock y el
                histórico de los pedidos.
              </Form.Text>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onCancelar} disabled={cargando}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={cargando}>
            <FaSave className="me-1" aria-hidden="true" />
            {cargando ? 'Guardando…' : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

FormularioInsumo.propTypes = {
  mostrar: PropTypes.bool.isRequired,
  insumo: PropTypes.object,
  cargando: PropTypes.bool,
  onGuardar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
};

export default FormularioInsumo;
