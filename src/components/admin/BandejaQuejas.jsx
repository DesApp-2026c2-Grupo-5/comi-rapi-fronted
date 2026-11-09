/**
 * Propósito: Bandeja de reclamos tipo chat para ADMINISTRADOR y
 *            SUPERADMINISTRADOR: lista de conversaciones + hilo + compositor.
 * Contenido: BandejaQuejas, que orquesta datos, filtros, socket y envío.
 * Dependencias: react, react-bootstrap (Button), react-icons/fa, api/quejas,
 *               api/sucursales, useAuth, services/socket, utils/constants,
 *               ListaConversaciones, ConversacionQueja y BandejaQuejas.css.
 * Uso: <BandejaQuejas /> - Se renderiza en GestionQuejas.
 */

import { useEffect, useId, useState } from 'react';
import { Button } from 'react-bootstrap';
import { FaComments, FaSyncAlt } from 'react-icons/fa';
import {
  actualizarQueja,
  enviarMensajeQueja,
  obtenerQuejas,
} from '../../api/quejas';
import { obtenerSucursales } from '../../api/sucursales';
import { useAuth } from '../../hooks/useAuth';
import { conectarSocket, EVENTOS_SOCKET } from '../../services/socket';
import { ROLES } from '../../utils/constants';
import ListaConversaciones from './quejas/ListaConversaciones';
import ConversacionQueja from './quejas/ConversacionQueja';
import { LIMITE_CONVERSACIONES, contarSinResponder } from './quejas/ayudas';
import './quejas/BandejaQuejas.css';

const BandejaQuejas = () => {
  const { user } = useAuth();
  const esSuperadmin = user?.rol === ROLES.SUPERADMIN;
  const campoBusquedaId = useId();
  const campoSucursalId = useId();

  const [quejas, setQuejas] = useState([]);
  const [total, setTotal] = useState(0);
  const [paginas, setPaginas] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [texto, setTexto] = useState('');
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [sucursales, setSucursales] = useState([]);
  const [recarga, setRecarga] = useState(0);

  const [seleccionada, setSeleccionada] = useState(null);

  useEffect(() => {
    if (!esSuperadmin) return;
    obtenerSucursales().then((res) => {
      if (res.success) setSucursales(res.data);
    });
  }, [esSuperadmin]);

  useEffect(() => {
    const socket = conectarSocket();
    const alActualizar = () => setRecarga((valor) => valor + 1);
    socket.on(EVENTOS_SOCKET.QUEJA_ACTUALIZADA, alActualizar);
    return () => socket.off(EVENTOS_SOCKET.QUEJA_ACTUALIZADA, alActualizar);
  }, []);

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

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setError('');
    obtenerQuejas({
      estado,
      q,
      sucursalId: esSuperadmin ? sucursalId : undefined,
      pagina,
      limite: LIMITE_CONVERSACIONES,
    }).then((res) => {
      if (!vivo) return;
      setCargando(false);
      if (!res.success) {
        setError(res.error || 'No se pudieron cargar los reclamos.');
        return;
      }
      setQuejas(res.data.items);
      setTotal(res.data.total);
      setPaginas(res.data.paginas);
      // La conversación abierta se actualiza con los datos frescos, aunque
      // haya quedado fuera de la página o del filtro actual.
      setSeleccionada((actual) =>
        actual
          ? res.data.items.find((queja) => queja.id === actual.id) || actual
          : actual,
      );
    });
    return () => {
      vivo = false;
    };
  }, [estado, q, sucursalId, pagina, esSuperadmin, recarga]);

  const limpiarFiltros = () => {
    setTexto('');
    setQ('');
    setEstado('');
    setSucursalId('');
    setPagina(1);
    setRecarga((valor) => valor + 1);
  };

  const enviar = async ({ contenido, estado: estadoNuevo }) => {
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

    setSeleccionada(res.data);
    setQuejas((actual) =>
      actual.some((queja) => queja.id === res.data.id)
        ? actual.map((queja) => (queja.id === res.data.id ? res.data : queja))
        : actual,
    );
    setRecarga((valor) => valor + 1);
    return { ok: true };
  };

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
          onClick={() => setRecarga((valor) => valor + 1)}
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
            onReintentar={() => setRecarga((valor) => valor + 1)}
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
