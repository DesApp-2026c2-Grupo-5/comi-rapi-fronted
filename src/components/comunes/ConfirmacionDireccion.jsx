/**
 * Propósito: Ficha de confirmación de la dirección validada:
 *            muestra solo 2 líneas compactas — la dirección completa (nomenclatura
 *            de Georef) y la sucursal que atiende — para ahorrar espacio vertical
 *            en el wizard. El mapa se renderiza debajo si hay cobertura.
 * Contenido: Componente presentacional puro; la lógica vive en
 *            useDireccionTerritorial (única fuente).
 * Dependencias: react-bootstrap (Alert, Button), react-icons/fa.
 * Uso: <ConfirmacionDireccion resultado={...} cobertura={...} referencia={...}
 *        cargando={false} textoConfirmar="Guardar dirección" onConfirmar={fn}
 *        onEditar={fn} />
 */

import { Alert, Button } from "react-bootstrap";
import { FaSave, FaEdit, FaStore, FaCheckCircle } from "react-icons/fa";
import MapaSucursales from "./MapaSucursales";
import "./MapaSucursales.css";

const ConfirmacionDireccion = ({
  resultado,
  cobertura = null,
  referencia = null,
  cargando = false,
  textoConfirmar = "Guardar",
  onConfirmar,
  onEditar,
  mostrarMapa = true,
  mostrarAcciones = true,
}) => {
  if (!resultado) {
    return null;
  }

  return (
    <Alert
      variant="success"
      role="status"
      className="mb-3 dir-form-confirmacion"
    >
      <div className="d-flex align-items-center gap-2 mb-2 fw-semibold">
        <FaCheckCircle aria-hidden="true" />
        Dirección validada
      </div>

      {/* 1) Dirección completa en una sola línea (nomenclatura de Georef) */}
      <div className="fw-medium mb-2 dir-form-nomenclatura">
        {resultado.nomenclatura}
      </div>

      {/* 2) Sucursal que atiende (si hay cobertura) */}
      {cobertura && cobertura.coberturaDisponible && (
        <div className="small mb-2 d-flex align-items-center gap-2 text-success">
          <FaStore aria-hidden="true" />
          Tu sucursal más cercana es{" "}
          <strong>{cobertura.sucursal?.nombre}</strong> (
          {(cobertura.sucursal?.distanciaMetros / 1000).toFixed(1)} km por ruta)
        </div>
      )}

      {/* Referencia opcional (solo si el usuario la ingresó) */}
      {referencia && referencia.trim() && (
        <div className="small text-muted mb-2">
          <strong>Referencia:</strong> {referencia.trim()}
        </div>
      )}

      {/* Mapa con sucursales en cobertura */}
      {mostrarMapa &&
        cobertura &&
        cobertura.coberturaDisponible &&
        Array.isArray(cobertura.sucursales) &&
        cobertura.sucursales.length > 0 && (
          <MapaSucursales
            sucursales={cobertura.sucursales}
            puntoCliente={
              resultado.latitud && resultado.longitud
                ? { latitud: resultado.latitud, longitud: resultado.longitud }
                : null
            }
            alturaPx={240}
            alturaMobilePx={160}
          />
        )}

      {mostrarAcciones && (
        <div className="d-flex gap-2 mt-3">
          <Button
            variant="primary"
            className="rounded-pill px-4"
            onClick={onConfirmar}
            disabled={cargando}
          >
            <FaSave className="me-1" aria-hidden="true" />
            {cargando ? "Guardando…" : textoConfirmar}
          </Button>
          <Button
            variant="outline-secondary"
            className="rounded-pill px-4"
            onClick={onEditar}
            disabled={cargando}
          >
            <FaEdit className="me-1" aria-hidden="true" />
            Editar datos
          </Button>
        </div>
      )}
    </Alert>
  );
};

export default ConfirmacionDireccion;