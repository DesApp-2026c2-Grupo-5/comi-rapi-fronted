/**
 * Propósito: Barra de navegación inferior fija para pantallas chicas, con los
 *            destinos principales de cada rol al alcance del pulgar.
 * Contenido: <nav> con una lista de destinos (ícono, etiqueta y badge de
 *            contador) y, en el admin, una hoja inferior que despliega las
 *            secciones del catálogo.
 * Dependencias: react-router-dom (NavLink, useLocation), react-bootstrap (Offcanvas),
 *               react-icons/fa, useAuth, useIndicadoresNav, useMuestraNavInferior,
 *               NavInferior.css.
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
  FaStore,
  FaSlidersH,
  FaTags,
  FaPercent,
  FaHamburger,
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import { esRutaDeAlguna } from '../../utils/rutas';
import useIndicadoresNav from '../../hooks/useIndicadoresNav';
import useMuestraNavInferior from '../../hooks/useMuestraNavInferior';
import './NavInferior.css';

/* El del cliente entra completo en la barra. El admin tiene cinco secciones de
   primer nivel (Dashboard, Pedidos, Catálogo, Sucursales y Stock) y cinco
   columnas de ícono con etiqueta a 320px quedan justas, así que el catálogo va
   en una hoja desplegada desde el mismo lugar. */
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

const enlacesAdmin = [
  { to: '/admin/dashboard', etiqueta: 'Inicio', icono: FaTachometerAlt },
  {
    to: '/admin/pedidos',
    etiqueta: 'Pedidos',
    icono: FaReceipt,
    badge: 'pedidos',
  },
  {
    tipo: 'hoja',
    etiqueta: 'Catálogo',
    icono: FaUtensils,
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
        to: '/admin/personalizacion',
        etiqueta: 'Personalización',
        icono: FaSlidersH,
      },
      {
        to: '/admin/promociones',
        etiqueta: 'Promociones',
        icono: FaPercent,
        prefijo: '/admin/promocion',
      },
    ],
  },
  { to: '/admin/sucursales', etiqueta: 'Sucursales', icono: FaStore },
  { to: '/admin/stock', etiqueta: 'Stock', icono: FaBoxes },
];

/* Una subpantalla de alta o edición cuenta como la misma sección, así que el
   catálogo queda marcado también dentro de /admin/producto/editar/3. El detalle
   está en utils/rutas.js. */
const NavInferior = () => {
  // Se monta siempre en el shell, así que el filtro por rol va acá y no en el
  // padre: si el filtro quedara en AppLayout, cualquier otro rol en el móvil
  // tendría la barra con destinos que no le corresponden.
  const visible = useMuestraNavInferior();
  const { user } = useAuth();
  const { pathname } = useLocation();
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
  const enlaces = esAdmin ? enlacesAdmin : enlacesCliente;
  const hoja = enlaces.find((enlace) => enlace.tipo === 'hoja');
  const hojaActiva = hoja ? esRutaDeAlguna(hoja.hijos, pathname) : false;

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

  return (
    <>
      {/* Nombre propio: en móvil conviven esta barra y la superior, y dos <nav>
         sin nombre se anuncian igual. NavLink ya pone aria-current="page" sólo
         en el enlace activo. */}
      <nav className="nav-inferior" aria-label="Navegación principal">
        <ul className="nav-inferior-lista">
          {enlaces.map((enlace) => {
            const { tipo, etiqueta, icono: Icono } = enlace;

            if (tipo === 'hoja') {
              return (
                <li key={etiqueta} className="nav-inferior-item">
                  {/* Botón y no enlace: este ítem no navega, abre un panel. Un <a>
                      sin destino obligaría a elegir entre "no pasa nada" y un
                      href="#" que además suma un destino al historial. Los
                      enlaces de verdad están en la hoja. */}
                  <button
                    type="button"
                    className={`nav-inferior-enlace nav-inferior-boton${
                      hojaActiva || hojaAbierta ? ' activo' : ''
                    }`}
                    onClick={() => setHojaAbierta(true)}
                    aria-expanded={hojaAbierta}
                    aria-haspopup="dialog"
                    aria-controls="nav-inferior-hoja"
                  >
                    <span className="nav-inferior-ico-wrap">
                      <Icono className="nav-inferior-ico" aria-hidden="true" />
                    </span>
                    <span className="nav-inferior-texto">{etiqueta}</span>
                  </button>
                </li>
              );
            }

            const { to, badge } = enlace;
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

      {hoja && (
        /* Hoja inferior en vez de submenú flotante: el ítem está en el borde de
           abajo y un desplegable hacia arriba taparía la propia barra y quedaría a
           media distancia del pulgar. react-bootstrap aporta el fondo oscurecido,
           el Escape, el foco atrapado y el bloqueo del scroll de fondo, que es lo
           caro de resolver a mano. */
        <Offcanvas
          show={hojaAbierta}
          onHide={() => setHojaAbierta(false)}
          placement="bottom"
          id="nav-inferior-hoja"
          aria-labelledby="nav-inferior-hoja-titulo"
          className="nav-hoja"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="nav-inferior-hoja-titulo">{hoja.etiqueta}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <ul className="nav-hoja-lista">
              {hoja.hijos.map((hijo) => (
                <li key={hijo.to}>
                  <NavLink
                    to={hijo.to}
                    end
                    className={({ isActive }) =>
                      `nav-hoja-enlace${isActive ? ' activo' : ''}`
                    }
                    onClick={() => setHojaAbierta(false)}
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