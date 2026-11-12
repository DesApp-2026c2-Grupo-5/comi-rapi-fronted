/**
 * Propósito: Formulario para crear o editar una dirección de cliente.
 * Contenido: Wizard de 2 pasos dentro de un modal (Dirección → Datos extra)
 *            con verificación territorial, mapa de cobertura y confirmación
 *            antes de guardar.
 * Dependencias: hooks/useDireccionTerritorial (lógica única), ModalBase,
 *            Autocomplete / OpcionesDireccionAmbigua / ResultadoDireccion /
 *            ConfirmacionDireccion (presentacionales compartidos).
 * Uso: <FormularioDireccion mostrar direccion={direccion}
 *        onGuardar={handler} onCerrar={handler} />
 *      - Si 'direccion' es null/undefined, se comporta en modo creación.
 *      - onGuardar DEBE devolver el resultado del backend:
 *        { ok: true, data } | { ok: false, error, opciones? }.
 */

/* El proyecto no tiene la dependencia "prop-types"; se desactiva la regla
   para este componente presentacional. */
/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { Form, Button, Alert, ListGroup, Spinner } from "react-bootstrap";
import {
  FaMapMarkedAlt,
  FaSave,
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaCheckCircle,
  FaStore,
} from "react-icons/fa";
import { useDireccionTerritorial } from "../../hooks/useDireccionTerritorial";
import ModalBase from "../comunes/ModalBase";
import Autocomplete from "../comunes/Autocomplete";
import OpcionesDireccionAmbigua from "../comunes/OpcionesDireccionAmbigua";
import ConfirmacionDireccion from "../comunes/ConfirmacionDireccion";
import ResultadoDireccion from "../comunes/ResultadoDireccion";
import "../comunes/DireccionFormulario.css";
import "./FormularioDireccion.css";

const PASOS = [
  { numero: 1, etiqueta: "Dirección" },
  { numero: 2, etiqueta: "Datos extra" },
];

const FormularioDireccion = ({
  mostrar = true,
  direccion,
  onGuardar,
  onCerrar,
}) => {
  const [paso, setPaso] = useState(1);
  const [alias, setAlias] = useState("");
  const [referencia, setReferencia] = useState("");
  const [erroresPaso, setErroresPaso] = useState([]);
  const resultadoRef = useRef(null);
  const confirmacionRef = useRef(null);
  const inicioRef = useRef(null);

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
    if (
      resultado &&
      Array.isArray(resultado.opciones) &&
      resultado.opciones.length
    ) {
      direccionApi.mostrarOpcionesExternas(resultado.opciones);
      setPaso(1);
      return;
    }
    const esTecnico =
      resultado && (resultado.status === undefined || resultado.status >= 500);
    direccionApi.mostrarError(
      (resultado && resultado.error) || "No se pudo guardar la dirección.",
      {
        tipo: esTecnico ? "tecnico" : "funcional",
        detalle: resultado && resultado.detalle,
      },
    );
    setPaso(1);
  };

  const direccionApi = useDireccionTerritorial({
    inicial: direccion,
    onConfirmado: confirmarGuardado,
    validarCobertura: true,
    filtrarPorSucursales: true,
  });

  const direccionVerificada =
    direccionApi.preview?.estado === "unica" &&
    !direccionApi.bloqueadaPorCobertura;

  useEffect(() => {
    if (direccionApi?.resultado && resultadoRef.current) {
      resultadoRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [direccionApi?.resultado]);

  useEffect(() => {
    if (direccionVerificada && confirmacionRef.current) {
      confirmacionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [direccionVerificada]);

  useEffect(() => {
    if (paso === 2) {
      inicioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [paso]);

  useEffect(() => {
    setAlias(direccion?.alias || "");
    setReferencia(direccion?.referencia || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direccion?.id]);

  const limpiarErrores = () => setErroresPaso([]);

  const verificarDireccion = async () => {
    const errores = direccionApi.validar();
    if (errores.length > 0) {
      setErroresPaso(errores);
      return;
    }
    limpiarErrores();
    await direccionApi.previsualizar();
  };

  const verificarOpcion = async () => {
    limpiarErrores();
    await direccionApi.previsualizar();
  };

  const volverADireccion = () => {
    limpiarErrores();
    setPaso(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paso === 1) {
      if (direccionVerificada) {
        setPaso(2);
        return;
      }
      verificarDireccion();
      return;
    }
    direccionApi.confirmar();
  };

  const textoBotonPrincipal = () => {
    if (paso === 1) {
      if (direccionApi.preview?.estado === "ambigua") {
        return direccionApi.opcionElegida
          ? "Verificar opción"
          : "Elegí una opción";
      }
      return direccionVerificada ? "Continuar" : "Verificar dirección";
    }
    return "Guardar dirección";
  };

  const botonPrincipalDeshabilitado =
    direccionApi.cargandoPreview ||
    direccionApi.guardando ||
    (paso === 1 &&
      (direccionApi.territorioVacio ||
        (direccionApi.preview?.estado === "ambigua" &&
          !direccionApi.opcionElegida)));

  const iconoBotonPrincipal = () => {
    if (paso === 2) return <FaSave className="me-1" aria-hidden="true" />;
    if (direccionVerificada) {
      return <FaArrowRight className="me-1" aria-hidden="true" />;
    }
    return <FaMapMarkedAlt className="me-1" aria-hidden="true" />;
  };

  const footer = (
    <div className="direccion-wizard-footer">
      <span className="direccion-wizard-footer-paso">
        Paso {paso} de {PASOS.length}
      </span>
      <div className="direccion-wizard-footer-acciones">
        {paso === 1 ? (
          <>
            <Button
              variant="outline-secondary"
              type="button"
              onClick={onCerrar}
              disabled={direccionApi.guardando}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={botonPrincipalDeshabilitado}
            >
              {direccionApi.cargandoPreview ? (
                <>
                  <Spinner size="sm" className="me-1" animation="border" />
                  Verificando…
                </>
              ) : (
                <>
                  {iconoBotonPrincipal()}
                  {textoBotonPrincipal()}
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline-secondary"
              type="button"
              onClick={volverADireccion}
              disabled={direccionApi.guardando}
            >
              <FaArrowLeft className="me-1" aria-hidden="true" />
              Atrás
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={botonPrincipalDeshabilitado}
            >
              {direccionApi.guardando ? (
                <>
                  <Spinner size="sm" className="me-1" animation="border" />
                  Guardando…
                </>
              ) : (
                <>
                  <FaSave className="me-1" aria-hidden="true" />
                  Guardar dirección
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <ModalBase
      mostrar={mostrar}
      onCerrar={onCerrar}
      titulo={direccion ? "Editar dirección" : "Nueva dirección"}
      descripcion="Completá los datos en dos pasos."
      variante="fullscreen-mobile"
      tamano="lg"
      cargando={direccionApi.guardando}
      onSubmit={handleSubmit}
      noValidate
      bodyClassName="direccion-wizard-modal-body"
      footer={footer}
    >
      <div ref={inicioRef} />

      <ol className="direccion-wizard-pasos" aria-label="Progreso del formulario">
        {PASOS.map((item) => (
          <li
            key={item.numero}
            className={`direccion-wizard-paso${
              paso === item.numero ? " activo" : ""
            }${paso > item.numero ? " completado" : ""}`}
            aria-current={paso === item.numero ? "step" : undefined}
          >
            <span className="direccion-wizard-paso-numero">
              {paso > item.numero ? (
                <FaCheck aria-hidden="true" />
              ) : (
                item.numero
              )}
            </span>
            <span className="direccion-wizard-paso-texto">{item.etiqueta}</span>
          </li>
        ))}
      </ol>

      <div className="direccion-wizard-cuerpo">
        {(direccionApi.avisoFueraZona ||
          direccionApi.avisoPartidoFueraZona) && (
          <Alert variant="warning" role="alert" className="mb-3 dir-form-aviso">
            {direccionApi.MENSAJE_FUERA_DE_ZONA}
          </Alert>
        )}

        {erroresPaso.length > 0 && (
          <Alert variant="danger" role="alert" className="mb-3">
            <ul className="mb-0 ps-3">
              {erroresPaso.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {paso === 1 && (
          <>
            <div aria-live="polite" ref={resultadoRef}>
              <ResultadoDireccion
                resultado={direccionApi.resultado}
                resumen={
                  direccionApi.preview?.estado === "unica"
                    ? direccionApi.preview.resultado?.nomenclatura
                    : null
                }
                onReintentar={verificarOpcion}
                onEditar={direccionApi.editarDatos}
              />
            </div>

            <div className="dir-form-seccion">Ubicación</div>

            {direccionApi.territorioVacio && (
              <Alert variant="info" role="alert" className="mb-3">
                Por el momento no hay sucursales activas para tomar delivery:
                probá de nuevo más tarde.
              </Alert>
            )}

            <Autocomplete
              etiqueta="Provincia *"
              value={direccionApi.provincia}
              opciones={direccionApi.provinciasOpts}
              onChange={direccionApi.actualizarProvincia}
              placeholder="Escribí para buscar tu provincia…"
              ayudaOpcional="Solo ofrecemos zonas con sucursales activas."
            />

            {direccionApi.provincia && (
              <Autocomplete
                etiqueta={
                  direccionApi.requierePartido ? (
                    "Partido *"
                  ) : (
                    <>
                      Partido / Comuna{" "}
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

            <div className="dir-form-seccion">Dirección</div>

            <Form.Group className="mb-3">
              <Form.Label>Calle *</Form.Label>
              <Form.Control
                type="text"
                value={direccionApi.calle}
                onChange={(e) =>
                  direccionApi.actualizarCalle(e.target.value)
                }
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
                onChange={(e) =>
                  direccionApi.actualizarAltura(e.target.value)
                }
                placeholder="Ej: 1234"
                min="0"
                step="1"
              />
            </Form.Group>

            {direccionApi.preview?.estado === "ambigua" && (
              <OpcionesDireccionAmbigua
                opciones={direccionApi.preview.opciones}
                opcionElegida={direccionApi.opcionElegida}
                onElegir={direccionApi.elegirOpcion}
                onConfirmar={verificarOpcion}
              />
            )}

            {direccionVerificada && (
              <div className="dir-form-confirmacion" ref={confirmacionRef}>
                <ConfirmacionDireccion
                  resultado={direccionApi.preview.resultado}
                  cobertura={direccionApi.preview.cobertura}
                  altura={direccionApi.altura}
                  codigoPostal={direccion?.codigoPostal}
                  referencia={referencia.trim() || null}
                  cargando={direccionApi.guardando}
                  mostrarAcciones={false}
                />
              </div>
            )}
          </>
        )}

        {paso === 2 && (
          <>
            <div className="dir-form-seccion">Datos extra</div>

            {direccionVerificada && (
              <Alert
                variant="success"
                role="status"
                className="dir-form-resumen mb-3 py-2"
              >
                <div className="fw-semibold d-flex align-items-center gap-2">
                  <FaCheckCircle aria-hidden="true" />
                  Dirección validada
                </div>
                <div className="small">
                  {direccionApi.preview?.resultado?.nomenclatura}
                </div>
                {direccionApi.preview?.cobertura?.coberturaDisponible && (
                  <div className="small d-flex align-items-center gap-1">
                    <FaStore className="text-success" aria-hidden="true" />
                    Sucursal:{" "}
                    <strong>
                      {direccionApi.preview.cobertura.sucursal?.nombre}
                    </strong>
                  </div>
                )}
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

            <Form.Group className="mb-0">
              <Form.Label>Referencia</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej: Casa verde, 2da puerta"
              />
            </Form.Group>
          </>
        )}
      </div>
    </ModalBase>
  );
};

export default FormularioDireccion;
