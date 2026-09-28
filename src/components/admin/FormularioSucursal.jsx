/**
 * Propósito: Formulario para crear o editar una sucursal usando Form de Bootstrap.
 * Contenido: Componente FormularioSucursal con campos controlados y validaciones básicas.
 * Dependencias: react-bootstrap (Form, Button, Card), react-router-dom (useNavigate).
 * Uso: <FormularioSucursal sucursal={sucursal} onGuardar={handler} />
 *      - Si 'sucursal' es null/undefined, se comporta en modo creación.
 *      - Si 'sucursal' trae datos, precarga el formulario para edición.
 *
 * Contrato (DER): la dirección se envía como objeto anidado
 * `direccion: { calle, altura, provincia, localidad, codigoPostal, referencia? }`
 * (Sucursal 1:1 Direccion — la dirección y las coordenadas se centralizan en Direccion).
 * Son obligatorios: calle, altura, provincia, localidad y codigoPostal.
 * latitud/longitud NO se ingresan manualmente (ni por admin ni por nadie):
 * las calcula el backend (servicio de geolocalización, tarea futura).
 */

import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const FormularioSucursal = ({ sucursal, onGuardar }) => {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [calle, setCalle] = useState('');
  const [altura, setAltura] = useState('');
  const [provincia, setProvincia] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [referencia, setReferencia] = useState('');
  const [horarios, setHorarios] = useState('');
  const [telefono, setTelefono] = useState('');
  const [activa, setActiva] = useState(true);
  const [error, setError] = useState('');

  // Precargan los datos al entrar en modo edición
  useEffect(() => {
    if (sucursal) {
      const dir = sucursal.direccion || {};
      setNombre(sucursal.nombre || '');
      setCalle(dir.calle || '');
      setAltura(dir.altura ?? '');
      setProvincia(dir.provincia || '');
      setLocalidad(dir.localidad || dir.ciudad || '');
      setCodigoPostal(dir.codigoPostal || '');
      setReferencia(dir.referencia || '');
      setHorarios(sucursal.horarios || '');
      setTelefono(sucursal.telefono || '');
      setActiva(sucursal.activa !== false);
    }
  }, [sucursal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas de campos requeridos
    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }

    if (!calle.trim()) {
      setError('La calle de la dirección es obligatoria.');
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

    const datosSucursal = {
      nombre: nombre.trim(),
      direccion: {
        calle: calle.trim(),
        altura: Number(altura),
        provincia: provincia.trim(),
        localidad: localidad.trim(),
        codigoPostal: codigoPostal.trim(),
        referencia: referencia.trim() || null,
      },
      horarios: horarios.trim() || null,
      telefono: telefono.trim() || null,
      activa,
    };

    if (onGuardar) {
      onGuardar(datosSucursal);
    }
  };

  const handleCancelar = () => {
    navigate('/admin/sucursales');
  };

  return (
    <Card className="shadow-sm" style={{ maxWidth: '500px' }}>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {error && <div className="text-danger mb-3">{error}</div>}
          <Form.Group className="mb-3">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Sucursal Centro"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Calle *</Form.Label>
            <Form.Control
              type="text"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Ej: Av. Principal"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Altura *</Form.Label>
            <Form.Control
              type="number"
              min="0"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="Ej: 123"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Provincia *</Form.Label>
            <Form.Control
              type="text"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              placeholder="Ej: Buenos Aires"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Localidad *</Form.Label>
            <Form.Control
              type="text"
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
              placeholder="Ej: CABA"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Código postal *</Form.Label>
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
              type="text"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: Frente a la plaza"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Horario de atención</Form.Label>
            <Form.Control
              type="text"
              value={horarios}
              onChange={(e) => setHorarios(e.target.value)}
              placeholder="Ej: Lun-Dom 10:00-23:00"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Teléfono</Form.Label>
            <Form.Control
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 011-1234-5678"
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Estado</Form.Label>
            <Form.Select
              value={activa ? 'activa' : 'inactiva'}
              onChange={(e) => setActiva(e.target.value === 'activa')}
            >
              <option value="activa">Activo</option>
              <option value="inactiva">Inactivo</option>
            </Form.Select>
          </Form.Group>
          <div className="d-flex gap-2">
            <Button variant="primary" type="submit" className="flex-fill">
              <FaSave className="me-1" aria-hidden="true" />
              Guardar
            </Button>
            <Button variant="secondary" type="button" onClick={handleCancelar} className="flex-fill">
              <FaTimes className="me-1" aria-hidden="true" />
              Cancelar
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FormularioSucursal;
