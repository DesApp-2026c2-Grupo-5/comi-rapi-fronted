/**
 * Propósito: Página de direcciones del cliente con CRUD completo (crear, editar,
 *            eliminar -baja lógica- y marcar como principal).
 * Contenido: Componente MisDirecciones con lista de tarjetas de direcciones, badge
 *            "Principal", botones de acción y formulario de alta/edición inline.
 * Dependencias: react-bootstrap (Container, Card, Button, Badge), react, hooks/useAuth,
 *               hooks/useDirecciones.
 * Uso: Ruta "/cliente/mis-direcciones" → <MisDirecciones />
 */

import { useState, useMemo } from 'react';
import { Container, Card, Button, Badge } from 'react-bootstrap';
import { FaPlus, FaMapMarkerAlt, FaStar, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useDirecciones } from '../../hooks/useDirecciones';
import FormularioDireccion from '../../components/cliente/FormularioDireccion';

const MisDirecciones = () => {
  const { user } = useAuth();
  const { cargarDirecciones, agregarDireccion, editarDireccion, eliminarDireccion, seleccionarDireccionPrincipal } =
    useDirecciones();

  // Direcciones activas del cliente (solo las suyas)
  const direcciones = useMemo(
    () => cargarDirecciones(user?.email),
    [cargarDirecciones, user?.email]
  );

  // null = mostrando lista | 'nueva' | dirección en edición
  const [enEdicion, setEnEdicion] = useState(null);

  const handleNueva = () => setEnEdicion('nueva');

  const handleEditar = (direccion) => setEnEdicion(direccion);

  const handleCancelar = () => setEnEdicion(null);

  // Guarda según modo (crear o editar) y vuelve a la lista
  const handleGuardar = (datos) => {
    if (enEdicion === 'nueva') {
      agregarDireccion({ ...datos, clienteId: user?.email });
    } else if (enEdicion) {
      editarDireccion(enEdicion.id, { ...datos, clienteId: user?.email });
    }
    setEnEdicion(null);
  };

  // Elimina con confirmación (baja lógica: pasa a inactivo)
  const handleEliminar = (direccion) => {
    const confirmado = window.confirm(`¿Seguro que querés eliminar la dirección "${direccion.nombre}"?`);
    if (!confirmado) return;

    const ok = eliminarDireccion(direccion.id);
    alert(ok ? `Dirección "${direccion.nombre}" eliminada correctamente (simulado).` : 'No se pudo eliminar la dirección.');
  };

  // Marca como principal
  const handleMarcarPrincipal = (direccion) => {
    const ok = seleccionarDireccionPrincipal(direccion.id);
    alert(ok ? `"${direccion.nombre}" ahora es tu dirección principal.` : 'No se pudo marcar como principal.');
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
          clienteId={user?.email}
          onGuardar={handleGuardar}
          onCancelar={handleCancelar}
        />
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
                {direccion.nombre}
              </strong>
              {direccion.esPrincipal && (
                <Badge bg="success" className="d-inline-flex align-items-center gap-1">
                  <FaStar />
                  Principal
                </Badge>
              )}
            </Card.Header>
            <Card.Body>
              <p className="mb-1"><strong>Dirección:</strong> {direccion.direccion}</p>
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
                {!direccion.esPrincipal && (
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => handleMarcarPrincipal(direccion)}
                  >
                    <FaStar className="me-1" />
                    Marcar como principal
                  </Button>
                )}
                <Button variant="outline-danger" size="sm" onClick={() => handleEliminar(direccion)}>
                  <FaTrashAlt className="me-1" />
                  Eliminar
                </Button>
              </div>
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
};

export default MisDirecciones;