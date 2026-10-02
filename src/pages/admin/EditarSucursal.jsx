/**
 * Propósito: Página para crear o editar una sucursal usando FormularioSucursal.
 * Contenido: Componente EditarSucursal que obtiene el ID de la URL (useParams),
 *            precarga los datos de la sucursal a editar y delega en el contexto.
 * Dependencias: react-bootstrap (Container, Spinner, Button), react-router-dom
 *               (useParams, Link, useNavigate), FormularioSucursal, context/SucursalContext (useSucursal).
 * Uso: Ruta "/admin/sucursal/nuevo" o "/admin/sucursal/editar/:id" → <EditarSucursal />
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Spinner, Button } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import FormularioSucursal from '../../components/admin/FormularioSucursal';
import { useSucursal } from '../../hooks/useSucursal';
import { useNotificaciones } from '../../hooks/useNotificaciones';

const EditarSucursal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { sucursales, loading, agregarSucursal, actualizarSucursal } = useSucursal();
  const { notificar } = useNotificaciones();
  const [sucursal, setSucursal] = useState(null);
  const [cargando, setCargando] = useState(true);

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

  // Guarda creando o actualizando la sucursal según corresponda. Muestra el
  // Iteración 1-geo / Iteración 3: se devuelve el resultado al formulario
  // para que muestre los errores (cobertura, geolocalización) y las opciones
  // del 409 (desambiguación). El formulario ya no usa banners de página.
  const handleGuardar = async (datosSucursal) => {
    if (id) {
      const resultado = await actualizarSucursal(id, datosSucursal);
      if (!resultado.ok) {
        return resultado;
      }
      notificar(
        `Sucursal "${resultado.data.nombre}" actualizada correctamente.`,
        'success'
      );
    } else {
      const resultado = await agregarSucursal(datosSucursal);
      if (!resultado.ok) {
        return resultado;
      }
      notificar(
        `Sucursal "${resultado.data.nombre}" creada correctamente.`,
        'success'
      );
    }
    navigate('/admin/sucursales');
    return { ok: true };
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
      <FormularioSucursal sucursal={sucursal} onGuardar={handleGuardar} />
    </Container>
  );
};

export default EditarSucursal;