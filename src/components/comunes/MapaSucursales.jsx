/**
 * Propósito: Mapa interactivo con las sucursales de Comi-Rapi (A5).
 *            Se muestra en el alta de dirección tras "Verificar dirección",
 *            en dos variantes: con cobertura (hasta 3 sucursales dentro del
 *            radio) o sin cobertura (la más cercana con su distancia).
 * Contenido: react-leaflet (MapContainer + TileLayer + Marker + Popup) con
 *            tiles de OpenStreetMap. Auto-centrado y auto-zoom a los markers.
 *            Todos los markers usan L.divIcon (emoji/pin HTML) para evitar
 *            el clásico problema de Leaflet + bundlers con los iconos PNG.
 * Dependencias: react-leaflet@4.x, leaflet@1.9.x (instaladas por A5).
 * Uso: <MapaSucursales sucursales={[{id, nombre, latitud, longitud,
 *        distanciaMetros?, destacada?}]} alturaPx={260} />
 */

import { useEffect } from "react";
import PropTypes from "prop-types";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Todos los markers son divIcon: cero dependencia de los PNG default de
// Leaflet (que rompen con Vite). La destacada es más grande y con filtro
// naranja; el resto, el mismo emoji más pequeño.
const iconoDestacada = L.divIcon({
  className: "mapa-sucursal-destacada",
  html: '<span class="mapa-sucursal-pin mapa-sucursal-pin-grande">🏪</span>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const iconoNormal = L.divIcon({
  className: "mapa-sucursal-normal",
  html: '<span class="mapa-sucursal-pin">📍</span>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

/**
 * Ajusta el mapa a los markers una sola vez (al montar). Necesita un
 * componente hijo porque useMap solo funciona dentro de MapContainer.
 */
function AjustarALosMarkers({ puntos }) {
  const map = useMap();
  useEffect(() => {
    if (!puntos || puntos.length === 0) return;
    if (puntos.length === 1) {
      map.setView([puntos[0].latitud, puntos[0].longitud], 15);
    } else {
      map.fitBounds(
        puntos.map((p) => [p.latitud, p.longitud]),
        { padding: [30, 30] },
      );
    }
  }, [map, puntos]);
  return null;
}

const MapaSucursales = ({
  sucursales = [],
  destacadaId = null,
  alturaPx = 260,
}) => {
  if (!sucursales || sucursales.length === 0) return null;

  const puntos = sucursales.filter((s) => s.latitud && s.longitud);
  if (puntos.length === 0) return null;

  const centro = [puntos[0].latitud, puntos[0].longitud];

  return (
    <div
      className="mapa-sucursales rounded-3 mt-2"
      style={{ height: `${alturaPx}px` }}
      role="img"
      aria-label={`Mapa con ${puntos.length} sucursal${puntos.length > 1 ? "es" : ""}`}
    >
      <MapContainer
        center={centro}
        zoom={13}
        style={{ height: "100%", borderRadius: "0.75rem" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AjustarALosMarkers puntos={puntos} />
        {puntos.map((s) => (
          <Marker
            key={s.id || s.nombre}
            position={[s.latitud, s.longitud]}
            icon={s.id === destacadaId ? iconoDestacada : iconoNormal}
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
  destacadaId: PropTypes.number,
  alturaPx: PropTypes.number,
};

AjustarALosMarkers.propTypes = {
  puntos: PropTypes.arrayOf(
    PropTypes.shape({
      latitud: PropTypes.number,
      longitud: PropTypes.number,
    }),
  ).isRequired,
};

export default MapaSucursales;
