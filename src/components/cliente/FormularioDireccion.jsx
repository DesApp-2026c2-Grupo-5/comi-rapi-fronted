/**
 * Propósito: Formulario para crear o editar una dirección de cliente.
 * Contenido: Componente FormularioDireccion con campos controlados (nombre, direccion,
 *            ciudad, codigoPostal, referencia y esPrincipal) y validación básica.
 * Dependencias: react-bootstrap (Form, Button, Card), react (useState, useEffect).
 * Uso: <FormularioDireccion direccion={direccion} onGuardar={handler} onCancelar={handler} />
 *      - Si 'direccion' es null/undefined, se comporta en modo creación.
 *      - Si 'direccion' trae datos, precarga el formulario para edición.
 */

import { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { FaMapMarkedAlt, FaSave, FaTimes } from 'react-icons/fa';

const FormularioDireccion = ({ direccion, clienteId, onGuardar, onCancelar }) => {
  const [nombre, setNombre] = useState('');
  const [direccionTexto, setDireccionTexto] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [referencia, setReferencia] = useState('');
  const [esPrincipal, setEsPrincipal] = useState(false);

  // Precargan los datos al entrar en modo edición
  useEffect(() => {
    if (direccion) {
      setNombre(direccion.nombre || '');
      setDireccionTexto(direccion.direccion || '');
      setCiudad(direccion.ciudad || '');
      setCodigoPostal(direccion.codigoPostal || '');
      setReferencia(direccion.referencia || '');
      setEsPrincipal(!!direccion.esPrincipal);
    }
  }, [direccion]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones básicas: nombre y dirección obligatorios
    if (!nombre.trim() || !direccionTexto.trim()) {
      alert('El nombre y la dirección son obligatorios.');
      return;
    }

    const datosDireccion = {
      nombre: nombre.trim(),
      direccion: direccionTexto.trim(),
      ciudad: ciudad.trim(),
      codigoPostal: codigoPostal.trim(),
      referencia: referencia.trim(),
      esPrincipal,
    };

    alert(`Dirección "${datosDireccion.nombre}" guardada correctamente (simulado).`);

    if (onGuardar) {
      onGuardar(datosDireccion);
    }
  };

  return (
    <Card className="shadow-sm" style={{ maxWidth: '500px' }}>
      <Card.Body>
        <h5 className="mb-4 d-flex align-items-center gap-2">
          <FaMapMarkedAlt className="text-danger" />
          {direccion ? 'Editar dirección' : 'Nueva dirección'}
        </h5>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Casa"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Dirección *</Form.Label>
            <Form.Control
              type="text"
              value={direccionTexto}
              onChange={(e) => setDireccionTexto(e.target.value)}
              placeholder="Ej: Av. Siempreviva 1234"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Ciudad</Form.Label>
            <Form.Control
              type="text"
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej: Capital Federal"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Código postal</Form.Label>
            <Form.Control
              type="text"
              value={codigoPostal}
              onChange={(e) => setCodigoPostal(e.target.value)}
              placeholder="Ej: 1406"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Referencia</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: Casa verde, 2da puerta"
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Check
              type="checkbox"
              label="Usar como dirección principal"
              checked={esPrincipal}
              onChange={(e) => setEsPrincipal(e.target.checked)}
            />
          </Form.Group>
          <div className="d-flex gap-2">
            <Button variant="primary" type="submit" className="flex-fill">
              <FaSave className="me-1" aria-hidden="true" />
              Guardar
            </Button>
            <Button variant="secondary" type="button" onClick={onCancelar} className="flex-fill">
              <FaTimes className="me-1" aria-hidden="true" />
              Cancelar
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FormularioDireccion;