/**
 * Propósito: Formulario para crear o editar una sucursal usando Form de Bootstrap.
 * Contenido: Componente FormularioSucursal con campos controlados, validaciones
 *            acumuladas y desambiguación de direcciones (409).
 * Dependencias: react-bootstrap (Form, Button, Card), react-router-dom (useNavigate),
 *            utils/territorio (listas estáticas de provincias y partidos de PBA).
 * Uso: <FormularioSucursal sucursal={sucursal} onGuardar={handler} />
 *      - Si 'sucursal' es null/undefined, se comporta en modo creación.
 *      - Si 'sucursal' trae datos, precarga el formulario para edición.
 *      - onGuardar DEBE devolver el resultado del backend:
 *        { ok: true, data } | { ok: false, error, opciones? }.
 *
 * Contrato (DER): la dirección se envía como objeto anidado
 * `direccion: { calle, altura, provincia, departamento?, localidad?, referencia? }`
 * (Sucursal 1:1 Direccion — la dirección y las coordenadas se centralizan en Direccion).
 *
 * Iteración 1-geo (modelo territorial, alineado con Georef):
 *   - Provincia: select; partido: select solo para Buenos Aires (obligatorio).
 *   - Localidad opcional (la determina el backend con Georef).
 *   - Código postal: se quitó del formulario (Georef no lo provee).
 *   - Desambiguación: 409 con `opciones` → el usuario elige y se reintenta
 *     con el `departamento` de la opción elegida.
 *   - latitud/longitud NO se ingresan manualmente: las calcula el backend.
 */

import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { PROVINCIAS, PARTIDOS_BUENOS_AIRES } from '../../utils/territorio';

const PROVINCIA_PARTIDO_OBLIGATORIO = 'Buenos Aires';

const FormularioSucursal = ({ sucursal, onGuardar }) => {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [calle, setCalle] = useState('');
  const [altura, setAltura] = useState('');
  const [provincia, setProvincia] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [referencia, setReferencia] = useState('');
  const [horarios, setHorarios] = useState('');
  const [telefono, setTelefono] = useState('');
  const [activa, setActiva] = useState(true);
  // Iteración 1-geo: opciones del 409 (dirección ambigua) y opción elegida.
  const [opciones, setOpciones] = useState([]);
  const [opcionElegida, setOpcionElegida] = useState('');
  // Lista de errores de validación local: se acumulan todos (no solo el primero)
  const [errores, setErrores] = useState([]);

  const requierePartido = provincia.trim() === PROVINCIA_PARTIDO_OBLIGATORIO;

  // Precargan los datos al entrar en modo edición
  useEffect(() => {
    setErrores([]);
    setOpciones([]);
    setOpcionElegida('');
    if (sucursal) {
      const dir = sucursal.direccion || {};
      setNombre(sucursal.nombre || '');
      setCalle(dir.calle || '');
      setAltura(dir.altura ?? '');
      setProvincia(dir.provincia || '');
      setDepartamento(dir.departamento || '');
      setLocalidad(dir.localidad || dir.ciudad || '');
      setReferencia(dir.referencia || '');
      setHorarios(sucursal.horarios || '');
      setTelefono(sucursal.telefono || '');
      setActiva(sucursal.activa !== false);
    }
  }, [sucursal]);

  const validar = () => {
    const nuevos = [];

    if (!nombre.trim()) {
      nuevos.push('El nombre es obligatorio.');
    }
    if (!calle.trim()) {
      nuevos.push('La calle de la dirección es obligatoria.');
    }
    if (
      altura === '' ||
      !Number.isInteger(Number(altura)) ||
      Number(altura) < 0
    ) {
      nuevos.push(
        'La altura es obligatoria y debe ser un número entero mayor o igual a 0.'
      );
    }
    if (!provincia.trim()) {
      nuevos.push('La provincia es obligatoria.');
    }
    // Iteración 1-geo: partido obligatorio solo en Buenos Aires.
    if (requierePartido && !departamento.trim()) {
      nuevos.push(
        'El partido es obligatorio para direcciones de la provincia de Buenos Aires.'
      );
    }

    return nuevos;
  };

  const construirDatos = () => ({
    nombre: nombre.trim(),
    direccion: {
      calle: calle.trim(),
      altura: Number(altura),
      provincia: provincia.trim(),
      departamento: departamento.trim() || null,
      localidad: localidad.trim() || null,
      referencia: referencia.trim() || null,
    },
    horarios: horarios.trim() || null,
    telefono: telefono.trim() || null,
    activa,
  });

  // Iteración 1-geo: elección de una opción del 409; el `departamento` de la
  // opción acota la query a Georef y se reintenta el mismo guardado.
  const elegirOpcion = (nomenclatura) => {
    const opcion = opciones.find((o) => o.nomenclatura === nomenclatura);
    if (!opcion) return;
    if (opcion.departamento) {
      setDepartamento(opcion.departamento);
    }
    if (opcion.localidad) {
      setLocalidad(opcion.localidad);
    }
    setOpcionElegida(nomenclatura);
    setErrores([]);
  };

  const reintentarConOpcion = async () => {
    if (!opcionElegida) {
      setErrores(['Seleccioná una de las opciones para continuar.']);
      return;
    }
    setErrores([]);
    setOpciones([]);
    const resultado = await onGuardar(construirDatos());
    procesarResultado(resultado);
  };

  const procesarResultado = (resultado) => {
    if (resultado && resultado.ok) {
      setOpciones([]);
      return;
    }
    if (resultado && Array.isArray(resultado.opciones) && resultado.opciones.length) {
      setOpciones(resultado.opciones);
      setOpcionElegida('');
      return;
    }
    setOpciones([]);
    setErrores([
      (resultado && resultado.error) || 'No se pudo guardar la sucursal.',
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nuevos = validar();

    setErrores(nuevos);
    if (nuevos.length > 0) {
      return;
    }

    if (onGuardar) {
      const resultado = await onGuardar(construirDatos());
      procesarResultado(resultado);
    }
  };

  const handleCancelar = () => {
    navigate('/admin/sucursales');
  };

  return (
    <Card className="shadow-sm" style={{ maxWidth: '500px' }}>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {errores.length > 0 && (
            <div className="text-danger mb-3">
              <ul className="mb-0 ps-3">
                {errores.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
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
          <Form.Group className="mb-3">
            <Form.Label>Calle *</Form.Label>
            <Form.Control
              type="text"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Ej: Av. Principal"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Altura *</Form.Label>
            <Form.Control
              type="number"
              min="0"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="Ej: 123"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Provincia *</Form.Label>
            <Form.Select
              value={provincia}
              onChange={(e) => {
                setProvincia(e.target.value);
                if (e.target.value !== PROVINCIA_PARTIDO_OBLIGATORIO) {
                  setDepartamento('');
                }
              }}
            >
              <option value="">Seleccioná una provincia…</option>
              {PROVINCIAS.map((nombreProvincia) => (
                <option key={nombreProvincia} value={nombreProvincia}>
                  {nombreProvincia}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          {requierePartido && (
            <Form.Group className="mb-3">
              <Form.Label>Partido *</Form.Label>
              <Form.Select
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
              >
                <option value="">Seleccioná un partido…</option>
                {PARTIDOS_BUENOS_AIRES.map((nombrePartido) => (
                  <option key={nombrePartido} value={nombrePartido}>
                    {nombrePartido}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}
          <Form.Group className="mb-3">
            <Form.Label>
              Localidad <span className="text-muted">(opcional)</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
              placeholder="Ej: Morón (si no la completás, la determina el sistema)"
            />
          </Form.Group>
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
          {opciones.length > 0 && (
            <Form.Group className="mb-4">
              <Form.Label className="fw-semibold">
                La dirección coincide con varias ubicaciones. ¿Cuál es la correcta?
              </Form.Label>
              {opciones.map((opcion) => (
                <Form.Check
                  key={opcion.nomenclatura}
                  type="radio"
                  id={`opcion-${opcion.nomenclatura}`}
                  name="opciones-direccion-sucursal"
                  label={opcion.nomenclatura}
                  checked={opcionElegida === opcion.nomenclatura}
                  onChange={() => elegirOpcion(opcion.nomenclatura)}
                  className="mb-1"
                />
              ))}
              <div className="d-grid mt-2">
                <Button
                  variant="primary"
                  type="button"
                  onClick={reintentarConOpcion}
                >
                  <FaSave className="me-1" aria-hidden="true" />
                  Guardar con la opción seleccionada
                </Button>
              </div>
            </Form.Group>
          )}
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
