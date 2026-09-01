/**
 * Propósito: Formulario para crear o editar una sucursal usando Form de Bootstrap.
 * Contenido: Componente FormularioSucursal con campos controlados y validaciones básicas.
 * Dependencias: react-bootstrap (Form, Button, Card), react-router-dom (useNavigate),
 *               utils/constants.js (ESTADO_SUCURSAL, LIMITES_LAT, LIMITES_LNG).
 * Uso: <FormularioSucursal sucursal={sucursal} onGuardar={handler} />
 *      - Si 'sucursal' es null/undefined, se comporta en modo creación.
 *      - Si 'sucursal' trae datos, precarga el formulario para edición.
 */

import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { ESTADO_SUCURSAL, LIMITES_LAT, LIMITES_LNG } from '../../utils/constants';

const FormularioSucursal = ({ sucursal, onGuardar }) => {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [horario, setHorario] = useState('');
  const [telefono, setTelefono] = useState('');
  const [estado, setEstado] = useState(ESTADO_SUCURSAL.ACTIVO);

  // Precargan los datos al entrar en modo edición
  useEffect(() => {
    if (sucursal) {
      setNombre(sucursal.nombre || '');
      setDireccion(sucursal.direccion || '');
      setLat(sucursal.lat ?? '');
      setLng(sucursal.lng ?? '');
      setHorario(sucursal.horario || '');
      setTelefono(sucursal.telefono || '');
      setEstado(sucursal.estado || ESTADO_SUCURSAL.ACTIVO);
    }
  }, [sucursal]);

  // Valida que las coordenadas estén dentro de los rangos geográficos válidos
  const validarCoordenadas = () => {
    const latNum = Number(lat);
    const lngNum = Number(lng);

    if (latNum < LIMITES_LAT.MIN || latNum > LIMITES_LAT.MAX) {
      alert(`La latitud debe estar entre ${LIMITES_LAT.MIN} y ${LIMITES_LAT.MAX}.`);
      return false;
    }
    if (lngNum < LIMITES_LNG.MIN || lngNum > LIMITES_LNG.MAX) {
      alert(`La longitud debe estar entre ${LIMITES_LNG.MIN} y ${LIMITES_LNG.MAX}.`);
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validaciones básicas de campos requeridos
    if (!nombre.trim() || !direccion.trim()) {
      alert('El nombre y la dirección son obligatorios.');
      return;
    }

    if (lat === '' || lng === '') {
      alert('Ingresa la latitud y la longitud de la sucursal.');
      return;
    }

    if (!validarCoordenadas()) {
      return;
    }

    const datosSucursal = {
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      lat: Number(lat),
      lng: Number(lng),
      horario: horario.trim() || 'Lun-Dom 10:00-22:00',
      telefono: telefono.trim(),
      estado,
    };

    alert(`Sucursal "${datosSucursal.nombre}" guardada correctamente (simulado).`);

    if (onGuardar) {
      onGuardar(datosSucursal);
    }

    // Limpiar el formulario después de guardar (modo creación)
    if (!sucursal) {
      setNombre('');
      setDireccion('');
      setLat('');
      setLng('');
      setHorario('');
      setTelefono('');
      setEstado(ESTADO_SUCURSAL.ACTIVO);
    }
  };

  const handleCancelar = () => {
    navigate('/admin/sucursales');
  };

  return (
    <Card className="shadow-sm" style={{ maxWidth: '500px' }}>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
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
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Ej: -34.6037"
              step="0.000001"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Longitud *</Form.Label>
            <Form.Control
              type="number"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Ej: -58.3816"
              step="0.000001"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Horario de atención</Form.Label>
            <Form.Control
              type="text"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
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
            <Form.Select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value={ESTADO_SUCURSAL.ACTIVO}>Activo</option>
              <option value={ESTADO_SUCURSAL.INACTIVO}>Inactivo</option>
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