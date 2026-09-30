/**
 * Propósito: Página de perfil del cliente: ver sus datos, editar los que el
 *            sistema permite, agregar/cambiar/eliminar la foto y cambiar la
 *            contraseña.
 * Contenido: Componente Perfil con portada (avatar + nombre), ficha de datos que
 *            arranca en modo lectura y pasa a edición solo si el cliente lo pide,
 *            y la columna de herramientas (foto y contraseña) que aparece junto
 *            con esa edición.
 * Dependencias: react-bootstrap (Container, Card, Form, Button, Row, Col, Spinner),
 *               react-icons/fa, api/perfil.js, useAuth, useNotificaciones,
 *               ConfirmarModal, Avatar, validators, formatters, Perfil.css.
 * Uso: Ruta "/cliente/perfil" → <Perfil />
 *
 * El backend resuelve siempre el usuario desde la sesión: esta pantalla nunca
 * envía usuarioId. `nombre` y `apellido` son de solo lectura (el backend los
 * rechaza con 400), por eso se muestran bloqueados en el formulario en vez de
 * poder escribirse. El rol no se muestra: es un dato interno, no del perfil.
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Card, Form, Button, Row, Col, Spinner, Modal } from 'react-bootstrap';
import {
  FaUserCircle,
  FaCamera,
  FaTrashAlt,
  FaSave,
  FaKey,
  FaPencilAlt,
  FaTimes,
  FaLock,
  FaEnvelope,
  FaPhoneAlt,
  FaCalendarAlt,
  FaIdCard,
  FaMapMarkerAlt,
  FaPlus,
  FaEdit,
  FaCheckCircle,
} from 'react-icons/fa';
import {
  obtenerPerfil,
  actualizarPerfil,
  subirFotoPerfil,
  eliminarFotoPerfil,
  cambiarPasswordPerfil,
} from '../../api/perfil';
import { useAuth } from '../../hooks/useAuth';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { useDirecciones } from '../../hooks/useDirecciones';
import { validateEmail, validatePassword } from '../../utils/validators';
import { formatDateOnly, calcularEdad, nombreCompleto } from '../../utils/formatters';
import Avatar from '../../components/comunes/Avatar';
import CampoPassword from '../../components/comunes/CampoPassword';
import FormularioDireccion from '../../components/cliente/FormularioDireccion';
import ConfirmarModal from '../../components/comunes/ConfirmarModal';
import './Perfil.css';

// Solo se envían estos campos: nombre y apellido no se modifican desde acá.
const CAMPOS_VACIOS = {
  email: '',
  telefono: '',
  fechaNacimiento: '',
};

const PASSWORD_VACIA = {
  passwordActual: '',
  password: '',
  confirmPassword: '',
};

// Textos de las filas de la ficha cuando el cliente todavía no lo cargó.
const Vacio = () => <span className="perfil-valor-vacio">Sin cargar</span>;

const Perfil = () => {
  const { refrescarUsuario } = useAuth();
  const { notificar } = useNotificaciones();
  // El carrito y otros accesosvernight abren el gestor con ?direcciones=1
  const [searchParams] = useSearchParams();
  const {
    direcciones,
    loading: cargandoDirecciones,
    cargarDirecciones,
    agregarDireccion,
    editarDireccion,
    eliminarDireccion,
  } = useDirecciones();

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Modo lectura por defecto: la edición se habilita a pedido del cliente.
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(CAMPOS_VACIOS);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmandoGuardado, setConfirmandoGuardado] = useState(false);

  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [quitandoFoto, setQuitandoFoto] = useState(false);
  const [confirmandoBajaFoto, setConfirmandoBajaFoto] = useState(false);

  // Foto y contraseña solo existen mientras se está editando: en la vista de
  // lectura no quedan recuadros vacíos.
  const [mostrarFormPassword, setMostrarFormPassword] = useState(false);
  const [password, setPassword] = useState(PASSWORD_VACIA);
  const [errorPassword, setErrorPassword] = useState('');
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  // Aviso en la misma sección de que la contraseña quedó actualizada.
  const [passwordActualizada, setPasswordActualizada] = useState(false);

  // Las direcciones se editan aparte, en su propio gestor (modal): no se
  // mezclan con la edición del perfil.
  const [modalDirecciones, setModalDirecciones] = useState(false);
  const [direccionEnEdicion, setDireccionEnEdicion] = useState(null); // null | 'nueva' | objeto
  const [direccionAEliminar, setDireccionAEliminar] = useState(null);
  const [eliminandoDireccion, setEliminandoDireccion] = useState(false);

  const inputFoto = useRef(null);

  const datosFormulario = (datos) => ({
    email: datos.email || '',
    telefono: datos.telefono || '',
    fechaNacimiento: datos.fechaNacimiento || '',
  });

  // Carga el perfil y deja el formulario listo para una eventual edición
  const cargarPerfil = async () => {
    setCargando(true);
    const result = await obtenerPerfil();
    if (result.success) {
      setPerfil(result.data);
      setForm(datosFormulario(result.data));
    } else {
      notificar(result.error || 'No se pudo cargar el perfil.', 'danger');
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarPerfil();
    cargarDirecciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (searchParams.get('direcciones') === '1') {
      setModalDirecciones(true);
    }
  }, [searchParams]);

  const cambiarCampo = (campo) => (e) => {
    setForm((actual) => ({ ...actual, [campo]: e.target.value }));
  };

  // ---- Datos personales -------------------------------------------------
  const activarEdicion = () => {
    setForm(datosFormulario(perfil));
    setErrorForm('');
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setForm(datosFormulario(perfil));
    setErrorForm('');
    setEditando(false);
    // El formulario de contraseña es parte de la edición: se cierra con ella.
    setMostrarFormPassword(false);
    setPassword(PASSWORD_VACIA);
    setErrorPassword('');
    setPasswordActualizada(false);
  };

  // Guardar pide confirmación previa: primero valida, recién después de que el
  // cliente confirme se toca el backend.
  const handleGuardar = (e) => {
    e.preventDefault();
    setErrorForm('');

    if (!validateEmail(form.email.trim())) {
      setErrorForm('El email no tiene un formato válido.');
      return;
    }

    setConfirmandoGuardado(true);
  };

  const confirmarGuardado = async () => {
    setGuardando(true);
    const result = await actualizarPerfil({
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      fechaNacimiento: form.fechaNacimiento,
    });
    setGuardando(false);
    setConfirmandoGuardado(false);

    if (!result.success) {
      notificar(result.error || 'No se pudieron guardar los datos.', 'danger');
      return;
    }

    setPerfil(result.data);
    setForm(datosFormulario(result.data));
    setEditando(false);
    setMostrarFormPassword(false);
    // El navbar muestra el usuario de la sesión (email y avatar).
    if (refrescarUsuario) refrescarUsuario();
    notificar('Tus datos se actualizaron correctamente.', 'success');
  };

  // ---- Foto de perfil ---------------------------------------------------
  // Sube la imagen elegida por el cliente (JPG/PNG/WEBP, hasta 5 MB)
  const handleFotoSeleccionada = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setSubiendoFoto(true);
    const result = await subirFotoPerfil(archivo);
    setSubiendoFoto(false);
    // Permite volver a elegir el mismo archivo si la subida falló.
    if (inputFoto.current) inputFoto.current.value = '';

    if (!result.success) {
      notificar(result.error || 'No se pudo subir la foto.', 'danger');
      return;
    }
    setPerfil((actual) => ({ ...actual, fotoPerfilUrl: result.url }));
    // El avatar del navbar usa el usuario de la sesión.
    if (refrescarUsuario) refrescarUsuario();
    notificar('Foto de perfil actualizada.', 'success');
  };

  const handleQuitarFoto = async () => {
    setConfirmandoBajaFoto(false);
    setQuitandoFoto(true);
    const result = await eliminarFotoPerfil();
    setQuitandoFoto(false);

    if (!result.success) {
      notificar(result.error || 'No se pudo quitar la foto.', 'danger');
      return;
    }
    if (result.data) setPerfil(result.data);
    if (refrescarUsuario) refrescarUsuario();
    notificar('Foto de perfil eliminada.', 'success');
  };

  // ---- Contraseña -------------------------------------------------------
  const abrirFormPassword = () => {
    setPasswordActualizada(false);
    setErrorPassword('');
    setMostrarFormPassword(true);
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPassword('');
    setPasswordActualizada(false);

    if (!password.passwordActual) {
      setErrorPassword('Ingresá tu contraseña actual.');
      return;
    }
    if (!validatePassword(password.password)) {
      setErrorPassword('La contraseña nueva debe tener al menos 6 caracteres.');
      return;
    }
    if (password.password !== password.confirmPassword) {
      setErrorPassword('Las contraseñas no coinciden.');
      return;
    }

    setCambiandoPassword(true);
    const result = await cambiarPasswordPerfil(password);
    setCambiandoPassword(false);

    if (!result.success) {
      setErrorPassword(result.error || 'No se pudo cambiar la contraseña.');
      return;
    }
    setPassword(PASSWORD_VACIA);
    setMostrarFormPassword(false);
    setPasswordActualizada(true);
    notificar(result.data?.message || 'Contraseña actualizada correctamente.', 'success');
  };

  // ---- Direcciones (edición aparte, en su propio gestor) ---------------
  const abrirGestorDirecciones = () => setModalDirecciones(true);

  const cerrarGestorDirecciones = () => {
    setModalDirecciones(false);
    setDireccionEnEdicion(null);
  };

  const handleGuardarDireccion = async (datos) => {
    const guardada =
      direccionEnEdicion === 'nueva'
        ? await agregarDireccion(datos)
        : await editarDireccion(direccionEnEdicion.id, datos);

    if (!guardada) {
      notificar('No se pudo guardar la dirección.', 'danger');
      return;
    }
    setDireccionEnEdicion(null);
  };

  const confirmarEliminarDireccion = async () => {
    if (!direccionAEliminar) return;
    setEliminandoDireccion(true);
    const etiqueta = direccionAEliminar.alias || direccionAEliminar.calle;
    const ok = await eliminarDireccion(direccionAEliminar.id);
    setEliminandoDireccion(false);
    setDireccionAEliminar(null);
    notificar(
      ok ? `Dirección "${etiqueta}" eliminada correctamente.` : 'No se pudo eliminar la dirección.',
      ok ? 'success' : 'danger'
    );
  };

  // ---- Datos derivados para mostrar ------------------------------------
  const nombre = perfil?.nombre || '';
  const apellido = perfil?.apellido || '';
  const nombreYC = nombreCompleto(nombre, apellido) || 'Tu perfil';
  const edad = calcularEdad(perfil?.fechaNacimiento);
  const tieneFoto = Boolean(perfil?.fotoPerfilUrl);

  // Qué campos modificaría realmente el guardado: se listan en la confirmación
  // para que el cliente revise antes de confirmar.
  const cambiosPendientes = [
    { campo: 'Email', valor: form.email.trim(), anterior: perfil?.email || '' },
    { campo: 'Teléfono', valor: form.telefono.trim(), anterior: perfil?.telefono || '' },
    {
      campo: 'Fecha de nacimiento',
      valor: form.fechaNacimiento,
      anterior: perfil?.fechaNacimiento || '',
    },
  ].filter((cambio) => cambio.valor !== cambio.anterior);

  const resumenCambios = cambiosPendientes
    .map((cambio) => `${cambio.campo}: ${cambio.valor || 'sin valor'}`)
    .join(' · ');

  // Una dirección en una línea: calle, localidad, provincia y código postal.
  const lineasDireccion = (direccion) => [
    [direccion.calle, direccion.altura].filter(Boolean).join(' '),
    [direccion.localidad || direccion.ciudad, direccion.provincia].filter(Boolean).join(', '),
    direccion.codigoPostal ? `CP ${direccion.codigoPostal}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  // La tarjeta de direcciones se muestra a la derecha al leer el perfil y, al
  // editarlo, se desplaza debajo para dejarle el lugar a foto y contraseña.
  const tarjetaDirecciones = (
    <Card className="shadow-sm perfil-tarjeta">
      <Card.Body>
        <h2 className="perfil-titulo">
          <FaMapMarkerAlt aria-hidden="true" />
          Mis direcciones
        </h2>
        <p className="perfil-bajada">Las que usás para recibir tus pedidos.</p>

        {cargandoDirecciones ? (
          <p className="text-muted mb-0">Cargando direcciones...</p>
        ) : direcciones.length === 0 ? (
          <p className="perfil-direccion-vacia">
            Todavía no cargaste ninguna dirección. Podés agregarla cuando quieras.
          </p>
        ) : (
          <ul className="perfil-direcciones">
            {direcciones.map((direccion) => (
              <li key={direccion.id} className="perfil-direccion">
                <span className="perfil-direccion-alias">
                  {direccion.alias || direccion.calle}
                </span>
                <span className="perfil-direccion-detalle">
                  {lineasDireccion(direccion)}
                </span>
                {direccion.referencia && (
                  <span className="perfil-direccion-referencia">{direccion.referencia}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <Button variant="primary" className="w-100 mt-3" onClick={abrirGestorDirecciones}>
          <FaEdit aria-hidden="true" />
          {direcciones.length === 0 ? 'Agregar dirección' : 'Administrar direcciones'}
        </Button>
      </Card.Body>
    </Card>
  );

  return (
    <Container className="perfil-pagina py-4">
      {cargando ? (
        <p className="text-muted d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" role="status" />
          Cargando perfil...
        </p>
      ) : (
        <>
          {/* ============ Portada: identidad del cliente ============ */}
          <header className="perfil-portada">
            <div className="perfil-portada-banda" aria-hidden="true" />
            <div className="perfil-portada-cuerpo">
              <span className="perfil-portada-avatar">
                <Avatar
                  src={perfil?.fotoPerfilUrl}
                  nombre={nombre}
                  apellido={apellido}
                  size={128}
                />
              </span>
              <div className="perfil-portada-datos">
                <h1 className="perfil-nombre">{nombreYC}</h1>
                <p className="perfil-correo">{perfil?.email}</p>
              </div>
              <div className="perfil-portada-acciones">
                {!editando && (
                  <Button variant="primary" onClick={activarEdicion} className="perfil-boton-editar">
                    <FaPencilAlt aria-hidden="true" />
                    Editar mis datos
                  </Button>
                )}
              </div>
            </div>
          </header>

          <Row className="g-4 mt-0">
            {/* ============ Ficha de datos ============ */}
            {/* Siempre a la izquierda: a la derecha van las direcciones (lectura)
                o las herramientas de foto y contraseña (edición). */}
            <Col xs={12} lg={8}>
              <Card className="shadow-sm perfil-tarjeta h-100">
                <Card.Body className="d-flex flex-column flex-grow-1">
                  <h2 className="perfil-titulo">
                    <FaIdCard aria-hidden="true" />
                    Información personal
                  </h2>
                  <p className="perfil-bajada">
                    {editando
                      ? 'Modificá tu email, teléfono o fecha de nacimiento.'
                      : 'Estos son los datos asociados a tu cuenta.'}
                  </p>

                  {errorForm && <div className="alert alert-danger">{errorForm}</div>}

                  {editando ? (
                    <Form
                      onSubmit={handleGuardar}
                      noValidate
                      className="d-flex flex-column flex-grow-1"
                    >
                      {/* Tres campos en columnas iguales: la fila queda cuadrada. */}
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Email *</Form.Label>
                            <Form.Control
                              type="email"
                              value={form.email}
                              onChange={cambiarCampo('email')}
                              placeholder="ejemplo@correo.com"
                              autoComplete="email"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Teléfono</Form.Label>
                            <Form.Control
                              type="tel"
                              value={form.telefono}
                              onChange={cambiarCampo('telefono')}
                              placeholder="Ej: 1155555555"
                              autoComplete="tel"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Fecha de nacimiento</Form.Label>
                            <Form.Control
                              type="date"
                              value={form.fechaNacimiento}
                              onChange={cambiarCampo('fechaNacimiento')}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <p className="perfil-nota">
                        <FaLock aria-hidden="true" />
                        El nombre y el apellido no se modifican desde el perfil.
                      </p>
                      <div className="perfil-acciones">
                        {/* Guardar solo aparece si hay algo modificado. */}
                        {cambiosPendientes.length > 0 && (
                          <Button type="submit" variant="primary" disabled={guardando}>
                            <FaSave aria-hidden="true" />
                            {guardando ? 'Guardando...' : 'Guardar cambios'}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={cancelarEdicion}
                          disabled={guardando}
                        >
                          <FaTimes aria-hidden="true" />
                          Cancelar
                        </Button>
                      </div>
                    </Form>
                  ) : (
                    <dl className="perfil-datos perfil-datos-sin-acciones">
                      <div className="perfil-dato">
                        <dt>
                          <FaUserCircle aria-hidden="true" />
                          Nombre
                        </dt>
                        <dd>{nombre || <Vacio />}</dd>
                      </div>
                      <div className="perfil-dato">
                        <dt>
                          <FaIdCard aria-hidden="true" />
                          Apellido
                        </dt>
                        <dd>{apellido || <Vacio />}</dd>
                      </div>
                      <div className="perfil-dato">
                        <dt>
                          <FaEnvelope aria-hidden="true" />
                          Email
                        </dt>
                        <dd>{perfil?.email || <Vacio />}</dd>
                      </div>
                      <div className="perfil-dato">
                        <dt>
                          <FaPhoneAlt aria-hidden="true" />
                          Teléfono
                        </dt>
                        <dd>{perfil?.telefono || <Vacio />}</dd>
                      </div>
                      <div className="perfil-dato">
                        <dt>
                          <FaCalendarAlt aria-hidden="true" />
                          Fecha de nacimiento
                        </dt>
                        <dd>
                          {perfil?.fechaNacimiento ? (
                            <>
                              {formatDateOnly(perfil.fechaNacimiento)}
                              {edad !== null && (
                                <span className="perfil-edad">{edad} años</span>
                              )}
                            </>
                          ) : (
                            <Vacio />
                          )}
                        </dd>
                      </div>
                    </dl>
                  )}

                  {/* ============ Contraseña (ocupa el espacio libre) ============ */}
                  {editando && (
                    <section className="perfil-bloque-interno">
                      <h2 className="perfil-titulo">
                        <FaKey aria-hidden="true" />
                        Contraseña
                      </h2>

                      {errorPassword && <div className="alert alert-danger">{errorPassword}</div>}

                      {passwordActualizada && (
                        <div className="alert alert-success d-flex align-items-center gap-2">
                          <FaCheckCircle aria-hidden="true" />
                          Contraseña actualizada correctamente.
                        </div>
                      )}

                      {mostrarFormPassword ? (
                        <>
                          <p className="perfil-bajada">
                            Necesitás tu contraseña actual para elegir una nueva.
                          </p>
                          <Form onSubmit={handleCambiarPassword} noValidate>
                            <Row>
                              <Col md={4}>
                                <CampoPassword
                                  id="passwordActual"
                                  etiqueta="Contraseña actual"
                                  value={password.passwordActual}
                                  onChange={(e) =>
                                    setPassword((actual) => ({
                                      ...actual,
                                      passwordActual: e.target.value,
                                    }))
                                  }
                                  autoComplete="current-password"
                                />
                              </Col>
                              <Col md={4}>
                                <CampoPassword
                                  id="passwordNueva"
                                  etiqueta="Contraseña nueva"
                                  value={password.password}
                                  onChange={(e) =>
                                    setPassword((actual) => ({
                                      ...actual,
                                      password: e.target.value,
                                    }))
                                  }
                                  autoComplete="new-password"
                                  placeholder="Mínimo 6 caracteres"
                                />
                              </Col>
                              <Col md={4}>
                                <CampoPassword
                                  id="passwordRepetida"
                                  etiqueta="Repetir contraseña nueva"
                                  value={password.confirmPassword}
                                  onChange={(e) =>
                                    setPassword((actual) => ({
                                      ...actual,
                                      confirmPassword: e.target.value,
                                    }))
                                  }
                                  autoComplete="new-password"
                                />
                              </Col>
                            </Row>
                            <div className="perfil-acciones">
                              <Button type="submit" variant="primary" disabled={cambiandoPassword}>
                                <FaKey aria-hidden="true" />
                                {cambiandoPassword ? 'Cambiando...' : 'Confirmar'}
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={cambiandoPassword}
                                onClick={() => {
                                  setPassword(PASSWORD_VACIA);
                                  setErrorPassword('');
                                  setMostrarFormPassword(false);
                                }}
                              >
                                <FaTimes aria-hidden="true" />
                                Cancelar
                              </Button>
                            </div>
                          </Form>
                        </>
                      ) : (
                        <>
                          <p className="perfil-bajada mb-3">Actualizá tu contraseña.</p>
                          <Button variant="primary" onClick={abrirFormPassword}>
                            <FaKey aria-hidden="true" />
                            Cambiar contraseña
                          </Button>
                        </>
                      )}
                    </section>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* ============ Direcciones (a la derecha al leer) ============ */}
            {!editando && <Col xs={12} lg={4}>{tarjetaDirecciones}</Col>}

            {/* ============ Foto y contraseña (solo al editar) ============ */}
            {editando && (
              <Col lg={4}>
                <Card className="shadow-sm perfil-tarjeta h-100">
                  <Card.Body>
                    <h2 className="perfil-titulo">
                      <FaCamera aria-hidden="true" />
                      Foto de perfil
                    </h2>
                    <p className="perfil-bajada mb-3">
                      {tieneFoto
                        ? 'Es la imagen que se ve en tu avatar del menú.'
                        : 'Por ahora se muestran tus iniciales.'}
                    </p>

                    <div className="perfil-foto-preview">
                      <Avatar
                        src={perfil?.fotoPerfilUrl}
                        nombre={nombre}
                        apellido={apellido}
                        size={104}
                        alt={tieneFoto ? `Foto de perfil de ${nombreYC}` : ''}
                      />
                    </div>

                    <input
                      ref={inputFoto}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="d-none"
                      onChange={handleFotoSeleccionada}
                    />
                    <div className="perfil-acciones">
                      <Button
                        variant="primary"
                        className="w-100"
                        disabled={subiendoFoto}
                        onClick={() => inputFoto.current?.click()}
                      >
                        {subiendoFoto ? (
                          <>
                            <Spinner animation="border" size="sm" role="status" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <FaCamera aria-hidden="true" />
                            {tieneFoto ? 'Cambiar foto' : 'Agregar foto'}
                          </>
                        )}
                      </Button>
                      {tieneFoto && (
                        <Button
                          variant="outline-danger"
                          className="w-100"
                          disabled={quitandoFoto}
                          onClick={() => setConfirmandoBajaFoto(true)}
                        >
                          <FaTrashAlt aria-hidden="true" />
                          Quitar foto
                        </Button>
                      )}
                    </div>
                    <p className="perfil-nota mb-0">Formatos JPG, PNG o WEBP de hasta 5 MB.</p>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>

          {/* ============ Direcciones (desplazadas abajo al editar) ============ */}
          {editando && (
            <Row className="g-4 mt-0">
              <Col xs={12}>{tarjetaDirecciones}</Col>
            </Row>
          )}
        </>
      )}

      {/* ============ Gestor de direcciones (edición aparte) ============ */}
      <Modal show={modalDirecciones} onHide={cerrarGestorDirecciones} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Mis direcciones</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {direccionEnEdicion !== null ? (
            <FormularioDireccion
              direccion={direccionEnEdicion === 'nueva' ? null : direccionEnEdicion}
              onGuardar={handleGuardarDireccion}
              onCancelar={() => setDireccionEnEdicion(null)}
            />
          ) : direcciones.length === 0 ? (
            <>
              <p className="text-muted">
                Todavía no cargaste ninguna dirección. Agregá una para poder confirmar tus pedidos.
              </p>
              <Button variant="primary" onClick={() => setDireccionEnEdicion('nueva')}>
                <FaPlus aria-hidden="true" />
                Agregar dirección
              </Button>
            </>
          ) : (
            <>
              <ul className="perfil-direcciones mb-3">
                {direcciones.map((direccion) => (
                  <li key={direccion.id} className="perfil-direccion">
                    <span className="perfil-direccion-alias">
                      {direccion.alias || direccion.calle}
                    </span>
                    <span className="perfil-direccion-detalle">
                      {lineasDireccion(direccion)}
                    </span>
                    {direccion.referencia && (
                      <span className="perfil-direccion-referencia">
                        {direccion.referencia}
                      </span>
                    )}
                    <div className="perfil-acciones mt-2">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setDireccionEnEdicion(direccion)}
                      >
                        <FaEdit aria-hidden="true" />
                        Editar
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setDireccionAEliminar(direccion)}
                      >
                        <FaTrashAlt aria-hidden="true" />
                        Eliminar
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <Button variant="primary" onClick={() => setDireccionEnEdicion('nueva')}>
                <FaPlus aria-hidden="true" />
                Agregar dirección
              </Button>
            </>
          )}
        </Modal.Body>
      </Modal>

      <ConfirmarModal
        mostrar={confirmandoGuardado}
        titulo="Confirmar cambios"
        mensaje={
          cambiosPendientes.length > 0
            ? `Vas a modificar: ${resumenCambios}. ¿Confirmás?`
            : 'No detectaste cambios en tus datos. ¿Confirmás el guardado de todas formas?'
        }
        textoConfirmar="Sí, guardar"
        textoCancelar="Volver"
        cargando={guardando}
        onConfirmar={confirmarGuardado}
        onCancelar={() => setConfirmandoGuardado(false)}
      />

      <ConfirmarModal
        mostrar={Boolean(direccionAEliminar)}
        titulo="Eliminar dirección"
        mensaje={
          direccionAEliminar
            ? `¿Seguro que querés eliminar la dirección "${direccionAEliminar.alias || direccionAEliminar.calle}"?`
            : ''
        }
        textoConfirmar="Sí, eliminar"
        cargando={eliminandoDireccion}
        onConfirmar={confirmarEliminarDireccion}
        onCancelar={() => setDireccionAEliminar(null)}
      />

      <ConfirmarModal
        mostrar={confirmandoBajaFoto}
        titulo="Quitar foto de perfil"
        mensaje="¿Seguro que querés quitar tu foto de perfil? La vas a poder volver a agregar cuando quieras."
        textoConfirmar="Sí, quitar"
        cargando={quitandoFoto}
        onConfirmar={handleQuitarFoto}
        onCancelar={() => setConfirmandoBajaFoto(false)}
      />
    </Container>
  );
};

export default Perfil;
