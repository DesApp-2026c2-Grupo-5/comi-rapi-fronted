/**
 * Propósito: Barra de navegación inferior fija para pantallas chicas, con los
 *            destinos principales de cada rol al alcance del pulgar.
 * Contenido: <nav> con una lista de destinos (ícono, etiqueta y badge de
 *            contador). El admin y el superadmin tienen además una "hoja" de
 *            Catálogo que abre un Offcanvas con los listados.
 * Dependencias: react-router-dom (NavLink, useLocation), react-bootstrap
 *               (Offcanvas), react-icons/fa, useAuth, useIndicadoresNav,
 *               useMuestraNavInferior, esRutaDeAlguna, NavInferior.css.
 * Uso: <NavInferior /> - Se renderiza en App.jsx, debajo de <main>.
 *
 * Reemplaza en la práctica al menú hamburguesa en el móvil: abrir el colapsable
 * para llegar a Inicio o al Carrito costaba dos toques extra y tapaba el
 * contenido. Sólo aparece bajo el corte `lg`, que es el mismo punto en que
 * Bootstrap pliega el colapsable de la barra superior.
 *
 * Los contadores vienen de useIndicadoresNav, el mismo hook que usa Navbar.jsx,
 * para que el número de pedidos sea el mismo en las dos barras.
 *
 * No incluye el perfil: son destinos de trabajo y el perfil se alcanza desde el
 * avatar de la barra superior, que en móvil quedó siempre visible. Meterlo como
 * último ítem dejaría las columnas desiguales y el destino quedaría al borde, que
 * es la parte menos cómoda de la barra.
 */

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Offcanvas } from 'react-bootstrap';
import {
  FaHome,
  FaUtensils,
  FaShoppingCart,
  FaReceipt,
  FaTachometerAlt,
  FaBoxes,
  FaTags,
  FaPercent,
  FaHamburger,
  FaUsers,
  FaUserTie,
  FaSlidersH,
  FaStore,
  FaCog,
  FaBriefcase,
  FaCheck,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { useSucursal } from '../../hooks/useSucursal';
import { useSucursalOperativa } from '../../hooks/useSucursalOperativa';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { ROLES } from '../../utils/constants';
import { esRutaDeAlguna } from '../../utils/rutas';
import useIndicadoresNav from '../../hooks/useIndicadoresNav';
import useMuestraNavInferior from '../../hooks/useMuestraNavInferior';
import './NavInferior.css';

/* El del cliente entra completo en la barra. La del admin lleva la operación de
   su sucursal (Inicio, Pedidos, Clientes y Stock) y una hoja de Catálogo: el
   CRUD de productos, categorías, promociones y personalización es del
   SUPERADMINISTRADOR, y el admin los ve en SOLO LECTURA (con el interruptor de
   disponibilidad en Productos). Las sucursales tampoco son del admin. */
const enlacesCliente = [
  { to: '/cliente/inicio', etiqueta: 'Inicio', icono: FaHome },
  { to: '/cliente/catalogo', etiqueta: 'Catálogo', icono: FaUtensils },
  {
    to: '/cliente/carrito',
    etiqueta: 'Carrito',
    icono: FaShoppingCart,
    badge: 'carrito',
  },
  {
    to: '/cliente/mis-pedidos',
    etiqueta: 'Pedidos',
    icono: FaReceipt,
    badge: 'pedidos',
  },
];

/* El invitado ve el mismo camino de compra, sin "Pedidos": ese destino lleva a
   los pedidos del usuario y no hay ninguno sin sesión. */
const enlacesInvitado = enlacesCliente.filter((enlace) => enlace.to !== '/cliente/mis-pedidos');

const enlacesAdmin = [
  { to: '/admin/dashboard', etiqueta: 'Inicio', icono: FaTachometerAlt },
  {
    to: '/admin/pedidos',
    etiqueta: 'Pedidos',
    icono: FaReceipt,
    badge: 'pedidos',
  },
  {
    to: '/admin/clientes',
    etiqueta: 'Clientes',
    icono: FaUsers,
    prefijo: '/admin/clientes',
  },
  {
    etiqueta: 'Catálogo',
    icono: FaUtensils,
    hoja: 'catalogo',
    hojaTitulo: 'Catálogo (solo lectura)',
    hijos: [
      {
        to: '/admin/productos',
        etiqueta: 'Productos',
        icono: FaHamburger,
        prefijo: '/admin/producto',
      },
      {
        to: '/admin/categorias',
        etiqueta: 'Categorías',
        icono: FaTags,
        prefijo: '/admin/categoria',
      },
      {
        to: '/admin/promociones',
        etiqueta: 'Promociones',
        icono: FaPercent,
        prefijo: '/admin/promocion',
      },
    ],
  },
  { to: '/admin/stock', etiqueta: 'Stock', icono: FaBoxes },
];

/* El superadministrador comparte el andamiaje de la barra inferior: panel,
   hoja de Catálogo (el CRUD completo) y hoja de Negocio
   (parámetros, sucursales, clientes y administradores). Así, en el móvil
   navega igual que el admin, con los destinos al alcance del pulgar y sin
   depender del menú hamburguesa. */
const enlacesSuperadmin = [
  { to: '/superadmin/panel', etiqueta: 'Panel', icono: FaTachometerAlt },
  {
    /* Hoja "Sucursal": en pantalla chica el menú superior (con el selector de
       contexto y los destinos operativos) queda oculto por el colapsable.
       Desde acá el superadmin elige la sucursal que opera y entra a sus
       pedidos/stock, sin depender de la barra superior. */
    etiqueta: 'Sucursal',
    icono: FaStore,
    hoja: 'sucursal',
    hojaTitulo: 'Operar una sucursal',
    hijos: [
      {
        to: '/admin/pedidos',
        etiqueta: 'Pedidos de la sucursal',
        icono: FaReceipt,
      },
      {
        to: '/admin/stock',
        etiqueta: 'Stock de la sucursal',
        icono: FaBoxes,
      },
    ],
  },
  {
    etiqueta: 'Catálogo',
    icono: FaUtensils,
    hoja: 'catalogo',
    hojaTitulo: 'Catálogo',
    hijos: [
      {
        to: '/superadmin/productos',
        etiqueta: 'Productos',
        icono: FaHamburger,
        prefijo: '/superadmin/producto',
      },
      {
        to: '/superadmin/categorias',
        etiqueta: 'Categorías',
        icono: FaTags,
        prefijo: '/superadmin/categoria',
      },
      {
        to: '/superadmin/personalizacion',
        etiqueta: 'Personalización',
        icono: FaSlidersH,
      },
      {
        to: '/superadmin/promociones',
        etiqueta: 'Promociones',
        icono: FaPercent,
        prefijo: '/superadmin/promocion',
      },
    ],
  },
  {
    etiqueta: 'Negocio',
    icono: FaBriefcase,
    hoja: 'negocio',
    hojaTitulo: 'Negocio',
    hijos: [
      {
        to: '/superadmin/parametros',
        etiqueta: 'Parámetros',
        icono: FaCog,
        prefijo: '/superadmin/parametros',
      },
      {
        to: '/superadmin/sucursales',
        etiqueta: 'Sucursales',
        icono: FaStore,
        prefijo: '/superadmin/sucursal',
      },
      {
        to: '/superadmin/clientes',
        etiqueta: 'Clientes',
        icono: FaUsers,
        prefijo: '/superadmin/clientes',
      },
      {
        to: '/superadmin/administradores',
        etiqueta: 'Administradores',
        icono: FaUserTie,
        prefijo: '/superadmin/administradores',
      },
    ],
  },
];

const NavInferior = () => {
  // Se monta siempre en el shell, así que el filtro por rol va acá y no en el
  // padre: si el filtro quedara en AppLayout, cualquier otro rol en el móvil
  // tendría la barra con destinos que no le corresponden.
  const visible = useMuestraNavInferior();
  const { user } = useAuth();
  const { pathname } = useLocation();
  // Hoja "Sucursal" (solo la usa el superadmin): lista de sucursales activas
  // y contexto operativo. Va con los demás hooks, antes del retorno temprano.
  const { notificar } = useNotificaciones();
  const { sucursales } = useSucursal();
  const { sucursalOperativa, sucursalOperativaId, elegirSucursal, limpiarSucursal } =
    useSucursalOperativa();
  const sucursalesActivas = (sucursales || []).filter((s) => s.activa !== false);
  // La hoja de Catálogo del admin (móvil) se abre y cierra con su propio estado;
  // al navegar a un hijo se cierra sola. Guarda el nombre de la hoja abierta
  // ('catalogo' | 'negocio' | 'sucursal') o null, para poder tener más de una.
  const [hojaAbierta, setHojaAbierta] = useState(null);

  const {
    productosDistintos,
    pedidosActivos,
    pulsoCarrito,
    pulsoPedido,
    pulsoPedidoBadge,
  } = useIndicadoresNav();

  // Los hooks van antes de esta salida: si se retornara null antes de llamarlos,
  // el orden de hooks cambiaría entre usuarios y React protestaría.
  if (!visible) return null;

  const esAdmin = user?.rol === ROLES.ADMIN;
  const esCliente = user?.rol === ROLES.CLIENTE;
  const esSuperadmin = user?.rol === ROLES.SUPERADMIN;
  const enlaces = esAdmin
    ? enlacesAdmin
    : esSuperadmin
      ? enlacesSuperadmin
      : esCliente
        ? enlacesCliente
        : enlacesInvitado;

  // Badge del contador. El número visible es decorativo: el texto para lectores
  // de pantalla va aparte, porque un aria-label sobre un <span> sin rol no se
  // expone de forma fiable.
  const renderBadge = (clave) => {
    if (clave === 'carrito' && productosDistintos > 0) {
      return (
        <span className={`carrito-badge nav-inferior-badge${pulsoCarrito ? ' carrito-badge-pulso' : ''}`}>
          <span aria-hidden="true">{productosDistintos}</span>
          <span className="visually-hidden">
            {`${productosDistintos} ${
              productosDistintos === 1 ? 'producto' : 'productos'
            } en el carrito`}
          </span>
        </span>
      );
    }
    if (clave === 'pedidos' && pedidosActivos > 0) {
      return (
        <span className={`carrito-badge nav-inferior-badge${pulsoPedidoBadge ? ' carrito-badge-pulso' : ''}`}>
          <span aria-hidden="true">{pedidosActivos}</span>
          <span className="visually-hidden">
            {`${pedidosActivos} ${
              pedidosActivos === 1 ? 'pedido' : 'pedidos'
            } en curso`}
          </span>
        </span>
      );
    }
    return null;
  };

  const pulsoDeIcono = (clave) =>
    (clave === 'carrito' && pulsoCarrito) || (clave === 'pedidos' && pulsoPedido)
      ? ' nav-enlace-ico-pulso'
      : '';

  /* Cada hoja (Catálogo, Negocio) se marca activa si la ruta actual es una de
     sus subpantallas (por ejemplo, /admin/productos). */
  const hojas = enlaces.filter((enlace) => enlace.hoja);
  const hojaActiva = (clave) => {
    const hoja = hojas.find((enlace) => enlace.hoja === clave);
    return hoja ? esRutaDeAlguna(hoja.hijos, pathname) : false;
  };
  // La hoja que se muestra: la abierta o, si ninguna lo está, ninguna.
  const hojaVisible = hojas.find((enlace) => enlace.hoja === hojaAbierta);

  // Hoja "Sucursal": elegir contexto y salir de él. El backend valida la
  // sucursal (activa); con el cambio de contexto el contexto/socket se rearman.
  const elegirYCerrar = async (sucursal) => {
    const result = await elegirSucursal(sucursal.id);
    if (result.success) {
      notificar(`Ahora operás la sucursal ${sucursal.nombre}.`, 'info');
      setHojaAbierta(null);
    } else {
      notificar(result.error || 'No se pudo elegir la sucursal.', 'danger');
    }
  };

  const dejarDeOperar = async () => {
    const result = await limpiarSucursal();
    if (result.success) {
      notificar('Dejaste de operar la sucursal.', 'info');
      setHojaAbierta(null);
    } else {
      notificar(result.error || 'No se pudo salir del contexto.', 'danger');
    }
  };

  return (
    <>
      {/* Nombre propio: en móvil conviven esta barra y la superior, y dos <nav>
         sin nombre se anuncian igual. NavLink ya pone aria-current="page" sólo
         en el enlace activo. */}
      <nav className="nav-inferior" aria-label="Navegación principal">
        <ul className="nav-inferior-lista">
          {enlaces.map((enlace) => {
            if (enlace.hoja) {
              return (
                <li key={enlace.etiqueta} className="nav-inferior-item">
                  <button
                    type="button"
                    onClick={() => setHojaAbierta(enlace.hoja)}
                    aria-expanded={hojaAbierta === enlace.hoja}
                    aria-haspopup="true"
                    className={`nav-inferior-enlace nav-inferior-boton${
                      hojaActiva(enlace.hoja) || hojaAbierta === enlace.hoja ? ' activo' : ''
                    }`}
                  >
                    <span className="nav-inferior-ico-wrap">
                      <enlace.icono className="nav-inferior-ico" aria-hidden="true" />
                    </span>
                    <span className="nav-inferior-texto">{enlace.etiqueta}</span>
                  </button>
                </li>
              );
            }

            const { to, badge, etiqueta, icono: Icono } = enlace;
            return (
              <li key={to} className="nav-inferior-item">
                <NavLink
                  to={to}
                  end
                  className={({ isActive }) =>
                    `nav-inferior-enlace${isActive ? ' activo' : ''}`
                  }
                >
                  <span className={`nav-inferior-ico-wrap${pulsoDeIcono(badge)}`}>
                    <Icono className="nav-inferior-ico" aria-hidden="true" />
                    {renderBadge(badge)}
                  </span>
                  <span className="nav-inferior-texto">{etiqueta}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Hoja de Catálogo (admin en solo lectura, superadmin con CRUD) y hoja de
          Negocio (parámetros, sucursales y clientes del superadmin). La hoja
          crece desde abajo, igual que esta barra, para mantener la mano en el
          mismo lugar. Al tocar un destino se navega y se cierra. */}
      {hojaVisible && (
        <Offcanvas
          show={Boolean(hojaVisible)}
          onHide={() => setHojaAbierta(null)}
          placement="bottom"
          className="nav-hoja offcanvas"
        >
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title as="span">
              <hojaVisible.icono className="me-2" aria-hidden="true" />
              {hojaVisible.hojaTitulo || hojaVisible.etiqueta}
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {hojaVisible.hoja === 'sucursal' ? (
              <>
                {/* Elegir (o cambiar) la sucursal de contexto. La marca de
                    la activa usa aria-current para lectores de pantalla. */}
                <p className="nav-hoja-seccion-titulo">
                  {sucursalOperativa
                    ? `Estás operando la sucursal ${sucursalOperativa.nombre}. Elegí otra, operá o salí del contexto:`
                    : 'Elegí una sucursal para operar sus pedidos y su stock:'}
                </p>
                <ul className="nav-hoja-lista nav-hoja-lista-compacta">
                  {sucursalesActivas.map((sucursal) => {
                    const esLaActiva =
                      sucursalOperativaId &&
                      Number(sucursal.id) === Number(sucursalOperativaId);
                    return (
                      <li key={sucursal.id}>
                        <button
                          type="button"
                          onClick={() => elegirYCerrar(sucursal)}
                          aria-current={esLaActiva ? 'true' : undefined}
                          className={`nav-hoja-enlace nav-hoja-boton${
                            esLaActiva ? ' activo' : ''
                          }`}
                        >
                          <FaStore className="nav-hoja-ico" aria-hidden="true" />
                          <span className="nav-hoja-texto">{sucursal.nombre}</span>
                          {esLaActiva && (
                            <FaCheck className="nav-hoja-check" aria-hidden="true" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                  {sucursalesActivas.length === 0 && (
                    <li className="nav-hoja-vacio">
                      No hay sucursales activas para operar.
                    </li>
                  )}
                </ul>

                {/* Con contexto elegido, los destinos operativos de esa
                    sucursal (rutas compartidas con el admin). */}
                {sucursalOperativa && (
                  <>
                    <p className="nav-hoja-seccion-titulo">
                      Operar {sucursalOperativa.nombre}
                    </p>
                    <ul className="nav-hoja-lista nav-hoja-lista-compacta">
                      {hojaVisible.hijos.map((hijo) => (
                        <li key={hijo.to}>
                          <NavLink
                            to={hijo.to}
                            end
                            onClick={() => setHojaAbierta(null)}
                            className={`nav-hoja-enlace${
                              esRutaDeAlguna([hijo], pathname) ? ' activo' : ''
                            }`}
                          >
                            <hijo.icono className="nav-hoja-ico" aria-hidden="true" />
                            {hijo.etiqueta}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="nav-hoja-salir"
                      onClick={dejarDeOperar}
                    >
                      Dejar de operar esta sucursal
                    </button>
                  </>
                )}
              </>
            ) : (
              <ul className="nav-hoja-lista">
                {hojaVisible.hijos.map((hijo) => (
                  <li key={hijo.to}>
                    <NavLink
                      to={hijo.to}
                      end
                      onClick={() => setHojaAbierta(null)}
                      className={`nav-hoja-enlace${
                        esRutaDeAlguna([hijo], pathname) ? ' activo' : ''
                      }`}
                    >
                      <hijo.icono className="nav-hoja-ico" aria-hidden="true" />
                      {hijo.etiqueta}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </Offcanvas.Body>
        </Offcanvas>
      )}
    </>
  );
};

export default NavInferior;