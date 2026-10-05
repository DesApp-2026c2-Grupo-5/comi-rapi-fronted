/**
 * Propósito: Formulario para crear o editar una dirección de cliente.
 * Contenido: Componente FormularioDireccion ordenado de general a específico
 *            (iteración 4): Ubicación (provincia → partido/comuna →
 *            localidad) → Dirección (calle con autocompletado → altura) →
 *            Datos complementarios (alias, referencia).
 * Dependencias: hooks/useDireccionTerritorial (lógica única),
 *            Autocomplete / OpcionesDireccionAmbigua / ConfirmacionDireccion
 *            (presentacionales compartidos), utils/territorio (provincias).
 * Uso: <FormularioDireccion direccion={direccion} onGuardar={handler} onCancelar={handler} />
 *      - Si 'direccion' es null/undefined, se comporta en modo creación.
 *      - onGuardar DEBE devolver el resultado del backend:
 *        { ok: true, data } | { ok: false, error, opciones? }.
 *
 * Iteración 3: el "Guardar" primero VERIFICA la dirección (preview del
 * backend: sin persistir ni validar cobertura); tras confirmar la resolución
 * se guarda y recién entonces el backend aplica la cobertura definitiva.
 * Iteración 4: campo calle al final de la ubicación (el gate "esperá a la
 * provincia" fluye con el orden visual) y avisos informativos de zona por
 * provincia y por partido (informativos; el backend decide al guardar).
 */

import { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, ListGroup, Spinner } from 'react-bootstrap';
import { FaMapMarkedAlt, FaSave, FaTimes } from 'react-icons/fa';
import { PROVINCIAS } from '../../utils/territorio';
import { useDireccionTerritorial } from '../../hooks/useDireccionTerritorial';
import Autocomplete from '../comunes/Autocomplete';
import OpcionesDireccionAmbigua from '../comunes/OpcionesDireccionAmbigua';
import ConfirmacionDireccion from '../comunes/ConfirmacionDireccion';
import ResultadoDireccion from '../comunes/ResultadoDireccion';
import '../comunes/DireccionFormulario.css';
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
    // Iteración 5: taxonomía del error. 5xx (o sin status) = técnico →
    // reintentar; el resto = funcional (cobertura, validación) → el hook
    // clasifica por mensaje/detalle en el estado unificado.
    const esTecnico =
      resultado && (resultado.status === undefined || resultado.status >= 500);
    direccionApi.mostrarError(
      (resultado && resultado.error) || 'No se pudo guardar la dirección.',
      {
        tipo: esTecnico ? 'tecnico' : 'funcional',
        detalle: resultado && resultado.detalle,
      }
    );
  };

  const direccionApi = useDireccionTerritorial({
    inicial: direccion,
    onConfirmado: confirmarGuardado,
    validarCobertura: true,
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
          {/* Avisos informativos de zona (provincia y, en la iteración 4,
              también partido). El backend sigue decidiendo al guardar. */}
          {(direccionApi.avisoFueraZona || direccionApi.avisoPartidoFueraZona) && (
            <Alert
              variant="warning"
              role="alert"
              className="mb-3 dir-form-aviso"
            >
              {direccionApi.MENSAJE_FUERA_DE_ZONA}
            </Alert>
          )}

          {/* Iteración 6: región de resultados con estado unificado — el
              lector de pantalla anuncia los cambios (verificar → resultado). */}
          <div aria-live="polite">
            <ResultadoDireccion
              resultado={direccionApi.resultado}
              resumen={
                direccionApi.preview?.estado === 'unica'
                  ? direccionApi.preview.resultado.nomenclatura
                  : null
              }
              onReintentar={direccionApi.previsualizar}
              onEditar={direccionApi.editarDatos}
            />
          </div>

          {/* ===== Ubicación: de lo más general a lo más específico ===== */}
          <div className="dir-form-seccion">Ubicación</div>

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

          {/* ===== Dirección: calle y altura ===== */}
          <div className="dir-form-seccion">Dirección</div>

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
              <ListGroup className="mt-1 dir-form-sugerencias">
                {direccionApi.sugerencias.map((sugerencia) => (
                  <ListGroup.Item
                    key={sugerencia.id}
                    action
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      direccionApi.seleccionarSugerencia(sugerencia.nombre)
                    }
                  >
                    {/* La nomenclatura distingue calles repetidas entre
                        comunas/partidos (fix bug 3). */}
                    <div className="dir-form-sugerencia-nombre">
                      {sugerencia.nombre}
                    </div>
                    {sugerencia.nomenclatura && (
                      <div className="dir-form-sugerencia-detalle">
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

          {/* ===== Datos complementarios ===== */}
          <div className="dir-form-seccion">Datos complementarios</div>

          <Form.Group className="mb-3">
            <Form.Label>Alias</Form.Label>
            <Form.Control
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: Casa, Trabajo"
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

          {/* Paso de selección de coincidencias (componente compartido). */}
          {direccionApi.preview?.estado === 'ambigua' && (
            <OpcionesDireccionAmbigua
              opciones={direccionApi.preview.opciones}
              opcionElegida={direccionApi.opcionElegida}
              onElegir={direccionApi.elegirOpcion}
              onConfirmar={direccionApi.previsualizar}
            />
          )}

          {/* Confirmación (ficha validada). Solo cuando la cobertura está
              disponible: si está bloqueada, el estado unificado de arriba
              muestra el motivo (zona o sucursal) con la distancia. */}
          {direccionApi.preview?.estado === 'unica' &&
            !direccionApi.bloqueadaPorCobertura && (
              <div className="dir-form-confirmacion">
                <ConfirmacionDireccion
                  resultado={direccionApi.preview.resultado}
                  cobertura={direccionApi.preview.cobertura}
                  altura={direccionApi.altura}
                  codigoPostal={direccion?.codigoPostal}
                  referencia={referencia.trim() || null}
                  cargando={direccionApi.guardando}
                  textoConfirmar="Guardar dirección"
                  onConfirmar={direccionApi.confirmar}
                  onEditar={direccionApi.editarDatos}
                />
              </div>
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
