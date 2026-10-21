/**
 * Propósito: Botón flotante de acceso rápido al carrito (B1).
 *            Círculo naranja fijo (abajo-derecha, sobre la barra inferior)
 *            con el contador de items siempre visible mientras navegás el
 *            catálogo. El catálogo es público: el carrito funciona sin
 *            sesión (la cuenta se pide recién al confirmar), así que el
 *            botón aparece para cualquier visitante con items.
 * Contenido: Botón con badge (FaShoppingCart + totalItems del contexto).
 *            No se muestra en los paneles de admin/superadmin (esRutaDeAdmin):
 *            el carrito es de la tienda, no del panel. Se oculta también en
 *            la página del carrito (ya estás ahí) y si no hay items.
 * Dependencias: react-bootstrap (Badge), react-icons/fa (FaShoppingCart),
 *               react-router-dom (useNavigate, useLocation), useCarrito,
 *               utils/rutas (esRutaDeAdmin).
 * Uso: Se monta en el shell de App.jsx, al lado del Navbar.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "react-bootstrap";
import { FaShoppingCart } from "react-icons/fa";
import { useCarrito } from "../../hooks/useCarrito";
import { esRutaDeAdmin } from "../../utils/rutas";
import "./BotonCarrito.css";

const BotonCarrito = () => {
  const { totalItems } = useCarrito();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // El catálogo es público: el carrito funciona sin sesión (la cuenta se
  // pide recién al confirmar). El botón aparece siempre que haya items,
  // esté el visitante logueado o no, y desaparece en la página del carrito.
  // En el panel de administración no aparece: el carrito es de la tienda.
  const enCarrito = pathname.startsWith("/cliente/carrito");
  if (esRutaDeAdmin(pathname) || enCarrito || totalItems === 0) {
    return null;
  }

  return (
    <button
      type="button"
      className="boton-carrito-flotante"
      onClick={() => navigate("/cliente/carrito")}
      title="Ver carrito"
      aria-label={`Ver carrito (${totalItems} ${totalItems === 1 ? "item" : "items"})`}
    >
      <FaShoppingCart aria-hidden="true" />
      <Badge pill bg="danger" className="boton-carrito-badge">
        {totalItems}
      </Badge>
    </button>
  );
};

export default BotonCarrito;
