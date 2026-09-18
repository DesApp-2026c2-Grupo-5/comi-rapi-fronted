/**
 * Propósito: Formulario para crear o editar una dirección de cliente.
 * Contenido: Componente FormularioDireccion con campos controlados (alias, calle,
 *            altura, ciudad, codigoPostal y referencia) y validación básica.
 * Dependencias: react-bootstrap (Form, Button, Card), react (useState, useEffect).
 * Uso: <FormularioDireccion direccion={direccion} onGuardar={handler} onCancelar={handler} />
 *      - Si 'direccion' es null/undefined, se comporta en modo creación.
 *      - Si 'direccion' trae datos, precarga el formulario para edición.
 *
 * Contrato (DER): alias, calle, altura, ciudad, codigoPostal, referencia, latitud,
 * longitud, activa. El cliente no carga latitud/longitud (opcionales en el backend).
 */

import { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { FaMapMarkedAlt, FaSave, FaTimes } from 'react-icons/fa';

const FormularioDireccion = ({ direccion, onGuardar, onCancelar }) => {
  const [alias, setAlias] = useState('');
  const [calle, setCalle] = useState('');
  const [altura, setAltura] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [referencia, setReferencia] = useState('');
  const [error, setError] = useState('');

  // Precargan los datos al entrar en modo edición
  useEffect(() => {
    if (direccion) {
      setAlias(direccion.alias || '');
      setCalle(direccion.calle || '');
      setAltura(direccion.altura ?? '');
      setCiudad(direccion.ciudad || '');
      setCodigoPostal(direccion.codigoPostal || '');
      setReferencia(direccion.referencia || '');
    }
  }, [direccion]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!calle.trim()) {
      setError('La calle es obligatoria.');
      return;
    }

    if (altura !== '' && (!Number.isInteger(Number(altura)) || Number(altura) < 0)) {
      setError('La altura debe ser un número entero mayor o igual a 0.');
      return;
    }

    const datosDireccion = {
      alias: alias.trim() || null,
      calle: calle.trim(),
      altura: altura === '' ? null : Number(altura),
      ciudad: ciudad.trim() || null,
      codigoPostal: codigoPostal.trim() || null,
      referencia: referencia.trim() || null,
    };

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
          {error && <div className="text-danger mb-3">{error}</div>}
          <Form.Group className="mb-3">
            <Form.Label>Alias</Form.Label>
            <Form.Control
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: Casa, Trabajo"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Calle *</Form.Label>
            <Form.Control
              type="text"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Ej: Av. Siempreviva"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Altura</Form.Label>
            <Form.Control
              type="number"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="Ej: 1234"
              min="0"
              step="1"
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
          <Form.Group className="mb-4">
            <Form.Label>Referencia</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: Casa verde, 2da puerta"
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
