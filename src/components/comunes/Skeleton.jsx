/**
 * Propósito: Placeholders de carga tipo skeleton que reemplazan a los spinners
 *   circulares (pantallas completas y estados de tránsito responsive).
 * Contenido: Bloque base `Skeleton` y composiciones reutilizables que imitan
 *   la forma real de cada vista (grilla de productos, detalle, lista de
 *   pedidos, tabla, tarjeta y página genérica).
 * Dependencias: react, react-bootstrap (Row, Col), Skeleton.css.
 * Uso: <SkeletonGrillaProductos /> mientras carga el catálogo. El contenedor
 *   de cada pantalla agrega role="status" + texto para lectores de pantalla
 *   (los bloques son decorativos y van aria-hidden).
 *
 * MOTIVO: un círculo girando no dice nada sobre lo que va a llegar; un
 *   skeleton con la geometría de la pantalla real reduce la carga percibida
 *   y evita el salto de layout al renderizar.
 */

import { Row, Col } from 'react-bootstrap';
import './Skeleton.css';

/* El proyecto no usa prop-types (convención de todo el codebase); la regla se
   desactiva por archivo igual que en CampoPassword.jsx y Loader.jsx. */
/* eslint-disable react/prop-types */

/**
 * Bloque base: un rectángulo crema con shimmer. Recibe medidas y radio.
 * `ancho` acepta cualquier valor CSS (%, rem, auto).
 */
export const Skeleton = ({ ancho = '100%', alto = '1rem', radio, clase = '' }) => (
  <span
    className={`skeleton ${clase}`.trim()}
    style={{ width: ancho, height: alto, borderRadius: radio }}
    aria-hidden="true"
  />
);

/** Pila de líneas de texto (la última siempre más corta, como un párrafo real). */
export const SkeletonTexto = ({ lineas = 3, anchoLinea = '100%' }) => (
  <span className="skeleton-texto" aria-hidden="true">
    {Array.from({ length: lineas }).map((_, i) => (
      <Skeleton key={i} ancho={i === lineas - 1 ? '60%' : anchoLinea} alto="0.85rem" />
    ))}
  </span>
);

/**
 * Tarjeta genérica: título + líneas, opcionalmente con "foto" arriba.
 * Sirve para sucursales, paneles y cualquier card simple.
 */
export const SkeletonTarjeta = ({ conFoto = false }) => (
  <div className="skeleton-card h-100" aria-hidden="true">
    {conFoto && <Skeleton clase="skeleton-card__img" alto="170px" />}
    <div className="skeleton-card__cuerpo">
      <Skeleton ancho="65%" alto="1.15rem" />
      <SkeletonTexto lineas={2} />
      <Skeleton ancho="45%" alto="1rem" />
    </div>
  </div>
);

/**
 * Grilla del catálogo: replica las columnas reales (md=4, lg=3) para que en
 * móvil se vea 1 por fila, en tablet 3 y en escritorio 4, igual que los
 * productos cargados.
 */
export const SkeletonGrillaProductos = ({ cantidad = 8 }) => (
  <Row className="justify-content-center" aria-hidden="true">
    {Array.from({ length: cantidad }).map((_, i) => (
      <Col key={i} md={4} lg={3} className="mb-4">
        <div className="skeleton-card h-100">
          <Skeleton clase="skeleton-card__img" alto="170px" />
          <div className="skeleton-card__cuerpo">
            <Skeleton ancho="70%" alto="1.2rem" />
            <SkeletonTexto lineas={2} />
            <div className="d-flex justify-content-between align-items-center mt-2">
              <Skeleton ancho="4.5rem" alto="1.3rem" />
              <Skeleton ancho="6.5rem" alto="2.2rem" radio="var(--radius-pill)" />
            </div>
          </div>
        </div>
      </Col>
    ))}
  </Row>
);

/**
 * Categorías de la portada: círculo + rótulo, con las mismas columnas que la
 * grilla real (xs=6, md=4, lg=2) para que no salte el layout al llegar los datos.
 */
export const SkeletonCategorias = ({ cantidad = 6 }) => (
  <Row className="justify-content-center" aria-hidden="true">
    {Array.from({ length: cantidad }).map((_, i) => (
      <Col key={i} xs={6} md={4} lg={2} className="mb-4 text-center">
        <Skeleton
          ancho="130px"
          alto="130px"
          radio="50%"
          clase="mx-auto"
        />
        <div className="mt-3 d-flex justify-content-center">
          <Skeleton ancho="70%" alto="0.9rem" />
        </div>
      </Col>
    ))}
  </Row>
);

/**
 * Detalle de producto: imagen a la izquierda y ficha a la derecha en
 * escritorio (md=5 / md=7), apilado en móvil — la misma forma responsive
 * del layout real.
 */
export const SkeletonDetalleProducto = () => (
  <div className="skeleton-card" aria-hidden="true">
    <Row className="g-0">
      <Col md={5}>
        <Skeleton clase="skeleton-detalle__img" alto="240px" />
      </Col>
      <Col md={7}>
        <div className="skeleton-card__cuerpo p-4">
          <Skeleton ancho="5rem" alto="1.3rem" radio="var(--radius-pill)" />
          <Skeleton ancho="75%" alto="1.9rem" />
          <Skeleton ancho="40%" alto="1.1rem" />
          <SkeletonTexto lineas={3} />
          <div className="d-flex gap-2 mt-3">
            <Skeleton ancho="7rem" alto="2.6rem" radio="var(--radius-pill)" />
            <Skeleton ancho="7rem" alto="2.6rem" radio="var(--radius-pill)" />
          </div>
        </div>
      </Col>
    </Row>
  </div>
);

/** Lista de pedidos: pila de tarjetas con badge de estado y stepper simulado. */
export const SkeletonListaPedidos = ({ cantidad = 3 }) => (
  <div className="skeleton-pagina" aria-hidden="true">
    {Array.from({ length: cantidad }).map((_, i) => (
      <div key={i} className="skeleton-card">
        <div className="skeleton-card__cuerpo">
          <div className="d-flex justify-content-between align-items-center">
            <Skeleton ancho="45%" alto="1.2rem" />
            <Skeleton ancho="6rem" alto="1.4rem" radio="var(--radius-pill)" />
          </div>
          <SkeletonTexto lineas={2} />
          {/* Stepper de estados: círculos unidos, como el HistorialStepper real */}
          <div className="d-flex align-items-center gap-2 mt-2">
            <Skeleton ancho="1.1rem" alto="1.1rem" radio="50%" />
            <Skeleton ancho="20%" alto="3px" radio="2px" />
            <Skeleton ancho="1.1rem" alto="1.1rem" radio="50%" />
            <Skeleton ancho="20%" alto="3px" radio="2px" />
            <Skeleton ancho="1.1rem" alto="1.1rem" radio="50%" />
            <Skeleton ancho="20%" alto="3px" radio="2px" />
            <Skeleton ancho="1.1rem" alto="1.1rem" radio="50%" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

/** Tabla: cabecera + filas. Para detalle de pedido y paneles admin. */
export const SkeletonTabla = ({ filas = 5, columnas = 4 }) => (
  <div className="skeleton-card p-3" aria-hidden="true">
    <div className="skeleton-tabla__fila">
      {Array.from({ length: columnas }).map((_, i) => (
        <Skeleton key={i} alto="0.9rem" />
      ))}
    </div>
    {Array.from({ length: filas }).map((_, f) => (
      <div key={f} className="skeleton-tabla__fila">
        {Array.from({ length: columnas }).map((_, c) => (
          <Skeleton key={c} alto="1.1rem" />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Página genérica: título + líneas + grilla de tarjetas. Es la que usa
 * Loader (rutas lazy y verificación de sesión) cuando no se conoce todavía
 * la pantalla que viene.
 */
export const SkeletonPagina = () => (
  <div className="skeleton-pagina" aria-hidden="true">
    <Skeleton ancho="min(20rem, 60%)" alto="1.9rem" />
    <Skeleton ancho="min(28rem, 85%)" alto="1rem" />
    <Row className="justify-content-center pt-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Col key={i} md={6} lg={3} className="mb-3">
          <SkeletonTarjeta />
        </Col>
      ))}
    </Row>
  </div>
);
