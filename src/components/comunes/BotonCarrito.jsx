/**
 * Propósito: Botón flotante de acceso rápido al carrito (B1).
 *            Círculo naranja fijo (abajo-derecha, sobre la barra inferior)
 *            con el contador de items siempre visible mientras navegás el
 *            catálogo. Solo aparece para clientes autenticados con items.
 * Contenido: Botón con badge (FaShoppingCart + totalItems del contexto).
 *            Se oculta en /carrito (ya estás ahí) y si no hay items.
 * Dependencias: react-bootstrap (Badge, Button), react-icons/fa (FaShoppingCart),
 *               react-router-dom (useNavigate, useLocation), useCarrito, useAuth.
 * Uso: Se monta en el shell de App.jsx, al lado del Navbar.
 */

import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "react-bootstrap";
import { FaShoppingCart } from "react-icons/fa";
import { useCarrito } from "../../hooks/useCarrito";
import { useAuth } from "../../hooks/useAuth";
import "./BotonCarrito.css";

const BotonCarrito = () => {
  const { totalItems } = useCarrito();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Solo para clientes autenticados, con items, y fuera de /carrito.
  const esCliente = user?.rol === "CLIENTE";
  const enCarrito = pathname.startsWith("/carrito");
  if (!isAuthenticated || !esCliente || enCarrito || totalItems === 0) {
    return null;
  }

  return (
    <button
      type="button"
      className="boton-carrito-flotante"
      onClick={() => navigate("/carrito")}
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
