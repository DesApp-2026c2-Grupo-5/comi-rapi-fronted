/**
 * Propósito: Página de direcciones del cliente con CRUD completo contra el backend
 *            (crear, editar y eliminar -baja lógica-).
 * Contenido: Componente MisDirecciones con lista de tarjetas de direcciones y
 *            formulario de alta/edición inline.
 * Dependencias: react-bootstrap (Container, Card, Button), react, hooks/useDirecciones.
 * Uso: Ruta "/cliente/mis-direcciones" → <MisDirecciones />
 */

import { useState, useEffect } from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { FaPlus, FaMapMarkerAlt, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useDirecciones } from '../../hooks/useDirecciones';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import FormularioDireccion from '../../components/cliente/FormularioDireccion';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';

const MisDirecciones = () => {
  const {
    direcciones,
    loading,
    cargarDirecciones,
    agregarDireccion,
    editarDireccion,
    eliminarDireccion,
  } = useDirecciones();
  const { notificar } = useNotificaciones();

  // null = mostrando lista | 'nueva' | dirección en edición
  const [enEdicion, setEnEdicion] = useState(null);

  // Dirección que espera confirmación para su eliminación
  const [direccionAEliminar, setDireccionAEliminar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  // Carga las direcciones del cliente al entrar a la página
  useEffect(() => {
    cargarDirecciones();
  }, [cargarDirecciones]);

  const handleNueva = () => setEnEdicion('nueva');

  const handleEditar = (direccion) => setEnEdicion(direccion);

  const handleCancelar = () => setEnEdicion(null);

  // Guarda según modo (crear o editar) y vuelve a la lista
  const handleGuardar = async (datos) => {
    const guardada =
      enEdicion === 'nueva'
        ? await agregarDireccion(datos)
        : await editarDireccion(enEdicion.id, datos);

    if (!guardada) {
      notificar('No se pudo guardar la dirección.', 'danger');
      return;
    }
    setEnEdicion(null);
  };

  // Abre el modal de confirmación para eliminar (baja lógica: el backend marca activa = false)
  const handleEliminar = (direccion) => setDireccionAEliminar(direccion);

  const confirmarEliminar = async () => {
    if (!direccionAEliminar) return;
    setConfirmando(true);
    const etiqueta = direccionAEliminar.alias || direccionAEliminar.calle;
    const ok = await eliminarDireccion(direccionAEliminar.id);
    notificar(
      ok
        ? `Dirección "${etiqueta}" eliminada correctamente.`
        : 'No se pudo eliminar la dirección.',
      ok ? 'success' : 'danger'
    );
    setDireccionAEliminar(null);
    setConfirmando(false);
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Mis Direcciones</h1>
        {enEdicion === null && (
          <Button variant="primary" className="rounded-pill px-3" onClick={handleNueva}>
            <FaPlus className="me-1" />
            Agregar dirección
          </Button>
        )}
      </div>

      {enEdicion !== null ? (
        <FormularioDireccion
          direccion={enEdicion === 'nueva' ? null : enEdicion}
          onGuardar={handleGuardar}
          onCancelar={handleCancelar}
        />
      ) : loading ? (
        <p className="text-muted">Cargando direcciones...</p>
      ) : direcciones.length === 0 ? (
        <Card className="shadow-sm text-center p-5">
          <h4 className="fw-bold mb-2">Todavía no tenés direcciones</h4>
          <p className="text-muted mb-4">Agregá una dirección para poder confirmar tus pedidos.</p>
          <div>
            <Button variant="primary" className="rounded-pill px-4" onClick={handleNueva}>
              <FaPlus className="me-1" />
              Agregar dirección
            </Button>
          </div>
        </Card>
      ) : (
        direcciones.map((direccion) => (
          <Card key={direccion.id} className="mb-3 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <strong className="d-flex align-items-center gap-2">
                <FaMapMarkerAlt className="text-danger" />
                {direccion.alias || direccion.calle}
              </strong>
            </Card.Header>
            <Card.Body>
              <p className="mb-1">
                <strong>Dirección:</strong> {direccion.calle}
                {direccion.altura ? ` ${direccion.altura}` : ''}
              </p>
              {direccion.ciudad && (
                <p className="mb-1"><strong>Ciudad:</strong> {direccion.ciudad}</p>
              )}
              {direccion.codigoPostal && (
                <p className="mb-1"><strong>Código postal:</strong> {direccion.codigoPostal}</p>
              )}
              {direccion.referencia && (
                <p className="mb-2"><strong>Referencia:</strong> {direccion.referencia}</p>
              )}
              <div className="d-flex gap-2 flex-wrap mt-3">
                <Button variant="outline-secondary" size="sm" onClick={() => handleEditar(direccion)}>
                  <FaEdit className="me-1" />
                  Editar
                </Button>
                <Button variant="outline-danger" size="sm" onClick={() => handleEliminar(direccion)}>
                  <FaTrashAlt className="me-1" />
                  Eliminar
                </Button>
              </div>
            </Card.Body>
          </Card>
        ))
      )}

      <ConfirmarModal
        mostrar={Boolean(direccionAEliminar)}
        titulo="Eliminar dirección"
        mensaje={
          direccionAEliminar
            ? `¿Seguro que querés eliminar la dirección "${direccionAEliminar.alias || direccionAEliminar.calle}"?`
            : ''
        }
        textoConfirmar="Sí, eliminar"
        cargando={confirmando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setDireccionAEliminar(null)}
      />
    </Container>
  );
};

export default MisDirecciones;
