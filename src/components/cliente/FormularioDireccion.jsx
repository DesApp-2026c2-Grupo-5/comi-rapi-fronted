/**
 * Propósito: Formulario para crear o editar una dirección de cliente.
 * Contenido: Componente FormularioDireccion con la cascada territorial
 *            (provincia → partido/comuna → localidad), autocompletado de
 *            calles, aviso de cobertura por provincia y flujo de preview
 *            (selección de coincidencias ANTES de guardar).
 * Dependencias: react-bootstrap, hooks/useDireccionTerritorial (lógica
 *            compartida con FormularioSucursal), utils/territorio (provincias).
 * Uso: <FormularioDireccion direccion={direccion} onGuardar={handler} onCancelar={handler} />
 *      - Si 'direccion' es null/undefined, se comporta en modo creación.
 *      - Si 'direccion' trae datos, precarga el formulario para edición.
 *      - onGuardar DEBE devolver el resultado del backend:
 *        { ok: true, data } | { ok: false, error, opciones? }.
 *
 * Iteración 3: el "Guardar" primero VERIFICA la dirección (preview del
 * backend: sin persistir ni validar cobertura). Solo tras confirmar la
 * resolución se guarda, y recién entonces el backend aplica la cobertura
 * definitiva (nunca enmascarada por la ambigüedad).
 */

import { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, ListGroup, Spinner } from 'react-bootstrap';
import { FaMapMarkedAlt, FaSave, FaTimes, FaCheck, FaEdit } from 'react-icons/fa';
import { PROVINCIAS } from '../../utils/territorio';
import { useDireccionTerritorial } from '../../hooks/useDireccionTerritorial';
import Autocomplete from '../comunes/Autocomplete';
// Convención de dev (rediseño UI): el ancho de la tarjeta vive en CSS.
import './FormularioDireccion.css';

const FormularioDireccion = ({ direccion, onGuardar, onCancelar }) => {
  const [alias, setAlias] = useState('');
  const [referencia, setReferencia] = useState('');

  const confirmarGuardado = async (datosDireccion) => {
    const datos = {
      ...datosDireccion,
      alias: alias.trim() || null,
      referencia: referencia.trim() || null,
    };
    const resultado = await onGuardar(datos);
    if (resultado && resultado.ok) {
      return;
    }
    // 409 residual (los datos cambiaron entre el preview y el guardado):
    // se trata como ambigüedad y se vuelve al paso de selección.
    if (resultado && Array.isArray(resultado.opciones) && resultado.opciones.length) {
      direccionApi.mostrarOpcionesExternas(resultado.opciones);
      return;
    }
    // El error real (cobertura, geolocalización, etc.), con su mensaje.
    direccionApi.mostrarError(
      (resultado && resultado.error) || 'No se pudo guardar la dirección.'
    );
  };

  const direccionApi = useDireccionTerritorial({
    inicial: direccion,
    onConfirmado: confirmarGuardado,
  });

  // Precargan alias/referencia al entrar en modo edición (los campos
  // territoriales los maneja el hook).
  useEffect(() => {
    setAlias(direccion?.alias || '');
    setReferencia(direccion?.referencia || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direccion?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    direccionApi.previsualizar();
  };

  return (
    <Card className="shadow-sm direccion-form-card">
      <Card.Body>
        {/* Convención de dev: h3 con clase h5 (el <h2> de la página es el
            nivel superior). */}
        <h3 className="h5 mb-4 d-flex align-items-center gap-2">
          <FaMapMarkedAlt className="text-danger" aria-hidden="true" />
          {direccion ? 'Editar dirección' : 'Nueva dirección'}
        </h3>
        <Form onSubmit={handleSubmit} noValidate>
          {direccionApi.errores.length > 0 && (
            <div className="text-danger mb-3" role="alert">
              <ul className="mb-0 ps-3">
                {direccionApi.errores.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Iteración 3: aviso de cobertura al seleccionar la provincia. */}
          {direccionApi.avisoFueraZona && (
            <Alert variant="warning" role="alert" className="mb-3">
              {direccionApi.MENSAJE_FUERA_DE_ZONA}
            </Alert>
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

          {/* Calle con autocompletado (nombres oficiales del proxy con cache).
              Fix bug 1: hasta elegir provincia no se puede buscar (la query
              la exige); antes estaba habilitada y fallía en silencio. */}
          <Form.Group className="mb-3">
            <Form.Label>Calle *</Form.Label>
            <Form.Control
              type="text"
              value={direccionApi.calle}
              onChange={(e) => direccionApi.actualizarCalle(e.target.value)}
              placeholder="Ej: Av. Corrientes"
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
                        entre comunas/partidos ("AV JUAN B JUSTO, Comuna 9,
                        CABA"); se setea solo el nombre oficial. */}
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
              value={direccionApi.altura}
              onChange={(e) => direccionApi.actualizarAltura(e.target.value)}
              placeholder="Ej: 1234"
              min="0"
              step="1"
            />
          </Form.Group>

          {/* Fix bug 2: los campos territoriales admiten texto para BUSCAR y
              exigen selección explícita de la lista (Autocomplete), en lugar
              del select nativo que saltaba con la primera letra tipeada. */}
          <Autocomplete
            etiqueta="Provincia *"
            value={direccionApi.provincia}
            opciones={PROVINCIAS}
            onChange={direccionApi.actualizarProvincia}
            placeholder="Escribí para buscar tu provincia…"
          />

          {/* Partido (Buenos Aires) / comuna (CABA): siempre visible para no
              dejar estado territorial oculto (fix bug B). En PBA es
              obligatorio; en el resto, opcional. */}
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

          {/* Localidad (BAHRA; en CABA son los barrios): opcional, ayuda a
              desambiguar. */}
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

          {/* Paso de selección: varias identidades territoriales (fix de los
              bugs A y B). Elegir una opción aplica el partido/comuna y la
              calle OFICIAL; se re-verifica con el preview antes de guardar. */}
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
                  name="opciones-direccion"
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

          {/* Confirmación de la resolución: datos que obtuvo Georef. */}
          {direccionApi.preview?.estado === 'unica' && (
            <Alert variant="success" className="mb-4">
              <div className="fw-semibold mb-1">Confirmá tu dirección</div>
              <div>{direccionApi.preview.resultado.nomenclatura}</div>
              <div className="text-muted small mt-1">
                Coordenadas: {direccionApi.preview.resultado.latitud.toFixed(5)}
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
                  Guardar dirección
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
              onClick={onCancelar}
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

export default FormularioDireccion;
