/**
 * Propósito: Mapa interactivo con las sucursales de Comi-Rapi (A5).
 *            Se muestra en el alta de dirección tras "Verificar dirección",
 *            en dos variantes: con cobertura (hasta 3 sucursales dentro del
 *            radio) o sin cobertura (la más cercana con su distancia).
 *            El punto de la dirección del cliente se marca con un círculo
 *            azul; todas las sucursales usan el mismo ícono (pin).
 * Contenido: react-leaflet (MapContainer + TileLayer + Marker + CircleMarker
 *            + Popup) con tiles de OpenStreetMap. Auto-centrado y auto-zoom.
 *            Todos los markers usan L.divIcon (emoji/pin HTML) para evitar
 *            el clásico problema de Leaflet + bundlers con los iconos PNG.
 * Dependencias: react-leaflet@4.x, leaflet@1.9.x (instaladas por A5).
 * Uso: <MapaSucursales sucursales={[...]} puntoCliente={{latitud, longitud}}
 *        alturaPx={260} />
 */

import { useEffect } from "react";
import PropTypes from "prop-types";
import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Ícono único para todas las sucursales (pin grande, mismo tamaño, misma
// imagen). Cero dependencia de los PNG default de Leaflet.
const iconoSucursal = L.divIcon({
  className: "mapa-sucursal-normal",
  html: '<span class="mapa-sucursal-pin">📍</span>',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

/**
 * Ajusta el mapa a los markers una sola vez (al montar). Necesita un
 * componente hijo porque useMap solo funciona dentro de MapContainer.
 * Incluye el punto del cliente en el fitBounds si está disponible.
 */
function AjustarALosMarkers({ puntos, puntoCliente }) {
  const map = useMap();
  useEffect(() => {
    const todos = [...puntos];
    if (puntoCliente) {
      todos.push(puntoCliente);
    }
    if (todos.length === 0) return;
    if (todos.length === 1) {
      map.setView([todos[0].latitud, todos[0].longitud], 15);
    } else {
      map.fitBounds(
        todos.map((p) => [p.latitud, p.longitud]),
        { padding: [40, 40] },
      );
    }
  }, [map, puntos, puntoCliente]);
  return null;
}

const MapaSucursales = ({
  sucursales = [],
  puntoCliente = null,
  alturaPx = 260,
}) => {
  if (!sucursales || sucursales.length === 0) return null;

  const puntos = sucursales.filter((s) => s.latitud && s.longitud);
  if (puntos.length === 0) return null;

  // Centro inicial: el punto del cliente si existe, sino la primera sucursal.
  const centro = puntoCliente
    ? [Number(puntoCliente.latitud), Number(puntoCliente.longitud)]
    : [puntos[0].latitud, puntos[0].longitud];

  return (
    <div
      className="mapa-sucursales rounded-3 mt-2"
      style={{ height: `${alturaPx}px` }}
      role="img"
      aria-label={`Mapa con ${puntos.length} sucursal${puntos.length > 1 ? "es" : ""}${puntoCliente ? " y tu dirección" : ""}`}
    >
      <MapContainer
        center={centro}
        zoom={13}
        style={{ height: "100%", borderRadius: "0.75rem" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <AjustarALosMarkers puntos={puntos} puntoCliente={puntoCliente} />

        {/* Círculo azul: la dirección del cliente. */}
        {puntoCliente && puntoCliente.latitud && puntoCliente.longitud && (
          <CircleMarker
            center={[
              Number(puntoCliente.latitud),
              Number(puntoCliente.longitud),
            ]}
            radius={12}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.5,
              weight: 3,
            }}
          >
            <Popup>
              <strong>Tu dirección</strong>
            </Popup>
          </CircleMarker>
        )}

        {/* Pines de sucursales: todas iguales (📍 mismo tamaño). */}
        {puntos.map((s) => (
          <Marker
            key={s.id || s.nombre}
            position={[s.latitud, s.longitud]}
            icon={iconoSucursal}
            zIndexOffset={1000}
          >
            <Popup>
              <strong>{s.nombre}</strong>
              {s.distanciaMetros !== undefined &&
                s.distanciaMetros !== null && (
                  <div className="small text-muted">
                    a {(s.distanciaMetros / 1000).toFixed(1)} km por ruta
                  </div>
                )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

MapaSucursales.propTypes = {
  sucursales: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      nombre: PropTypes.string,
      distanciaMetros: PropTypes.number,
      latitud: PropTypes.number,
      longitud: PropTypes.number,
    }),
  ),
  puntoCliente: PropTypes.shape({
    latitud: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    longitud: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  alturaPx: PropTypes.number,
};

AjustarALosMarkers.propTypes = {
  puntos: PropTypes.arrayOf(
    PropTypes.shape({
      latitud: PropTypes.number,
      longitud: PropTypes.number,
    }),
  ).isRequired,
  puntoCliente: PropTypes.shape({
    latitud: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    longitud: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
};

export default MapaSucursales;
