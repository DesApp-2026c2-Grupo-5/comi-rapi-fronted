/**
 * Propósito: Resumen del carrito (mini-cart) anclado al botón del catálogo.
 * Contenido: El botón del carrito (con el contador de unidades) y un panel
 *            compacto que se despliega debajo. Un único componente resuelve los
 *            dos estados —carrito vacío y carrito con productos— modificando su
 *            contenido, sin duplicar el estado: todo sale del CarritoContext.
 * Dependencias: react (hooks), react-router-dom (Link), react-bootstrap
 *               (Button), react-icons/fa (FaShoppingCart), useCarrito,
 *               MiniCarrito.css.
 * Uso: <MiniCarrito /> junto al buscador, dentro del header del catálogo.
 *
 * El botón NO navega: abre y cierra el panel (toggle). El panel se cierra al
 * pulsar fuera y con Escape (devolviendo el foco al botón), y queda anclado al
 * botón con el ancho limitado al de la ventana, así no se recorta en mobile.
 * El contador rojo usa `totalItems`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { FaShoppingCart } from 'react-icons/fa';
import { useCarrito } from '../../hooks/useCarrito';
import './MiniCarrito.css';

const ID_PANEL = 'mini-carrito-panel';

const MiniCarrito = () => {
  const { totalItems } = useCarrito();
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const botonRef = useRef(null);

  const vacio = totalItems === 0;

  const cerrar = useCallback((devolverFoco = false) => {
    setAbierto(false);
    if (devolverFoco) botonRef.current?.focus();
  }, []);

  // Cierre por clic afuera y por Escape. Con el teclado el foco vuelve al
  // botón, para no dejarlo perdido en el body.
  useEffect(() => {
    if (!abierto) return undefined;

    const alPresionarFuera = (evento) => {
      if (!contenedorRef.current?.contains(evento.target)) setAbierto(false);
    };
    const alTeclear = (evento) => {
      if (evento.key === 'Escape') {
        evento.stopPropagation();
        cerrar(true);
      }
    };

    document.addEventListener('mousedown', alPresionarFuera);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alPresionarFuera);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto, cerrar]);

  const etiquetaBoton =
    totalItems > 0
      ? `Ver resumen del carrito, ${totalItems} ${
          totalItems === 1 ? 'producto' : 'productos'
        }`
      : 'Ver resumen del carrito';

  return (
    <div className="mini-carrito" ref={contenedorRef}>
      <Button
        type="button"
        ref={botonRef}
        className="catalogo-boton-carrito"
        onClick={() => setAbierto((previo) => !previo)}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls={ID_PANEL}
        aria-label={etiquetaBoton}
      >
        <FaShoppingCart aria-hidden="true" />
        {totalItems > 0 && (
          <span className="catalogo-boton-carrito-badge" aria-hidden="true">
            {totalItems}
          </span>
        )}
      </Button>

      {abierto && (
        <div
          id={ID_PANEL}
          className="mini-carrito-panel"
          role="dialog"
          aria-label="Resumen del carrito"
        >
          <FaShoppingCart
            className={`mini-carrito-icono${vacio ? ' mini-carrito-icono-vacio' : ''}`}
            aria-hidden="true"
          />
          <p className="mini-carrito-titulo">
            {vacio
              ? 'Tu carrito está vacío'
              : `${totalItems} ${
                  totalItems === 1 ? 'producto' : 'productos'
                } en tu carrito`}
          </p>
          {vacio ? (
            <>
              <p className="mini-carrito-texto">
                Agregá productos desde el catálogo para comenzar
              </p>
              {/* Sin interacción mientras no haya productos. */}
              <Button
                className="mini-carrito-accion"
                disabled
                aria-disabled="true"
              >
                Ver carrito
              </Button>
            </>
          ) : (
            <Button
              as={Link}
              to="/cliente/carrito"
              className="mini-carrito-accion mini-carrito-accion-activa"
              onClick={() => cerrar()}
            >
              Ver carrito
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default MiniCarrito;
