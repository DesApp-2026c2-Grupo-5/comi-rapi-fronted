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
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
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
    esCatalogo: true,
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
   administradores, clientes, hoja de Catálogo (el CRUD completo) y sucursales.
   Así, en el móvil navega igual que el admin, con los destinos al alcance del
   pulgar y sin depender del menú hamburguesa. */
const enlacesSuperadmin = [
  { to: '/superadmin/panel', etiqueta: 'Panel', icono: FaTachometerAlt },
  {
    to: '/superadmin/administradores',
    etiqueta: 'Administradores',
    icono: FaUserTie,
  },
  {
    to: '/superadmin/clientes',
    etiqueta: 'Clientes',
    icono: FaUsers,
  },
  {
    etiqueta: 'Catálogo',
    icono: FaUtensils,
    esCatalogo: true,
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
    to: '/superadmin/sucursales',
    etiqueta: 'Sucursales',
    icono: FaStore,
    prefijo: '/superadmin/sucursal',
  },
];

const NavInferior = () => {
  // Se monta siempre en el shell, así que el filtro por rol va acá y no en el
  // padre: si el filtro quedara en AppLayout, cualquier otro rol en el móvil
  // tendría la barra con destinos que no le corresponden.
  const visible = useMuestraNavInferior();
  const { user } = useAuth();
  const { pathname } = useLocation();
  // La hoja de Catálogo del admin (móvil) se abre y cierra con su propio estado;
  // al navegar a un hijo se cierra sola.
  const [hojaAbierta, setHojaAbierta] = useState(false);

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

  /* La hoja del Catálogo del admin se marca activa si la ruta actual es una de
     sus subpantallas (por ejemplo, /admin/productos). */
  const hijoSuscriptor = enlaces.find((enlace) => enlace.esCatalogo);
  const catalogoActivo = hijoSuscriptor ? esRutaDeAlguna(hijoSuscriptor.hijos, pathname) : false;

  return (
    <>
      {/* Nombre propio: en móvil conviven esta barra y la superior, y dos <nav>
         sin nombre se anuncian igual. NavLink ya pone aria-current="page" sólo
         en el enlace activo. */}
      <nav className="nav-inferior" aria-label="Navegación principal">
        <ul className="nav-inferior-lista">
          {enlaces.map((enlace) => {
            if (enlace.esCatalogo) {
              return (
                <li key={enlace.etiqueta} className="nav-inferior-item">
                  <button
                    type="button"
                    onClick={() => setHojaAbierta(true)}
                    aria-expanded={hojaAbierta}
                    aria-haspopup="true"
                    className={`nav-inferior-enlace nav-inferior-boton${
                      catalogoActivo || hojaAbierta ? ' activo' : ''
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

      {/* Hoja del Catálogo (admin en solo lectura, superadmin con CRUD). La hoja
          crece desde abajo, igual que esta barra, para mantener la mano en el
          mismo lugar. Al tocar un destino se navega y se cierra. Sólo existe
          para los roles con `esCatalogo` en sus enlaces (admin/superadmin). */}
      {hijoSuscriptor && (
        <Offcanvas
          show={hojaAbierta}
          onHide={() => setHojaAbierta(false)}
          placement="bottom"
          className="nav-hoja offcanvas"
        >
          <Offcanvas.Header closeButton closeVariant="white">
            <Offcanvas.Title as="span">
              <FaUtensils className="me-2" aria-hidden="true" />
              {hijoSuscriptor.hojaTitulo || hijoSuscriptor.etiqueta}
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <ul className="nav-hoja-lista">
              {hijoSuscriptor.hijos.map((hijo) => (
                <li key={hijo.to}>
                  <NavLink
                    to={hijo.to}
                    end
                    onClick={() => setHojaAbierta(false)}
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
          </Offcanvas.Body>
        </Offcanvas>
      )}
    </>
  );
};

export default NavInferior;