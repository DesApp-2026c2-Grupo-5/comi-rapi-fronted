/**
 * Propósito: Formulario para crear o editar una dirección de cliente.
 * Contenido: Componente FormularioDireccion con campos controlados (alias, calle,
 *            altura, provincia, departamento/partido, localidad y referencia),
 *            validación acumulada y desambiguación de direcciones (409).
 * Dependencias: react-bootstrap (Form, Button, Card), react (useState, useEffect),
 *            utils/territorio (listas estáticas de provincias y partidos de PBA).
 * Uso: <FormularioDireccion direccion={direccion} onGuardar={handler} onCancelar={handler} />
 *      - Si 'direccion' es null/undefined, se comporta en modo creación.
 *      - Si 'direccion' trae datos, precarga el formulario para edición.
 *      - onGuardar DEBE devolver el resultado del backend:
 *        { ok: true, data } | { ok: false, error, opciones? }.
 *
 * Iteración 1-geo (modelo territorial, alineado con Georef):
 *   - Provincia: select (24 provincias, lista estática versionada).
 *   - Partido: select visible SOLO cuando la provincia es Buenos Aires
 *     (obligatorio allí: desambigua direcciones repetidas entre partidos).
 *   - Localidad: OPCIONAL (la determina el backend con Georef).
 *   - Código postal: se quitó del formulario (Georef no lo provee; el
 *     backend lo persiste como opcional).
 *   - Desambiguación: si el backend responde 409 con `opciones`
 *     (identidades territoriales distintas), se muestran para que el
 *     usuario elija una; se reintenta automáticamente agregando el
 *     `departamento` de la opción elegida. No es autocomplete: reutiliza
 *     el mismo POST/PUT.
 */

import { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { FaMapMarkedAlt, FaSave, FaTimes } from 'react-icons/fa';
import { PROVINCIAS, PARTIDOS_BUENOS_AIRES } from '../../utils/territorio';

const PROVINCIA_PARTIDO_OBLIGATORIO = 'Buenos Aires';

const FormularioDireccion = ({ direccion, onGuardar, onCancelar }) => {
  const [alias, setAlias] = useState('');
  const [calle, setCalle] = useState('');
  const [altura, setAltura] = useState('');
  const [provincia, setProvincia] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [referencia, setReferencia] = useState('');
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
    if (direccion) {
      setAlias(direccion.alias || '');
      setCalle(direccion.calle || '');
      setAltura(direccion.altura ?? '');
      setProvincia(direccion.provincia || '');
      setDepartamento(direccion.departamento || '');
      setLocalidad(direccion.localidad || direccion.ciudad || '');
      setReferencia(direccion.referencia || '');
    }
  }, [direccion]);

  const validar = () => {
    const nuevos = [];

    // Validaciones básicas: se acumulan todas en lugar de cortar en la primera
    if (!calle.trim()) {
      nuevos.push('La calle es obligatoria.');
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
    // Iteración 1-geo: partido obligatorio solo en Buenos Aires (regla del
    // backend; se valida acá para evitar un ida y vuelta innecesario).
    if (requierePartido && !departamento.trim()) {
      nuevos.push(
        'El partido es obligatorio para direcciones de la provincia de Buenos Aires.'
      );
    }

    return nuevos;
  };

  const construirDatos = () => ({
    alias: alias.trim() || null,
    calle: calle.trim(),
    altura: Number(altura),
    provincia: provincia.trim(),
    departamento: departamento.trim() || null,
    localidad: localidad.trim() || null,
    referencia: referencia.trim() || null,
  });

  // Iteración 1-geo: cuando el backend responde 409 con opciones, el usuario
  // elige una y se reintenta el mismo guardado con el `departamento` de la
  // opción elegida (la comuna/partido acota la query a Georef).
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
    // 409: el backend encontró varias ubicaciones para la dirección.
    if (resultado && Array.isArray(resultado.opciones) && resultado.opciones.length) {
      setOpciones(resultado.opciones);
      setOpcionElegida('');
      return;
    }
    setOpciones([]);
    setErrores([
      (resultado && resultado.error) || 'No se pudo guardar la dirección.',
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
      // onGuardar devuelve el resultado del backend ({ ok, data?, error?, opciones? })
      const resultado = await onGuardar(construirDatos());
      procesarResultado(resultado);
    }
  };

  return (
    <Card className="shadow-sm" style={{ maxWidth: '500px' }}>
      <Card.Body>
        <h5 className="mb-4 d-flex align-items-center gap-2">
          <FaMapMarkedAlt className="text-danger" />
          {direccion ? 'Editar dirección' : 'Nueva dirección'}
        </h5>
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
            <Form.Label>Alias</Form.Label>
            <Form.Control
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: Casa, Trabajo"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Calle *</Form.Label>
            <Form.Control
              type="text"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Ej: Av. Siempreviva"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Altura *</Form.Label>
            <Form.Control
              type="number"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              placeholder="Ej: 1234"
              min="0"
              step="1"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Provincia *</Form.Label>
            <Form.Select
              value={provincia}
              onChange={(e) => {
                setProvincia(e.target.value);
                // Al cambiar de provincia se recalcula la exigencia de partido.
                if (e.target.value !== PROVINCIA_PARTIDO_OBLIGATORIO) {
                  setDepartamento('');
                }
              }}
            >
              <option value="">Seleccioná una provincia…</option>
              {PROVINCIAS.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
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
                {PARTIDOS_BUENOS_AIRES.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
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
              placeholder="Ej: Caseros (si no la completás, la determina el sistema)"
            />
          </Form.Group>
          <Form.Group className="mb-4">
            <Form.Label>Referencia</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: Casa verde, 2da puerta"
            />
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
                  name="opciones-direccion"
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
            <Button variant="secondary" type="button" onClick={onCancelar} className="flex-fill">
              <FaTimes className="me-1" aria-hidden="true" />
              Cancelar
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FormularioDireccion;
