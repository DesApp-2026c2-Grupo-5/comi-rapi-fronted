/**
 * Propósito: Página para crear o editar una sucursal usando FormularioSucursal.
 * Contenido: Componente EditarSucursal que obtiene el ID de la URL (useParams),
 *            precarga los datos de la sucursal a editar y delega en el contexto.
 * Dependencias: react-bootstrap (Container, Spinner, Button, Alert), react-router-dom
 *               (useParams, Link, useNavigate), FormularioSucursal, context/SucursalContext (useSucursal).
 * Uso: Ruta "/admin/sucursal/nuevo" o "/admin/sucursal/editar/:id" → <EditarSucursal />
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioSucursal from '../../components/admin/FormularioSucursal';
import { useSucursal } from '../../hooks/useSucursal';

const EditarSucursal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sucursales, loading, agregarSucursal, actualizarSucursal } = useSucursal();
  const [sucursal, setSucursal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const encontrada = sucursales.find((s) => s.id === Number(id));
      setSucursal(encontrada || null);
      setCargando(false);
    } else {
      // Modo creación: no hay sucursal precargada
      setSucursal(null);
      setCargando(false);
    }
  }, [id, sucursales]);

  // Guarda creando o actualizando la sucursal según corresponda
  const handleGuardar = async (datosSucursal) => {
    if (id) {
      const actualizada = await actualizarSucursal(id, datosSucursal);
      if (actualizada) {
        alert(`Sucursal "${actualizada.nombre}" actualizada correctamente (simulado).`);
      } else {
        setError('No se pudo actualizar la sucursal.');
        return;
      }
    } else {
      const creada = await agregarSucursal(datosSucursal);
      if (creada) {
        alert(`Sucursal "${creada.nombre}" creada correctamente (simulado).`);
      } else {
        setError('No se pudo crear la sucursal.');
        return;
      }
    }
    navigate('/admin/sucursales');
  };

  if (cargando || loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  if (id && !sucursal) {
    return (
      <Container className="py-5 text-center">
        <h2>Sucursal no encontrada</h2>
        <Link to="/admin/sucursales">
          <Button variant="secondary" className="mt-3">
            <FaArrowLeft className="me-1" aria-hidden="true" />
            Volver a sucursales
          </Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Link to="/admin/sucursales" className="text-danger text-decoration-none mb-3 d-inline-block">
        ← Volver a sucursales
      </Link>
      <h2 className="mb-4">{id ? `Editar Sucursal #${id}` : 'Nueva Sucursal'}</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <FormularioSucursal sucursal={sucursal} onGuardar={handleGuardar} />
    </Container>
  );
};

export default EditarSucursal;