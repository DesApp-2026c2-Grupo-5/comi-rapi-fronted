/**
 * Propósito: Bandeja de reclamos tipo chat para ADMINISTRADOR y
 *            SUPERADMINISTRADOR: lista de conversaciones + hilo + compositor.
 * Contenido: BandejaQuejas, que orquesta datos, filtros, socket y envío.
 * Dependencias: react, react-bootstrap (Button), react-icons/fa, api/quejas,
 *               useAuth, services/socket, hooks/queries, hooks/useSucursal,
 *               utils/constants, ListaConversaciones, ConversacionQueja,
 *               BandejaQuejas.css.
 * Uso: <BandejaQuejas /> - Se renderiza en GestionQuejas.
 */

import { useEffect, useId, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from 'react-bootstrap';
import { FaComments, FaSyncAlt } from 'react-icons/fa';
import {
  actualizarQueja,
  enviarMensajeQueja,
} from '../../api/quejas';
import { useAuth } from '../../hooks/useAuth';
import { useSucursal } from '../../hooks/useSucursal';
import { useQuejasQuery } from '../../hooks/queries';
import { conectarSocket, EVENTOS_SOCKET } from '../../services/socket';
import { ROLES } from '../../utils/constants';
import ListaConversaciones from './quejas/ListaConversaciones';
import ConversacionQueja from './quejas/ConversacionQueja';
import { LIMITE_CONVERSACIONES, contarSinResponder } from './quejas/ayudas';
import './quejas/BandejaQuejas.css';

const BandejaQuejas = () => {
  const { user } = useAuth();
  const esSuperadmin = user?.rol === ROLES.SUPERADMIN;
  // La lista de sucursales sale del contexto (una sola consulta/caché para toda
  // la app). Antes esta pantalla hacía su propio GET al montar, duplicando la
  // lectura que ya hace SucursalProvider.
  const { sucursalesCercanas: sucursales } = useSucursal();
  const queryClient = useQueryClient();
  const campoBusquedaId = useId();
  const campoSucursalId = useId();

  const [texto, setTexto] = useState('');
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [pagina, setPagina] = useState(1);
  const [seleccionada, setSeleccionada] = useState(null);

  // TanStack Query hook para la bandeja de quejas
  const {
    data: quejasData,
    isLoading: cargando,
    error: errorQuery,
  } = useQuejasQuery({
    estado,
    q,
    sucursalId: esSuperadmin ? sucursalId : undefined,
    pagina,
    limite: LIMITE_CONVERSACIONES,
    enabled: true,
  });

  const quejas = quejasData?.items || [];
  const total = quejasData?.meta?.total || 0;
  const paginas = quejasData?.meta?.paginas || 0;
  const error = errorQuery?.message || '';

  // Socket para actualizaciones en tiempo real
  useEffect(() => {
    const socket = conectarSocket();
    const alActualizar = () => {
      queryClient.invalidateQueries({ queryKey: ['private', 'quejas'] });
    };
    socket.on(EVENTOS_SOCKET.QUEJA_ACTUALIZADA, alActualizar);
    return () => socket.off(EVENTOS_SOCKET.QUEJA_ACTUALIZADA, alActualizar);
  }, [queryClient]);

  // Búsqueda con debounce: escribir no dispara una petición por tecla.
  useEffect(() => {
    const limpio = texto.trim();
    if (limpio === q) return undefined;
    const timeout = setTimeout(() => {
      setQ(limpio);
      setPagina(1);
    }, 350);
    return () => clearTimeout(timeout);
  }, [texto, q]);

  // Recargar al cambiar filtros/página: la queryKey cambia y TanStack Query lo hace automáticamente.
  // El `recarga` manual ya no es necesario; se usa invalidateQueries en el socket.

  const limpiarFiltros = useCallback(() => {
    setTexto('');
    setQ('');
    setEstado('');
    setSucursalId('');
    setPagina(1);
  }, []);

  const enviar = useCallback(async ({ contenido, estado: estadoNuevo }) => {
    if (!seleccionada) return { ok: false, error: 'No hay un reclamo abierto.' };

    const res = estadoNuevo
      ? await actualizarQueja(seleccionada.id, {
          estado: estadoNuevo,
          respuesta: contenido || undefined,
        })
      : await enviarMensajeQueja(seleccionada.id, contenido);

    if (!res.success) {
      return {
        ok: false,
        error: res.error || 'No se pudo enviar el mensaje.',
      };
    }

    // Actualización optimista en caché
    queryClient.setQueryData(
      ['private', 'quejas', 'bandeja'],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((queja) =>
            queja.id === res.data.id ? res.data : queja
          ),
        };
      }
    );

    setSeleccionada(res.data);
    return { ok: true };
  }, [seleccionada, queryClient]);

  const sinResponderPagina = quejas.reduce(
    (totalParcial, queja) => totalParcial + contarSinResponder(queja),
    0,
  );

  return (
    <>
      <div className="quejas-cabecera">
        <div>
          <h1 className="h4 mb-1">Reclamos</h1>
          <p className="text-muted mb-0">
            {esSuperadmin
              ? 'Conversaciones de todos los reclamos del negocio.'
              : 'Conversaciones de los reclamos de tu sucursal.'}
          </p>
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['private', 'quejas'] })}
          disabled={cargando}
          aria-label="Actualizar reclamos"
          title="Actualizar"
        >
          <FaSyncAlt
            className={`me-1 ${cargando ? 'quejas-girando' : ''}`}
            aria-hidden="true"
          />
          <span className="quejas-btn-texto">Actualizar</span>
        </Button>
      </div>

      <div className="quejas-panel">
        <aside
          className={`quejas-lista-panel ${
            seleccionada ? 'quejas-oculta-movil' : ''
          }`}
        >
          <ListaConversaciones
            quejas={quejas}
            cargando={cargando}
            error={error}
            total={total}
            pagina={pagina}
            paginas={paginas}
            seleccionadaId={seleccionada?.id}
            onSeleccionar={setSeleccionada}
            texto={texto}
            onTextoChange={setTexto}
            estado={estado}
            onEstadoChange={(valor) => {
              setEstado(valor);
              setPagina(1);
            }}
            sucursalId={sucursalId}
            onSucursalChange={(valor) => {
              setSucursalId(valor);
              setPagina(1);
            }}
            sucursales={sucursales}
            esSuperadmin={esSuperadmin}
            onLimpiarFiltros={limpiarFiltros}
            onReintentar={() => queryClient.invalidateQueries({ queryKey: ['private', 'quejas'] })}
            onPaginaChange={setPagina}
            sinResponderPagina={sinResponderPagina}
            campoBusquedaId={campoBusquedaId}
            campoSucursalId={campoSucursalId}
          />
        </aside>

        <section
          className={`quejas-conversacion-panel ${
            seleccionada ? '' : 'quejas-oculta-movil'
          }`}
        >
          {seleccionada ? (
            <ConversacionQueja
              key={seleccionada.id}
              queja={seleccionada}
              rol={user?.rol}
              onEnviar={enviar}
              onVolver={() => setSeleccionada(null)}
            />
          ) : (
            <div className="queja-conv-placeholder">
              <FaComments
                className="queja-conv-placeholder-ico"
                aria-hidden="true"
              />
              <p className="queja-conv-placeholder-titulo">
                Elegí una conversación
              </p>
              <p className="queja-conv-placeholder-texto">
                Los reclamos aparecen a la izquierda. Abrí uno para ver el hilo
                y responderle al cliente.
              </p>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default BandejaQuejas;
