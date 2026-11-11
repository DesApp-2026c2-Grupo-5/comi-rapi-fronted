import { useState, useEffect, useRef } from 'react';
import { Container, Table, Button, Badge, Alert, Form } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrashAlt, FaUndoAlt } from 'react-icons/fa';
import {
  actualizarIngrediente,
  crearIngrediente,
  eliminarIngrediente,
  obtenerIngredientes,
} from '../../api/ingredientes';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';
import ModalFormulario from '../../components/comunes/ModalFormulario';
import { SkeletonTabla } from '../../components/comunes/Skeleton';
import { useNotificaciones } from '../../hooks/useNotificaciones';

const UNIDADES = ['unidad', 'g', 'kg', 'ml', 'l'];

const GestionIngredientes = () => {
  const { notificar } = useNotificaciones();
  const [ingredientes, setIngredientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [enEdicion, setEnEdicion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [form, setForm] = useState({ nombre: '', unidadMedida: 'g', activo: true });
  const nombreRef = useRef(null);

  const cargar = async () => {
    setCargando(true);
    setError('');
    const result = await obtenerIngredientes();
    if (result.success) setIngredientes(result.data || []);
    else setError(result.error || 'No se pudieron cargar los ingredientes.');
    setCargando(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirNuevo = () => {
    setEnEdicion(null);
    setForm({ nombre: '', unidadMedida: 'g', activo: true });
    setModalAbierto(true);
  };

  const abrirEdicion = (ingrediente) => {
    setEnEdicion(ingrediente);
    setForm({
      nombre: ingrediente.nombre,
      unidadMedida: ingrediente.unidadMedida,
      activo: ingrediente.activo,
    });
    setModalAbierto(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const result = enEdicion
      ? await actualizarIngrediente(enEdicion.id, form)
      : await crearIngrediente(form);
    setGuardando(false);
    if (result.success) {
      notificar(
        enEdicion ? 'Ingrediente actualizado.' : 'Ingrediente creado.',
        'success'
      );
      setModalAbierto(false);
      cargar();
    } else {
      notificar(result.error || 'No se pudo guardar.', 'danger');
    }
  };

  const confirmarEliminar = async () => {
    if (!aEliminar) return;
    setConfirmando(true);
    const result = await eliminarIngrediente(aEliminar.id);
    setConfirmando(false);
    if (result.success) {
      notificar('Ingrediente dado de baja.', 'success');
      setAEliminar(null);
      cargar();
    } else {
      notificar(result.error || 'No se pudo eliminar.', 'danger');
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Ingredientes</h2>
        <Button variant="primary" onClick={abrirNuevo}>
          <FaPlus className="me-2" />
          Nuevo ingrediente
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {cargando ? (
        <SkeletonTabla filas={5} columnas={5} />
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Unidad</th>
              <th>En uso</th>
              <th>Stock total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ingredientes.map((ingrediente) => (
              <tr key={ingrediente.id}>
                <td>{ingrediente.nombre}</td>
                <td>{ingrediente.unidadMedida}</td>
                <td>
                  {ingrediente.enUso ? (
                    <Badge bg="info">{ingrediente.recetas} receta(s)</Badge>
                  ) : (
                    <span className="text-muted">No</span>
                  )}
                </td>
                <td>{ingrediente.stockTotal}</td>
                <td>
                  <Badge bg={ingrediente.activo ? 'success' : 'secondary'}>
                    {ingrediente.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="me-2"
                    onClick={() => abrirEdicion(ingrediente)}
                  >
                    <FaEdit />
                  </Button>
                  {ingrediente.activo ? (
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => setAEliminar(ingrediente)}
                    >
                      <FaTrashAlt />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline-success"
                      onClick={() => abrirEdicion(ingrediente)}
                    >
                      <FaUndoAlt />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ModalFormulario
        mostrar={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo={enEdicion ? 'Editar ingrediente' : 'Nuevo ingrediente'}
        onSubmit={guardar}
        cargando={guardando}
        initialFocusRef={nombreRef}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalAbierto(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </>
        }
      >
        <Form.Group className="mb-3">
          <Form.Label>Nombre</Form.Label>
          <Form.Control
            ref={nombreRef}
            value={form.nombre}
            onChange={(e) =>
              setForm((f) => ({ ...f, nombre: e.target.value }))
            }
            required
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Unidad de medida</Form.Label>
          <Form.Select
            value={form.unidadMedida}
            onChange={(e) =>
              setForm((f) => ({ ...f, unidadMedida: e.target.value }))
            }
          >
            {UNIDADES.map((unidad) => (
              <option key={unidad} value={unidad}>
                {unidad}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Check
            type="checkbox"
            label="Activo"
            checked={form.activo}
            onChange={(e) =>
              setForm((f) => ({ ...f, activo: e.target.checked }))
            }
          />
        </Form.Group>
      </ModalFormulario>

      <ConfirmarModal
        mostrar={Boolean(aEliminar)}
        titulo="Dar de baja ingrediente"
        mensaje={aEliminar ? `¿Dar de baja "${aEliminar.nombre}"?` : ''}
        textoConfirmar="Sí, dar de baja"
        cargando={confirmando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </Container>
  );
};

export default GestionIngredientes;
