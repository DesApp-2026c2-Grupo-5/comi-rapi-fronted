/**
 * Propósito: Formulario para crear o editar una sucursal usando Form de Bootstrap.
 * Contenido: Componente FormularioSucursal. Iteración 4: el nombre primero y
 *            la dirección ordenada de general a específico (Ubicación →
 *            Dirección → datos propios de la sucursal), con la cascada
 *            territorial, autocompletado de calles, avisos de zona y el flujo
 *            de preview (verificar → confirmar → guardar).
 * Dependencias: hooks/useDireccionTerritorial (lógica única),
 *            Autocomplete / OpcionesDireccionAmbigua / ConfirmacionDireccion,
 *            utils/territorio, FormularioAdmin.css (convención de dev).
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
import { FaTimes, FaMapMarkedAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { PROVINCIAS } from '../../utils/territorio';
import { useDireccionTerritorial } from '../../hooks/useDireccionTerritorial';
import { useParametros } from '../../hooks/useParametros';
import {
  crearHorarioPorDefecto,
  normalizarHorarios,
  tieneFranjas,
  validarHorarios,
} from '../../utils/horarios';
import Autocomplete from '../comunes/Autocomplete';
import OpcionesDireccionAmbigua from '../comunes/OpcionesDireccionAmbigua';
import ConfirmacionDireccion from '../comunes/ConfirmacionDireccion';
import ResultadoDireccion from '../comunes/ResultadoDireccion';
import EditorHorarios from './EditorHorarios';
import '../comunes/DireccionFormulario.css';
// Convención de dev (rediseño UI): estilos compartidos de formularios admin.
import './FormularioAdmin.css';

const FormularioSucursal = ({ sucursal, onGuardar }) => {
  const navigate = useNavigate();
  const { parametros } = useParametros();

  const [nombre, setNombre] = useState('');
  const [referencia, setReferencia] = useState('');
  const [horarios, setHorarios] = useState(() => crearHorarioPorDefecto());
  const [telefono, setTelefono] = useState('');
  const [activa, setActiva] = useState(true);

  const confirmarGuardado = async (datosDireccion) => {
    // El hook valida la dirección; el nombre y el horario son propios de la
    // sucursal. El horario se valida acá, en espejo del backend, para no
    // geocodificar de nuevo si lo único inválido es una franja.
    if (!nombre.trim()) {
      direccionApi.mostrarError('El nombre es obligatorio.');
      return;
    }
    if (!tieneFranjas(horarios)) {
      direccionApi.mostrarError(
        'Cargá al menos una franja de atención (para cerrar la sucursal usá el estado inactiva).',
      );
      return;
    }
    const { valido, errores } = validarHorarios(
      horarios,
      parametros.margenCierreMinutos,
    );
    if (!valido) {
      const dia = horarios.find(
        (d) => d.diaSemana === errores[0].diaSemana,
      );
      direccionApi.mostrarError(
        `Horario del ${dia?.dia.toLowerCase() || 'día'}: ${errores[0].mensaje}`,
      );
      return;
    }
    const datosSucursal = {
      nombre: nombre.trim(),
      direccion: {
        ...datosDireccion,
        referencia: referencia.trim() || null,
      },
      horarios: horarios.map((dia) => ({
        diaSemana: dia.diaSemana,
        franjas: dia.franjas,
      })),
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
    // Iteración 5/6: taxonomía del error (técnico vs funcional). El
    // administrador NO valida cobertura comercial: su preview y su guardado
    // no se bloquean por zona ni distancia (exigirCobertura false).
    const esTecnico =
      resultado && (resultado.status === undefined || resultado.status >= 500);
    direccionApi.mostrarError(
      (resultado && resultado.error) || 'No se pudo guardar la sucursal.',
      {
        tipo: esTecnico ? 'tecnico' : 'funcional',
        detalle: resultado && resultado.detalle,
      }
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
    // La API devuelve los siete días agrupados; una sucursal nueva arranca con
    // el horario por defecto (10:00 a 23:00 todos los días).
    setHorarios(
      sucursal
        ? normalizarHorarios(sucursal.horarios)
        : crearHorarioPorDefecto(),
    );
    setTelefono(sucursal?.telefono || '');
    setActiva(sucursal?.activa !== false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursal?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    direccionApi.previsualizar();
  };

  const handleCancelar = () => {
    navigate('/superadmin/sucursales');
  };

  return (
    <Card className="shadow-sm formulario-admin-card">
      <Card.Body>
        {/* Convención de dev: h3 con clase h5 (el <h1> de la página es el
            nivel superior). */}
        <h3 className="h5 mb-4">Datos de la sucursal</h3>
        <Form onSubmit={handleSubmit} noValidate>
          {(direccionApi.avisoFueraZona || direccionApi.avisoPartidoFueraZona) && (
            <Alert variant="warning" role="alert" className="mb-3 dir-form-aviso">
              {direccionApi.MENSAJE_FUERA_DE_ZONA}
            </Alert>
          )}

          {/* Iteración 6: región de resultados con estado unificado. El admin
              NO valida cobertura comercial (sin flag cobertura): los estados
              de cobertura-zona/sucursal solo podrían llegar del guardado. */}
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

          <Form.Group className="mb-3">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Sucursal Centro"
            />
          </Form.Group>

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
              min="0"
              value={direccionApi.altura}
              onChange={(e) => direccionApi.actualizarAltura(e.target.value)}
              placeholder="Ej: 123"
            />
          </Form.Group>

          {/* ===== Datos propios de la sucursal ===== */}
          <div className="dir-form-seccion">Operación</div>

          <Form.Group className="mb-3">
            <Form.Label>Referencia de la dirección</Form.Label>
            <Form.Control
              type="text"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: Frente a la plaza"
            />
          </Form.Group>

          <EditorHorarios
            horarios={horarios}
            onChange={setHorarios}
            margenMinutos={parametros.margenCierreMinutos}
            deshabilitado={direccionApi.guardando}
          />

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

          {/* Paso de selección de coincidencias (componente compartido). */}
          {direccionApi.preview?.estado === 'ambigua' && (
            <OpcionesDireccionAmbigua
              opciones={direccionApi.preview.opciones}
              opcionElegida={direccionApi.opcionElegida}
              onElegir={direccionApi.elegirOpcion}
              onConfirmar={direccionApi.previsualizar}
              name="opciones-direccion-sucursal"
            />
          )}

          {/* Confirmación de la resolución (componente compartido). */}
          {direccionApi.preview?.estado === 'unica' && (
            <div className="dir-form-confirmacion">
              <ConfirmacionDireccion
                resultado={direccionApi.preview.resultado}
                altura={direccionApi.altura}
                referencia={referencia.trim() || null}
                cargando={direccionApi.guardando}
                textoConfirmar="Guardar sucursal"
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

FormularioSucursal.propTypes = {
  /** Sucursal a editar; sin ella el formulario arranca vacío (alta). */
  sucursal: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nombre: PropTypes.string,
    telefono: PropTypes.string,
    activa: PropTypes.bool,
    direccion: PropTypes.shape({
      referencia: PropTypes.string,
    }),
    /** Horario agrupado por día que devuelve la API. */
    horarios: PropTypes.array,
  }),
  /** Crea o actualiza la sucursal; devuelve { ok, data } | { ok, error }. */
  onGuardar: PropTypes.func.isRequired,
};

export default FormularioSucursal;
