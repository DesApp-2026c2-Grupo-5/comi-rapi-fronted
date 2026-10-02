/**
 * Propósito: Formulario para crear o editar una sucursal usando Form de Bootstrap.
 * Contenido: Componente FormularioSucursal con datos propios de la sucursal y
 *            la cascada territorial compartida (provincia → partido/comuna →
 *            localidad), autocompletado de calles, aviso de cobertura por
 *            provincia y flujo de preview (iteración 3).
 * Dependencias: react-bootstrap, react-router-dom (useNavigate),
 *            hooks/useDireccionTerritorial, utils/territorio (provincias).
 * Uso: <FormularioSucursal sucursal={sucursal} onGuardar={handler} />
 *      - onGuardar DEBE devolver el resultado del backend:
 *        { ok: true, data } | { ok: false, error, opciones? }.
 *
 * Contrato (DER): la dirección se envía como objeto anidado
 * `direccion: { calle, altura, provincia, departamento?, localidad?, referencia? }`
 * (Sucursal 1:1 Direccion). latitud/longitud y los datos territoriales
 * normalizados los calcula/persiste el backend; el código postal no se pide
 * (Georef no lo provee).
 */

import { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, ListGroup, Spinner } from 'react-bootstrap';
import { FaSave, FaTimes, FaCheck, FaEdit, FaMapMarkedAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { PROVINCIAS } from '../../utils/territorio';
import { useDireccionTerritorial } from '../../hooks/useDireccionTerritorial';
import Autocomplete from '../comunes/Autocomplete';

const FormularioSucursal = ({ sucursal, onGuardar }) => {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [referencia, setReferencia] = useState('');
  const [horarios, setHorarios] = useState('');
  const [telefono, setTelefono] = useState('');
  const [activa, setActiva] = useState(true);

  const confirmarGuardado = async (datosDireccion) => {
    // El hook valida la dirección; el nombre es propio de la sucursal.
    if (!nombre.trim()) {
      direccionApi.mostrarError('El nombre es obligatorio.');
      return;
    }
    const datosSucursal = {
      nombre: nombre.trim(),
      direccion: {
        ...datosDireccion,
        referencia: referencia.trim() || null,
      },
      horarios: horarios.trim() || null,
      telefono: telefono.trim() || null,
      activa,
    };
    const resultado = await onGuardar(datosSucursal);
    if (resultado && resultado.ok) {
      return;
    }
    if (resultado && Array.isArray(resultado.opciones) && resultado.opciones.length) {
      direccionApi.mostrarOpcionesExternas(resultado.opciones);
      return;
    }
    direccionApi.mostrarError(
      (resultado && resultado.error) || 'No se pudo guardar la sucursal.'
    );
  };

  const direccionApi = useDireccionTerritorial({
    inicial: sucursal?.direccion || null,
    onConfirmado: confirmarGuardado,
  });

  // Precargan los datos propios de la sucursal al entrar en modo edición.
  useEffect(() => {
    setNombre(sucursal?.nombre || '');
    setReferencia(sucursal?.direccion?.referencia || '');
    setHorarios(sucursal?.horarios || '');
    setTelefono(sucursal?.telefono || '');
    setActiva(sucursal?.activa !== false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursal?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    direccionApi.previsualizar();
  };

  const handleCancelar = () => {
    navigate('/admin/sucursales');
  };

  return (
    <Card className="shadow-sm" style={{ maxWidth: '500px' }}>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {direccionApi.errores.length > 0 && (
            <div className="text-danger mb-3">
              <ul className="mb-0 ps-3">
                {direccionApi.errores.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {direccionApi.avisoFueraZona && (
            <Alert variant="warning" className="mb-3">
              {direccionApi.MENSAJE_FUERA_DE_ZONA}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Sucursal Centro"
            />
          </Form.Group>

          {/* Fix bug 1: la calle espera a la provincia (la query la exige). */}
          <Form.Group className="mb-3">
            <Form.Label>Calle *</Form.Label>
            <Form.Control
              type="text"
              value={direccionApi.calle}
              onChange={(e) => direccionApi.actualizarCalle(e.target.value)}
              placeholder="Ej: Av. Principal"
              autoComplete="off"
              disabled={!direccionApi.provincia}
            />
            {!direccionApi.provincia && (
              <Form.Text className="text-muted">
                Seleccioná primero la provincia para buscar la calle.
              </Form.Text>
            )}
            {direccionApi.errorSugerencias && (
              <Form.Text className="text-danger d-block">
                {direccionApi.errorSugerencias}
              </Form.Text>
            )}
            {direccionApi.sugerencias.length > 0 && (
              <ListGroup
                className="mt-1"
                style={{ maxHeight: 180, overflowY: 'auto' }}
              >
                {direccionApi.sugerencias.map((sugerencia) => (
                  <ListGroup.Item
                    key={sugerencia.id}
                    action
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      direccionApi.seleccionarSugerencia(sugerencia.nombre)
                    }
                  >
                    {/* Fix bug 3: la nomenclatura distingue calles repetidas
                        entre comunas/partidos. */}
                    <div className="fw-semibold">{sugerencia.nombre}</div>
                    {sugerencia.nomenclatura && (
                      <div className="text-muted small">
                        {sugerencia.nomenclatura}
                      </div>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Altura *</Form.Label>
            <Form.Control
              type="number"
              min="0"
              value={direccionApi.altura}
              onChange={(e) => direccionApi.actualizarAltura(e.target.value)}
              placeholder="Ej: 123"
            />
          </Form.Group>

          {/* Fix bug 2: combobox con búsqueda por texto y selección explícita. */}
          <Autocomplete
            etiqueta="Provincia *"
            value={direccionApi.provincia}
            opciones={PROVINCIAS}
            onChange={direccionApi.actualizarProvincia}
            placeholder="Escribí para buscar tu provincia…"
          />

          {direccionApi.provincia && (
            <Autocomplete
              etiqueta={
                direccionApi.requierePartido ? (
                  'Partido *'
                ) : (
                  <>
                    Partido / Comuna{' '}
                    <span className="text-muted">(opcional)</span>
                  </>
                )
              }
              value={direccionApi.departamento}
              opciones={direccionApi.departamentosOpts}
              onChange={direccionApi.actualizarDepartamento}
              placeholder="Escribí para buscar el partido/comuna…"
              ayudaOpcional="Si no lo sabés, la determina el sistema."
            />
          )}

          {direccionApi.provincia && (
            <Autocomplete
              etiqueta={
                <>
                  Localidad <span className="text-muted">(opcional)</span>
                </>
              }
              value={direccionApi.localidad}
              opciones={direccionApi.localidadesOpts}
              onChange={direccionApi.actualizarLocalidad}
              placeholder="Escribí para buscar la localidad (ej: Liniers)…"
              ayudaOpcional="Si no la sabés, la determina el sistema."
            />
          )}

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

          {direccionApi.preview?.estado === 'ambigua' && (
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">
                La dirección coincide con varias ubicaciones. ¿Cuál es la correcta?
              </Form.Label>
              {direccionApi.preview.opciones.map((opcion) => (
                <Form.Check
                  key={opcion.nomenclatura}
                  type="radio"
                  id={`opcion-${opcion.nomenclatura}`}
                  name="opciones-direccion-sucursal"
                  label={opcion.nomenclatura}
                  checked={direccionApi.opcionElegida === opcion.nomenclatura}
                  onChange={() => direccionApi.elegirOpcion(opcion.nomenclatura)}
                  className="mb-1"
                />
              ))}
              <div className="d-grid mt-2">
                <Button
                  variant="primary"
                  type="button"
                  disabled={!direccionApi.opcionElegida}
                  onClick={direccionApi.previsualizar}
                >
                  <FaCheck className="me-1" aria-hidden="true" />
                  Verificar con la opción seleccionada
                </Button>
              </div>
            </Form.Group>
          )}

          {direccionApi.preview?.estado === 'unica' && (
            <Alert variant="success" className="mb-4">
              <div className="fw-semibold mb-1">
                Confirmá la dirección de la sucursal
              </div>
              <div>{direccionApi.preview.resultado.nomenclatura}</div>
              <div className="text-muted small mt-1">
                Coordenadas:{' '}
                {direccionApi.preview.resultado.latitud.toFixed(5)}
                {' / '}
                {direccionApi.preview.resultado.longitud.toFixed(5)}
              </div>
              <div className="d-flex gap-2 mt-3">
                <Button
                  variant="primary"
                  className="rounded-pill px-4"
                  onClick={direccionApi.confirmar}
                >
                  <FaSave className="me-1" aria-hidden="true" />
                  Guardar sucursal
                </Button>
                <Button
                  variant="outline-secondary"
                  className="rounded-pill px-4"
                  onClick={direccionApi.editarDatos}
                >
                  <FaEdit className="me-1" aria-hidden="true" />
                  Editar datos
                </Button>
              </div>
            </Alert>
          )}

          <div className="d-flex gap-2">
            <Button
              variant="primary"
              type="submit"
              className="flex-fill"
              disabled={direccionApi.cargandoPreview}
            >
              {direccionApi.cargandoPreview ? (
                <>
                  <Spinner size="sm" className="me-1" animation="border" />
                  Verificando…
                </>
              ) : (
                <>
                  <FaMapMarkedAlt className="me-1" aria-hidden="true" />
                  Verificar dirección
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={handleCancelar}
              className="flex-fill"
            >
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
