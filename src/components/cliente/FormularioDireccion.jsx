/**
 * Propósito: Formulario para crear o editar una dirección de cliente.
 * Contenido: Componente FormularioDireccion con campos controlados (alias, calle,
 *            altura, provincia, localidad, codigoPostal y referencia) y validación básica.
 * Dependencias: react-bootstrap (Form, Button, Card), react (useState, useEffect).
 * Uso: <FormularioDireccion direccion={direccion} onGuardar={handler} onCancelar={handler} />
 *      - Si 'direccion' es null/undefined, se comporta en modo creación.
 *      - Si 'direccion' trae datos, precarga el formulario para edición.
 *
 * Contrato (DER): alias, calle, altura, provincia, localidad, codigoPostal,
 * referencia, latitud, longitud, activa. Son obligatorios: calle, altura,
 * provincia, localidad y codigoPostal. El cliente no carga latitud/longitud
 * (opcionales en el backend; a futuro las calcula un servicio de geolocalización).
 */

import { useState, useEffect } from 'react';
import { Form, Alert, Button, Card } from 'react-bootstrap';
import { FaMapMarkedAlt, FaSave, FaTimes } from 'react-icons/fa';
import './FormularioDireccion.css';

const FormularioDireccion = ({ direccion, onGuardar, onCancelar }) => {
  const [alias, setAlias] = useState('');
  const [calle, setCalle] = useState('');
  const [altura, setAltura] = useState('');
  const [provincia, setProvincia] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [referencia, setReferencia] = useState('');
  const [error, setError] = useState('');

  // Precargan los datos al entrar en modo edición
  useEffect(() => {
    if (direccion) {
      setAlias(direccion.alias || '');
      setCalle(direccion.calle || '');
      setAltura(direccion.altura ?? '');
      setProvincia(direccion.provincia || '');
      setLocalidad(direccion.localidad || direccion.ciudad || '');
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

    if (altura === '' || !Number.isInteger(Number(altura)) || Number(altura) < 0) {
      setError('La altura es obligatoria y debe ser un número entero mayor o igual a 0.');
      return;
    }

    if (!provincia.trim()) {
      setError('La provincia es obligatoria.');
      return;
    }

    if (!localidad.trim()) {
      setError('La localidad es obligatoria.');
      return;
    }

    if (!codigoPostal.trim()) {
      setError('El código postal es obligatorio.');
      return;
    }

    const datosDireccion = {
      alias: alias.trim() || null,
      calle: calle.trim(),
      altura: Number(altura),
      provincia: provincia.trim(),
      localidad: localidad.trim(),
      codigoPostal: codigoPostal.trim(),
      referencia: referencia.trim() || null,
    };

    if (onGuardar) {
      onGuardar(datosDireccion);
    }
  };

  return (
    <Card className="shadow-sm direccion-form-card">
      <Card.Body>
        {/* h3: el <h2> "Mis direcciones" de la página es el nivel superior. */}
        <h3 className="h5 mb-4 d-flex align-items-center gap-2">
          <FaMapMarkedAlt className="text-danger" aria-hidden="true" />
          {direccion ? 'Editar dirección' : 'Nueva dirección'}
        </h3>
        <Form onSubmit={handleSubmit} noValidate>
          {error && (
            <Alert variant="danger" role="alert" className="mb-3">
              {error}
            </Alert>
          )}
          <Form.Group className="mb-3" controlId="direccion-alias">
            <Form.Label>Alias</Form.Label>
            <Form.Control
              type="text"
              name="alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: Casa, Trabajo"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="direccion-calle">
            <Form.Label>Calle *</Form.Label>
            <Form.Control
              type="text"
              name="calle"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Ej: Av. Siempreviva"
              autoComplete="address-line1"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="direccion-altura">
            <Form.Label>Altura *</Form.Label>
            <Form.Control
              type="number"
              name="altura"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="Ej: 1234"
              min="0"
              step="1"
              inputMode="numeric"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="direccion-provincia">
            <Form.Label>Provincia *</Form.Label>
            <Form.Control
              type="text"
              name="provincia"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              placeholder="Ej: Buenos Aires"
              autoComplete="address-level1"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="direccion-localidad">
            <Form.Label>Localidad *</Form.Label>
            <Form.Control
              type="text"
              name="localidad"
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
              placeholder="Ej: CABA"
              autoComplete="address-level2"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="direccion-codigo-postal">
            <Form.Label>Código postal *</Form.Label>
            <Form.Control
              type="text"
              name="codigoPostal"
              value={codigoPostal}
              onChange={(e) => setCodigoPostal(e.target.value)}
              placeholder="Ej: 1406"
              autoComplete="postal-code"
              inputMode="numeric"
              required
            />
          </Form.Group>
          <Form.Group className="mb-4" controlId="direccion-referencia">
            <Form.Label>Referencia</Form.Label>
            <Form.Control
              as="textarea"
              name="referencia"
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
