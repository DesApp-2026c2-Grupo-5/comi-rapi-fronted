/**
 * Propósito: Formulario para crear o editar una sucursal usando Form de Bootstrap.
 * Contenido: Componente FormularioSucursal con campos controlados y validaciones básicas.
 * Dependencias: react-bootstrap (Form, Button, Card), react-router-dom (useNavigate),
 *               utils/constants.js (LIMITES_LAT, LIMITES_LNG).
 * Uso: <FormularioSucursal sucursal={sucursal} onGuardar={handler} />
 *      - Si 'sucursal' es null/undefined, se comporta en modo creación.
 *      - Si 'sucursal' trae datos, precarga el formulario para edición.
 *
 * Contrato (DER): nombre, direccion, latitud, longitud, telefono, horarios, activa.
 */

import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { LIMITES_LAT, LIMITES_LNG } from '../../utils/constants';

const FormularioSucursal = ({ sucursal, onGuardar }) => {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [horarios, setHorarios] = useState('');
  const [telefono, setTelefono] = useState('');
  const [activa, setActiva] = useState(true);
  const [error, setError] = useState('');

  // Precargan los datos al entrar en modo edición
  useEffect(() => {
    if (sucursal) {
      setNombre(sucursal.nombre || '');
      setDireccion(sucursal.direccion || '');
      setLatitud(sucursal.latitud ?? '');
      setLongitud(sucursal.longitud ?? '');
      setHorarios(sucursal.horarios || '');
      setTelefono(sucursal.telefono || '');
      setActiva(sucursal.activa !== false);
    }
  }, [sucursal]);

  // Valida que las coordenadas estén dentro de los rangos geográficos válidos
  const validarCoordenadas = () => {
    const latNum = Number(latitud);
    const lngNum = Number(longitud);

    if (latNum < LIMITES_LAT.MIN || latNum > LIMITES_LAT.MAX) {
      setError(`La latitud debe estar entre ${LIMITES_LAT.MIN} y ${LIMITES_LAT.MAX}.`);
      return false;
    }
    if (lngNum < LIMITES_LNG.MIN || lngNum > LIMITES_LNG.MAX) {
      setError(`La longitud debe estar entre ${LIMITES_LNG.MIN} y ${LIMITES_LNG.MAX}.`);
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas de campos requeridos
    if (!nombre.trim() || !direccion.trim()) {
      setError('El nombre y la dirección son obligatorios.');
      return;
    }

    if (latitud === '' || longitud === '') {
      setError('Ingresá la latitud y la longitud de la sucursal.');
      return;
    }

    if (!validarCoordenadas()) {
      return;
    }

    const datosSucursal = {
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      latitud: Number(latitud),
      longitud: Number(longitud),
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
            <Form.Label>Dirección *</Form.Label>
            <Form.Control
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej: Av. Principal 123"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Latitud *</Form.Label>
            <Form.Control
              type="number"
              value={latitud}
              onChange={(e) => setLatitud(e.target.value)}
              placeholder="Ej: -34.6037"
              step="0.000001"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Longitud *</Form.Label>
            <Form.Control
              type="number"
              value={longitud}
              onChange={(e) => setLongitud(e.target.value)}
              placeholder="Ej: -58.3816"
              step="0.000001"
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