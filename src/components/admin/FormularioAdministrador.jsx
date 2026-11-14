import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { FaSave } from 'react-icons/fa';
import { useSucursal } from '../../hooks/useSucursal';
import useMediaQuery from '../../hooks/useMediaQuery';
import FormularioPasos from './FormularioPasos';
import './FormularioAdmin.css';
import './FormularioABM.css';

const PASOS_ADMINISTRADOR = [
  { id: 'personales', etiqueta: 'Datos personales' },
  { id: 'acceso', etiqueta: 'Acceso y estado' },
];

const FORMULARIO_VACIO = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  password: '',
  rol: 'ADMINISTRADOR',
  sucursalId: '',
  activo: true,
};

const formularioDesde = (administrador) =>
  administrador
    ? {
        nombre: administrador.nombre || '',
        apellido: administrador.apellido || '',
        email: administrador.email || '',
        telefono: administrador.telefono || '',
        password: '',
        rol: administrador.rol || 'ADMINISTRADOR',
        sucursalId: administrador.sucursalId
          ? String(administrador.sucursalId)
          : '',
        activo: Boolean(administrador.activo),
      }
    : { ...FORMULARIO_VACIO };

const FormularioAdministrador = ({ administrador, onGuardar }) => {
  // Mismo corte que la barra inferior del shell (NavInferior, <992px): cuando
  // se navega como móvil, el formulario también usa pasos.
  const esMobile = useMediaQuery('(max-width: 991.98px)');
  const { sucursales = [], obtenerSucursales } = useSucursal();
  const [formulario, setFormulario] = useState(() =>
    formularioDesde(administrador)
  );
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const editando = Boolean(administrador?.id);

  useEffect(() => {
    obtenerSucursales();
  }, [obtenerSucursales]);

  useEffect(() => {
    setFormulario(formularioDesde(administrador));
    setPaso(1);
    setError('');
  }, [administrador]);

  const cambiarCampo = (campo, valor) => {
    setFormulario((previo) => ({ ...previo, [campo]: valor }));
  };

  const validarPaso1 = () => {
    if (!formulario.nombre.trim() || !formulario.email.trim()) {
      setError('El nombre y el email son obligatorios.');
      return false;
    }
    setError('');
    return true;
  };

  const validarPaso2 = () => {
    if (!editando && formulario.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return false;
    }
    const esAdministrador = formulario.rol === 'ADMINISTRADOR';
    if (esAdministrador && !formulario.sucursalId) {
      setError('Un administrador debe tener una sucursal asignada.');
      return false;
    }
    setError('');
    return true;
  };

  const guardarAdministrador = async () => {
    if (!validarPaso1() || !validarPaso2()) {
      return;
    }

    const esAdministrador = formulario.rol === 'ADMINISTRADOR';
    const datos = {
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
      email: formulario.email.trim(),
      telefono: formulario.telefono.trim() || undefined,
      activo: formulario.activo,
      rol: formulario.rol,
    };
    if (esAdministrador) {
      datos.sucursalId = Number(formulario.sucursalId);
    }
    if (editando) {
      if (formulario.password.trim()) {
        datos.password = formulario.password;
      }
    } else {
      datos.password = formulario.password;
    }

    setGuardando(true);
    setError('');
    const resultado = await onGuardar(datos);
    setGuardando(false);
    if (!resultado?.ok) {
      setError(resultado?.error || 'No se pudo guardar el administrador.');
    }
  };

  const irAPaso = (nuevoPaso) => {
    setError('');
    setPaso(nuevoPaso);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!esMobile) {
      guardarAdministrador();
      return;
    }

    if (paso === 1) {
      if (validarPaso1()) {
        irAPaso(2);
      }
      return;
    }

    guardarAdministrador();
  };

  const footerPasos = (
    <div className="w-100">
      <span className="abm-stepper-footer-paso">
        Paso {paso} de {PASOS_ADMINISTRADOR.length}
      </span>
      <div className="abm-stepper-footer-acciones mt-2">
        {paso > 1 && (
          <Button
            variant="secondary"
            type="button"
            onClick={() => irAPaso(paso - 1)}
            disabled={guardando}
          >
            Atrás
          </Button>
        )}
        <Button variant="primary" type="submit" disabled={guardando}>
          {guardando ? (
            'Guardando…'
          ) : paso === 2 ? (
            <>
              <FaSave className="me-1" aria-hidden="true" />
              {editando ? 'Guardar cambios' : 'Crear usuario'}
            </>
          ) : (
            'Siguiente'
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="shadow-sm formulario-admin-card">
      <Card.Body>
        <Form onSubmit={handleSubmit} noValidate>
          <FormularioPasos
            pasos={PASOS_ADMINISTRADOR}
            paso={paso}
            onPaso={irAPaso}
            esMobile={esMobile}
            footer={footerPasos}
          >
            {error && (
              <Alert variant="danger" role="alert" className="mb-3">
                {error}
              </Alert>
            )}

            {(!esMobile || paso === 1) && (
              <section className="abm-seccion">
                <h4 className="abm-seccion-titulo">Datos personales</h4>
                <div className="abm-form-grid">
                  <Form.Group className="mb-3" controlId="admin-nombre">
                    <Form.Label>Nombre *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formulario.nombre}
                      onChange={(e) => cambiarCampo('nombre', e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="admin-apellido">
                    <Form.Label>Apellido</Form.Label>
                    <Form.Control
                      type="text"
                      value={formulario.apellido}
                      onChange={(e) => cambiarCampo('apellido', e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="admin-email">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control
                      type="email"
                      value={formulario.email}
                      onChange={(e) => cambiarCampo('email', e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="admin-telefono">
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control
                      type="text"
                      value={formulario.telefono}
                      onChange={(e) => cambiarCampo('telefono', e.target.value)}
                    />
                  </Form.Group>
                </div>
              </section>
            )}

            {(!esMobile || paso === 2) && (
              <section className="abm-seccion">
                <h4 className="abm-seccion-titulo">Acceso y estado</h4>
                <div className="abm-form-grid">
                  <Form.Group className="mb-3" controlId="admin-rol">
                    <Form.Label>Rol *</Form.Label>
                    <Form.Select
                      value={formulario.rol}
                      onChange={(e) => cambiarCampo('rol', e.target.value)}
                    >
                      <option value="ADMINISTRADOR">Administrador</option>
                      <option value="SUPERADMINISTRADOR">Superadmin</option>
                    </Form.Select>
                  </Form.Group>

                  {formulario.rol === 'ADMINISTRADOR' ? (
                    <Form.Group className="mb-3" controlId="admin-sucursal">
                      <Form.Label>Sucursal asignada *</Form.Label>
                      <Form.Select
                        value={formulario.sucursalId}
                        onChange={(e) =>
                          cambiarCampo('sucursalId', e.target.value)
                        }
                        required
                      >
                        <option value="">Seleccioná una sucursal…</option>
                        {sucursales.map((sucursal) => (
                          <option key={sucursal.id} value={sucursal.id}>
                            {sucursal.nombre}
                            {sucursal.activa ? '' : ' (inactiva)'}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  ) : (
                    <div className="mb-3 d-flex align-items-end">
                      <p className="text-muted mb-2 small">
                        El superadmin no lleva sucursal asignada.
                      </p>
                    </div>
                  )}

                  <Form.Group className="mb-3" controlId="admin-password">
                    <Form.Label>
                      Contraseña{editando ? ' (nueva, opcional)' : ' *'}
                    </Form.Label>
                    <Form.Control
                      type="password"
                      value={formulario.password}
                      onChange={(e) =>
                        cambiarCampo('password', e.target.value)
                      }
                      placeholder={
                        editando
                          ? 'Dejar vacío para no cambiarla'
                          : 'Mínimo 6 caracteres'
                      }
                      required={!editando}
                    />
                  </Form.Group>

                  <Form.Group
                    className="mb-3 d-flex align-items-end"
                    controlId="admin-activo"
                  >
                    <Form.Check
                      type="switch"
                      id="admin-activo"
                      label="Cuenta activa"
                      checked={formulario.activo}
                      onChange={(e) =>
                        cambiarCampo('activo', e.target.checked)
                      }
                    />
                  </Form.Group>
                </div>
              </section>
            )}

            {!esMobile && (
              <Button variant="primary" type="submit" disabled={guardando}>
                <FaSave className="me-1" aria-hidden="true" />
                {guardando
                  ? 'Guardando…'
                  : editando
                    ? 'Guardar cambios'
                    : 'Crear usuario'}
              </Button>
            )}
          </FormularioPasos>
        </Form>
      </Card.Body>
    </Card>
  );
};

FormularioAdministrador.propTypes = {
  administrador: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nombre: PropTypes.string,
    apellido: PropTypes.string,
    email: PropTypes.string,
    telefono: PropTypes.string,
    rol: PropTypes.oneOf(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
    sucursalId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    activo: PropTypes.bool,
  }),
  onGuardar: PropTypes.func.isRequired,
};

export default FormularioAdministrador;
