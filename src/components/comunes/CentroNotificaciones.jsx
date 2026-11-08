/**
 * Propósito: Drawer lateral del centro de notificaciones del CLIENTE.
 * Contenido: Componente CentroNotificaciones con filtros por tipo, listado,
 *            estados de carga/vacío/error y acciones de lectura.
 * Dependencias: react-router-dom (useNavigate), react-bootstrap (Offcanvas),
 *               react-icons/fa, useNotificacionesCentro, formatFechaRelativa,
 *               CentroNotificaciones.css.
 * Uso: <CentroNotificaciones /> — se monta una vez en el Navbar.
 *
 * Los datos ya vienen del backend (persistidos por usuario): este componente
 * sólo pinta y navega. Al tocar una notificación se marca leída y se abre el
 * detalle del pedido, donde vive también el hilo del reclamo.
 */

import { Offcanvas } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaBell,
  FaCheckDouble,
  FaExclamationCircle,
  FaInbox,
  FaReceipt,
} from 'react-icons/fa';
import { useNotificacionesCentro } from '../../hooks/useNotificacionesCentro';
import { formatFechaRelativa } from '../../utils/formatters';
import './CentroNotificaciones.css';

const ICONOS = {
  PEDIDO: FaReceipt,
  QUEJA: FaExclamationCircle,
  SISTEMA: FaBell,
};

const FILTROS = [
  { id: 'TODAS', etiqueta: 'Todas' },
  { id: 'PEDIDO', etiqueta: 'Pedidos' },
  { id: 'QUEJA', etiqueta: 'Reclamos' },
];

const CentroNotificaciones = () => {
  const {
    abierto,
    cerrar,
    items,
    noLeidas,
    total,
    filtro,
    paginas,
    pagina,
    cargando,
    cargandoMas,
    error,
    cambiarFiltro,
    cargarMas,
    marcarComoLeida,
    marcarTodas,
    recargar,
  } = useNotificacionesCentro();
  const navigate = useNavigate();

  const abrirNotificacion = async (notificacion) => {
    await marcarComoLeida(notificacion.id);
    cerrar();
    if (notificacion.pedidoId) {
      navigate(`/cliente/pedido/${notificacion.pedidoId}`);
    }
  };

  return (
    <Offcanvas
      show={abierto}
      onHide={cerrar}
      placement="end"
      className="centro-notificaciones"
      aria-labelledby="centro-notificaciones-titulo"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title
          id="centro-notificaciones-titulo"
          as="h2"
          className="centro-notif-titulo-cabecera"
        >
          Notificaciones
          {noLeidas > 0 && (
            <span className="centro-notif-contador" aria-hidden="true">
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="centro-notif-cuerpo">
        <div
          className="centro-notif-filtros"
          role="group"
          aria-label="Filtrar notificaciones"
        >
          {FILTROS.map((opcion) => (
            <button
              key={opcion.id}
              type="button"
              onClick={() => cambiarFiltro(opcion.id)}
              aria-pressed={filtro === opcion.id}
              className={`centro-notif-filtro${
                filtro === opcion.id ? ' centro-notif-filtro-activo' : ''
              }`}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>

        <div className="centro-notif-barra">
          <span className="centro-notif-resumen">
            {total === 0
              ? 'Sin novedades'
              : `${total} ${total === 1 ? 'notificación' : 'notificaciones'}`}
          </span>
          <button
            type="button"
            className="centro-notif-marcar"
            onClick={marcarTodas}
            disabled={noLeidas === 0}
          >
            <FaCheckDouble aria-hidden="true" />
            Marcar todas
          </button>
        </div>

        {cargando ? (
          <div className="centro-notif-esqueletos" aria-hidden="true">
            {[0, 1, 2].map((fila) => (
              <div key={fila} className="centro-notif-esqueleto">
                <span className="centro-notif-esqueleto-ico" />
                <span className="centro-notif-esqueleto-lineas">
                  <span />
                  <span />
                </span>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="centro-notif-vacio" role="alert">
            <FaExclamationCircle aria-hidden="true" />
            <p>{error}</p>
            <button type="button" className="btn btn-outline-primary" onClick={recargar}>
              Reintentar
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="centro-notif-vacio">
            <FaInbox aria-hidden="true" />
            <p>
              {filtro === 'TODAS'
                ? 'Todavía no tenés notificaciones.'
                : 'No hay notificaciones de este tipo.'}
            </p>
            <span>Te avisamos acá cuando tu pedido o tu reclamo avancen.</span>
          </div>
        ) : (
          <>
            <ul className="centro-notif-lista">
              {items.map((notificacion) => {
                const Icono = ICONOS[notificacion.tipo] || FaBell;
                return (
                  <li key={notificacion.id}>
                    <button
                      type="button"
                      onClick={() => abrirNotificacion(notificacion)}
                      className={`centro-notif-item${
                        notificacion.leida ? '' : ' centro-notif-item-nueva'
                      }`}
                    >
                      <span
                        className={`centro-notif-ico centro-notif-ico-${notificacion.tipo.toLowerCase()}`}
                        aria-hidden="true"
                      >
                        <Icono />
                      </span>
                      <span className="centro-notif-contenido">
                        <span className="centro-notif-fila-titulo">
                          <span className="centro-notif-titulo">
                            {notificacion.titulo}
                          </span>
                          {!notificacion.leida && (
                            <span
                              className="centro-notif-punto"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        {notificacion.mensaje && (
                          <span className="centro-notif-mensaje">
                            {notificacion.mensaje}
                          </span>
                        )}
                        <span className="centro-notif-fecha">
                          {formatFechaRelativa(notificacion.creadaEn)}
                          {!notificacion.leida && (
                            <span className="visually-hidden"> sin leer</span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {pagina < paginas && (
              <button
                type="button"
                className="centro-notif-mas"
                onClick={cargarMas}
                disabled={cargandoMas}
              >
                {cargandoMas ? 'Cargando…' : 'Ver más'}
              </button>
            )}
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default CentroNotificaciones;
