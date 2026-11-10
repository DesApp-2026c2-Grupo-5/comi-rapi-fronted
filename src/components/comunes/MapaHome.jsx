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
import { createStorePillIcon, getShortNameForPin } from './mapIcons';
import { setupCtrlZoom, formatearHorarios } from './mapUtils';
import MapErrorBoundary from './MapErrorBoundary';
import './map-markers.css';
import './map-container.css';

/**
 * Formatea la dirección anidada del backend como string legible.
 * El backend devuelve: { calle, altura, provincia, departamento?, localidad?, codigoPostal?, referencia? }
 */
const formatearDireccion = (direccion) => {
  if (!direccion) return '';
  const partes = [];
  if (direccion.calle && direccion.altura) {
    partes.push(`${direccion.calle} ${direccion.altura}`);
  } else if (direccion.calle) {
    partes.push(direccion.calle);
  }
  if (direccion.provincia) partes.push(direccion.provincia);
  if (direccion.departamento) partes.push(direccion.departamento);
  if (direccion.localidad) partes.push(direccion.localidad);
  if (direccion.codigoPostal) partes.push(direccion.codigoPostal);
  return partes.join(', ');
};

/**
 * Mapa principal - Home con sucursales
 * Fix: Elimina AjusteInicial problemático, usa whenCreated + LayerGroup
 * Fix: Ctrl+Scroll zoom robusto
 */
const MapaHome = ({
  sucursales = [],
  alturaPx = 400,
}) => {
  const { temaResuelto } = useTema();
  const esOscuro = temaResuelto === 'oscuro';
  const mapRef = useRef(null);
  const ctrlZoomCleanupRef = useRef(null);

  // Configurar Ctrl+Zoom al montar el mapa - SIEMPRE PRIMERO (Rules of Hooks)
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

  // Validaciones DESPUÉS de los hooks (Rules of Hooks)
  if (!sucursales || sucursales.length === 0) return null;

  // Filtrar solo activas y con coordenadas
  const puntos = sucursales.filter((s) => s.latitud && s.longitud && s.activa !== false);
  if (puntos.length === 0) return null;

  // Centro inicial: bounds de todas las sucursales
  const centro = puntos.length === 1
    ? [puntos[0].latitud, puntos[0].longitud]
    : [puntos[0].latitud, puntos[0].longitud];

  // Stadia Maps: Alidade Smooth (claro) / Alidade Smooth Dark (oscuro)
  const estilo = esOscuro ? 'alidade_smooth_dark' : 'alidade_smooth';
  const stadiaKey = import.meta.env.VITE_STADIA_API_KEY || '';
  const tileUrl = stadiaKey
    ? `https://tiles.stadiamaps.com/tiles/${estilo}/{z}/{x}/{y}{r}.png?api_key=${stadiaKey}`
    : `https://tiles.stadiamaps.com/tiles/${estilo}/{z}/{x}/{y}{r}.png`;

  return (
    <MapErrorBoundary>
      <div className="comi-map-wrapper">
        <div 
          className="map-container comi-map animate-fade-in-up"
          style={{ height: `${alturaPx}px`, width: '100%' }}
          role="img"
          aria-label={`Mapa con ${puntos.length} sucursal${puntos.length > 1 ? "es" : ""} activas`}
        >
          <MapContainer
            ref={mapRef}
            center={centro}
            zoom={12}
            style={{ height: "100%", width: "100%", borderRadius: "12px" }}
            scrollWheelZoom={false}
            whenCreated={(map) => {
              // Fit bounds inicial SOLO al montar (whenCreated se ejecuta una sola vez)
              if (puntos.length > 0) {
                if (puntos.length === 1) {
                  map.setView([puntos[0].latitud, puntos[0].longitud], 13);
                } else {
                  map.fitBounds(
                    puntos.map((p) => [p.latitud, p.longitud]),
                    { padding: [40, 40], maxZoom: 15 }
                  );
                }
              }
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url={tileUrl}
              subdomains="abcd"
              maxZoom={20}
            />

            {/* LayerGroup para agrupar marcadores - evita bugs al hacer fitBounds con popups abiertos */}
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
                      {s.direccion && <div className="comi-popup-row">{formatearDireccion(s.direccion)}</div>}
                      {s.telefono && <div className="comi-popup-row">{s.telefono}</div>}
                      {s.horarios && <div className="comi-popup-row">{formatearHorarios(s.horarios)}</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
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

MapaHome.propTypes = {
  sucursales: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      nombre: PropTypes.string,
      categoria: PropTypes.string,
      direccion: PropTypes.shape({
        calle: PropTypes.string,
        altura: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        provincia: PropTypes.string,
        departamento: PropTypes.string,
        localidad: PropTypes.string,
        codigoPostal: PropTypes.string,
        referencia: PropTypes.string,
      }),
      telefono: PropTypes.string,
      horarios: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
      latitud: PropTypes.number,
      longitud: PropTypes.number,
      activa: PropTypes.bool,
    }),
  ),
  alturaPx: PropTypes.number,
};

export default MapaHome;