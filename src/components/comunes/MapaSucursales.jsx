import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayerGroup,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTema } from '../../hooks/useTema';
import { createStorePillIcon, clientPulseIcon, getShortNameForPin } from './mapIcons';
import { setupCtrlZoom, formatearDireccion } from './mapUtils';
import MapErrorBoundary from './MapErrorBoundary';
import './map-markers.css';
import './map-container.css';

/**
 * Mapa para gestión de sucursales y dirección del cliente
 * Fix: Elimina AjusteInicial problemático, usa whenCreated + LayerGroup
 * Fix: Ctrl+Scroll zoom robusto
 * Dot + Pulse Aura para dirección cliente
 */
const MapaSucursales = ({
  sucursales = [],
  puntoCliente = null,
  alturaPx = 260,
}) => {
  const { temaResuelto } = useTema();
  const esOscuro = temaResuelto === 'oscuro';
  const mapRef = useRef(null);
  const ctrlZoomCleanupRef = useRef(null);

  if (!sucursales || sucursales.length === 0) return null;

  const puntos = sucursales.filter((s) => s.latitud && s.longitud);
  if (puntos.length === 0) return null;

  // Centro inicial: el punto del cliente si existe, sino la primera sucursal.
  const centro = puntoCliente
    ? [Number(puntoCliente.latitud), Number(puntoCliente.longitud)]
    : [puntos[0].latitud, puntos[0].longitud];

  // Stadia Maps: Alidade Smooth (claro) / Alidade Smooth Dark (oscuro)
  const estilo = esOscuro ? 'alidade_smooth_dark' : 'alidade_smooth';
  const stadiaKey = import.meta.env.VITE_STADIA_API_KEY || '';
  const tileUrl = stadiaKey
    ? `https://tiles.stadiamaps.com/tiles/${estilo}/{z}/{x}/{y}{r}.png?api_key=${stadiaKey}`
    : `https://tiles.stadiamaps.com/tiles/${estilo}/{z}/{x}/{y}{r}.png`;

  // Configurar Ctrl+Zoom al montar el mapa
  useEffect(() => {
    if (mapRef.current?.leafletElement) {
      ctrlZoomCleanupRef.current = setupCtrlZoom(mapRef.current.leafletElement, true);
    }
    return () => {
      if (ctrlZoomCleanupRef.current) {
        ctrlZoomCleanupRef.current();
        ctrlZoomCleanupRef.current = null;
      }
    };
  }, []);

  return (
    <MapErrorBoundary>
      <div className="comi-map-wrapper">
        <div 
          className="map-container mapa-sucursales comi-map animate-fade-in-up"
          style={{ height: `${alturaPx}px`, width: '100%' }}
          role="img"
          aria-label={`Mapa con ${puntos.length} sucursal${puntos.length > 1 ? "es" : ""}${puntoCliente ? " y tu dirección" : ""}`}
        >
          <MapContainer
            ref={mapRef}
            center={centro}
            zoom={13}
            style={{ height: "100%", width: "100%", borderRadius: "12px" }}
            scrollWheelZoom={false}
            whenCreated={(map) => {
              const todos = [...puntos];
              if (puntoCliente) todos.push(puntoCliente);
              if (todos.length === 0) return;

              if (todos.length === 1) {
                map.setView([todos[0].latitud, todos[0].longitud], 15);
              } else {
                map.fitBounds(
                  todos.map((p) => [p.latitud, p.longitud]),
                  { padding: [40, 40], maxZoom: 15 }
                );
              }
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={tileUrl}
              subdomains="abcd"
              maxZoom={20}
            />

            {/* LayerGroup para sucursales - evita bugs al hacer fitBounds con popups abiertos */}
            <LayerGroup>
              {puntos.map((s) => (
                <Marker
                  key={s.id || s.nombre}
                  position={[s.latitud, s.longitud]}
                  icon={createStorePillIcon(getShortNameForPin(s.nombre))}
                  zIndexOffset={1000}
                >
                  <Popup>
                    <div className="comi-popup">
                      <strong>{s.nombre}</strong>
                      {s.distanciaMetros !== undefined &&
                        s.distanciaMetros !== null && (
                          <div className="comi-popup-row">
                            {(s.distanciaMetros / 1000).toFixed(1)} km por ruta
                          </div>
                        )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>

            {/* Dot + Pulse Aura: la dirección del cliente (fuera del LayerGroup para z-index superior) */}
            {puntoCliente && puntoCliente.latitud && puntoCliente.longitud && (
              <Marker
                position={[
                  Number(puntoCliente.latitud),
                  Number(puntoCliente.longitud),
                ]}
                icon={clientPulseIcon}
                zIndexOffset={2000}
              >
                <Popup>
                  <div className="comi-popup">
                    <strong>Tu dirección</strong>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* Zoom hint */}
          <div className="comi-zoom-hint">
            Mantené Ctrl + ruedita para zoom
          </div>
        </div>
      </div>
      </MapErrorBoundary>
    );
};

MapaSucursales.propTypes = {
  sucursales: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      nombre: PropTypes.string,
      categoria: PropTypes.string,
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

export default MapaSucursales;