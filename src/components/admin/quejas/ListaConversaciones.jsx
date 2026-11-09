/**
 * Propósito: Columna izquierda de la bandeja de reclamos: búsqueda, filtros y
 *            lista de conversaciones con el último mensaje y los no respondidos.
 * Contenido: ListaConversaciones.
 * Dependencias: react-bootstrap (Badge, Button, Form), react-icons/fa,
 *               comunes/Avatar, comunes/Skeleton, utils/constants,
 *               utils/formatters y ./ayudas.
 * Uso: <ListaConversaciones ... /> dentro de BandejaQuejas.
 */

/* El proyecto no usa prop-types en ningún componente: se desactiva la regla
   para este archivo, igual que en el resto del codebase. */
/* eslint-disable react/prop-types */

import { Badge, Button, Form } from 'react-bootstrap';
import {
  FaChevronLeft,
  FaChevronRight,
  FaComments,
  FaEnvelope,
  FaSearch,
} from 'react-icons/fa';
import Avatar from '../../comunes/Avatar';
import { Skeleton } from '../../comunes/Skeleton';
import {
  ESTADOS_QUEJA,
  ETIQUETAS_ESTADO_QUEJA,
  ETIQUETAS_MOTIVO_QUEJA,
  VARIANTE_ESTADO_QUEJA,
} from '../../../utils/constants';
import { formatFechaRelativa } from '../../../utils/formatters';
import {
  LIMITE_CONVERSACIONES,
  contarSinResponder,
  nombreCliente,
  recortarTexto,
  ultimaActividad,
  ultimoMensaje,
} from './ayudas';

const FILTROS = [
  { valor: '', etiqueta: 'Todos' },
  ...Object.values(ESTADOS_QUEJA).map((valor) => ({
    valor,
    etiqueta: ETIQUETAS_ESTADO_QUEJA[valor],
  })),
];

const EsqueletoLista = () => (
  <div className="quejas-esqueleto" aria-hidden="true">
    {Array.from({ length: 6 }).map((_, indice) => (
      <div className="quejas-esqueleto-fila" key={indice}>
        <Skeleton ancho="42px" alto="42px" radio="50%" />
        <div className="quejas-esqueleto-texto">
          <Skeleton ancho="62%" alto="0.85rem" />
          <Skeleton ancho="88%" alto="0.75rem" />
          <Skeleton ancho="40%" alto="0.7rem" />
        </div>
      </div>
    ))}
  </div>
);

const ListaConversaciones = ({
  quejas,
  cargando,
  error,
  total,
  pagina,
  paginas,
  seleccionadaId,
  onSeleccionar,
  texto,
  onTextoChange,
  estado,
  onEstadoChange,
  sucursalId,
  onSucursalChange,
  sucursales,
  esSuperadmin,
  onLimpiarFiltros,
  onReintentar,
  onPaginaChange,
  sinResponderPagina,
  campoBusquedaId,
  campoSucursalId,
}) => {
  const hayFiltros = Boolean(texto.trim() || estado || sucursalId);
  const desde =
    total === 0 ? 0 : (pagina - 1) * LIMITE_CONVERSACIONES + 1;
  const hasta = Math.min(pagina * LIMITE_CONVERSACIONES, total);

  return (
    <>
      <div className="quejas-lista-cabecera">
        <div className="quejas-buscador">
          <FaSearch className="quejas-buscador-ico" aria-hidden="true" />
          <Form.Control
            id={campoBusquedaId}
            type="search"
            value={texto}
            onChange={(evento) => onTextoChange(evento.target.value)}
            placeholder="Buscar cliente o pedido"
            aria-label="Buscar por cliente o número de pedido"
            autoComplete="off"
          />
        </div>

        <div
          className="quejas-filtros"
          role="group"
          aria-label="Filtrar por estado"
        >
          {FILTROS.map((filtro) => (
            <button
              key={filtro.valor || 'todos'}
              type="button"
              className={`queja-chip ${
                estado === filtro.valor ? 'activo' : ''
              }`}
              aria-pressed={estado === filtro.valor}
              onClick={() => onEstadoChange(filtro.valor)}
            >
              {filtro.etiqueta}
            </button>
          ))}
        </div>

        {esSuperadmin && (
          <Form.Group className="quejas-sucursal" controlId={campoSucursalId}>
            <Form.Label className="visually-hidden">Sucursal</Form.Label>
            <Form.Select
              size="sm"
              value={sucursalId}
              onChange={(evento) => onSucursalChange(evento.target.value)}
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        )}

        <div className="quejas-lista-resumen">
          <span>
            {total} reclamo{total === 1 ? '' : 's'}
          </span>
          {sinResponderPagina > 0 && (
            <span
              className="quejas-resumen-sin-responder"
              title="Mensajes del cliente que esperan respuesta del negocio"
            >
              <FaEnvelope aria-hidden="true" />
              {sinResponderPagina} sin responder
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="quejas-lista-error" role="alert">
          <p className="mb-2">{error}</p>
          <Button size="sm" variant="outline-secondary" onClick={onReintentar}>
            Reintentar
          </Button>
        </div>
      )}

      {cargando ? (
        <div role="status">
          <span className="visually-hidden">Cargando reclamos…</span>
          <EsqueletoLista />
        </div>
      ) : quejas.length === 0 && !error ? (
        <div className="quejas-vacio">
          <FaComments className="quejas-vacio-ico" aria-hidden="true" />
          <p className="quejas-vacio-titulo">
            {hayFiltros ? 'No hay reclamos con estos filtros' : 'Todavía no hay reclamos'}
          </p>
          <p className="quejas-vacio-texto">
            {hayFiltros
              ? 'Probá con otro estado o buscá por otro cliente.'
              : 'Cuando un cliente reclame un pedido entregado, la conversación aparece acá.'}
          </p>
          {hayFiltros && (
            <Button size="sm" variant="outline-secondary" onClick={onLimpiarFiltros}>
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <ul className="quejas-lista" aria-label="Conversaciones de reclamos">
          {quejas.map((queja) => {
            const sinResponder = contarSinResponder(queja);
            const ultimo = ultimoMensaje(queja);
            const prefijo =
              ultimo && !ultimo.delCliente && !ultimo.esDetalle ? 'Vos: ' : '';
            const preview = `${prefijo}${ultimo ? ultimo.contenido : queja.detalle}`;
            const activa = queja.id === seleccionadaId;
            const cliente = queja.cliente;

            return (
              <li key={queja.id}>
                <button
                  type="button"
                  className={`queja-item ${activa ? 'activa' : ''} ${
                    sinResponder > 0 ? 'tiene-sin-responder' : ''
                  }`}
                  onClick={() => onSeleccionar(queja)}
                  aria-current={activa ? 'true' : undefined}
                >
                  <Avatar
                    nombre={cliente?.nombre}
                    apellido={cliente?.apellido}
                    size={42}
                  />
                  <span className="queja-item-cuerpo">
                    <span className="queja-item-fila">
                      <span className="queja-item-nombre">
                        {nombreCliente(cliente)}
                      </span>
                      <span className="queja-item-hora">
                        {formatFechaRelativa(ultimaActividad(queja))}
                      </span>
                    </span>

                    <span className="queja-item-fila">
                      <Badge
                        bg={VARIANTE_ESTADO_QUEJA[queja.estado] || 'secondary'}
                        className="queja-item-estado"
                      >
                        {ETIQUETAS_ESTADO_QUEJA[queja.estado] || queja.estado}
                      </Badge>
                      {sinResponder > 0 && (
                        <span
                          className="queja-item-sin-responder"
                          title={`${sinResponder} mensaje${
                            sinResponder === 1 ? '' : 's'
                          } sin responder`}
                        >
                          <FaEnvelope aria-hidden="true" />
                          {sinResponder}
                        </span>
                      )}
                    </span>

                    <span
                      className={`queja-item-preview ${
                        sinResponder > 0 ? 'destacado' : ''
                      }`}
                    >
                      {recortarTexto(preview)}
                    </span>

                    <span className="queja-item-meta">
                      <span className="queja-item-pedido">
                        #{queja.pedidoId}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {ETIQUETAS_MOTIVO_QUEJA[queja.motivo] || queja.motivo}
                      </span>
                      {esSuperadmin && queja.pedido?.sucursal?.nombre && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{queja.pedido.sucursal.nombre}</span>
                        </>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!cargando && total > 0 && (
        <div className="quejas-lista-pie">
          <span>
            {desde}–{hasta} de {total}
          </span>
          {paginas > 1 && (
            <div className="quejas-paginacion">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => onPaginaChange(pagina - 1)}
                disabled={pagina <= 1}
                aria-label="Página anterior"
              >
                <FaChevronLeft aria-hidden="true" />
              </Button>
              <span className="quejas-paginacion-numero">
                {pagina} / {paginas}
              </span>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => onPaginaChange(pagina + 1)}
                disabled={pagina >= paginas}
                aria-label="Página siguiente"
              >
                <FaChevronRight aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ListaConversaciones;
