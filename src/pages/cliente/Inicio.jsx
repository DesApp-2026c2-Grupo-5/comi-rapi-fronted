/**
 * Propósito: Página de inicio del cliente con hero, categorías, más vendidos y envío a domicilio.
 * Contenido: Hero naranja (COMI + hamburguesa flotante + RAPI), 5 categorías circulares,
 *            más vendidos del día, sección de envío a domicilio.
 * Dependencias: react-bootstrap (Container, Row, Col, Button), react-router-dom (Link),
 *               api/categorias, api/productos, ProductoCard, Inicio.css.
 * Uso: Ruta "/cliente/inicio" → <Inicio />
 *
 * CAMBIOS REALIZADOS:
 *  1. Hero: fondo #FF9F1C, "COMI"/"RAPI" en blanco + hamburguesa flotante centrada
 *     (no se superponen porque cada uno ocupa una columna propia en filas del Row).
 *     Badge de Google Play abajo a la izquierda y botón ORDENAR abajo a la derecha.
 *  2. Categorías: 6 cards circulares (Hamburguesas, Pizzas, Combos, Papas, Bebidas, Postres).
 *  3. Más vendidos de hoy: los 3 productos más vendidos del día según
 *     GET /api/productos/mas-vendidos, reutilizando <ProductoCard /> para mantener
 *     un estilo idéntico con el catálogo. Antes eran 3 ids fijos.
 *  4. Promociones del día: las 3 mejores promociones activas según
 *     GET /api/promociones, ordenadas por descuento equivalente (2x1 = 50%),
 *     con <PromocionCard />.
 *  5. Envío a domicilio: fondo naranja, título, subtítulo y botón "PIDE AHORA" con bicicleta.
 *  6. Footer oscuro: ya lo provee el componente global <Footer /> (bg-dark) en App.jsx.
 *  Extra: toda la customización visual vive en ./Inicio.css.
 */

import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaShoppingCart } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { obtenerCategorias } from '../../api/categorias';
import { obtenerMasVendidos } from '../../api/productos';
import { obtenerPromociones } from '../../api/promociones';
import ProductoCard from '../../components/cliente/ProductoCard';
import PromocionCard from '../../components/cliente/PromocionCard';
import './Inicio.css';

// Un DOS_POR_UNO equivale a un 50% de descuento: así se compara contra las
// promociones porcentuales para elegir las mejores.
const DESCUENTO_EQUIVALENTE = {
  DESCUENTO_PORCENTUAL: (valor) => Number(valor),
  DOS_POR_UNO: () => 50,
};

const mejoresPromociones = (promociones, limite = 3) =>
  promociones
    .map((promocion) => ({
      ...promocion,
      _descuento:
        DESCUENTO_EQUIVALENTE[promocion.tipo]?.(promocion.valor) ?? 0,
    }))
    .sort((a, b) => b._descuento - a._descuento)
    .slice(0, limite);

const Inicio = () => {
  const [categorias, setCategorias] = useState([]);
  const [masVendidos, setMasVendidos] = useState([]);
  const [promociones, setPromociones] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      const [resCategorias, resMasVendidos, resPromociones] = await Promise.all([
        obtenerCategorias(),
        obtenerMasVendidos(),
        obtenerPromociones(),
      ]);
      if (resCategorias.success) {
        setCategorias(
          resCategorias.data.map((cat) => ({
            id: cat.id,
            nombre: cat.nombre,
            imagen:
              cat.imagen ||
              `https://via.placeholder.com/150/FF9F1C/FFF?text=${encodeURIComponent(cat.nombre)}`,
          }))
        );
      }
      // Se muestran los más vendidos del día, no una lista fija: el backend los
      // calcula con las ventas reales y, si hoy no llegan a 3, completa con los
      // más caros para que la sección nunca quede vacía.
      if (resMasVendidos.success) {
        setMasVendidos(resMasVendidos.data);
      }
      // Las mejores 3 promociones activas del día: se ordena por descuento
      // equivalente (2x1 = 50%) y se cortan en 3, igual que los más vendidos.
      if (resPromociones.success) {
        setPromociones(mejoresPromociones(resPromociones.data));
      }
    };
    cargar();
  }, []);

  // MODIFICADO: Icono de bicicleta (SVG inline, sin dependencias extra).
  const BicicletaIcon = () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="16" cy="42" r="10" />
      <circle cx="48" cy="42" r="10" />
      <circle cx="26" cy="42" r="3" />
      <path d="M16 42h10" />
      <path d="M26 42v-2M28 42l-4 9" />
      <path d="M26 24v-2M26 42L28 24" />
      <path d="M28 24h10" />
      <path d="M28 42L44 32" />
      <path d="M44 32L42 20" />
      <path d="M28 24L42 20" />
      <path d="M42 20h12l-6-8" />
      <path d="M48 42L44 30" />
    </svg>
  );

  return (
    <>
      {/* ===================== 1. HERO ===================== */}
      <section className="inicio-hero">
        <Container>
          <Row className="align-items-center">
            {/* El "COMI … RAPI" partido alrededor de la hamburguesa es decorativo:
                se anuncia una sola vez con el h1 real y los dos trozos visuales
                se ocultan. Sin esto se leen dos h1 sueltos al navegar por
                encabezados. */}
            <h1 className="visually-hidden">Comi-Rapi, tu app de delivery de comida</h1>

            <Col md={4} className="text-center text-md-start" aria-hidden="true">
              <div className="inicio-hero-titulo">COMI</div>
            </Col>

            {/* Hamburguesa flotante en el centro (con ingredientes volando) */}
            <Col md={4} className="text-center position-relative hero-cola-burger" aria-hidden="true">
              {/* Ingredientes volando (decoración animada) */}
              <span className="ingrediente-volador iv-lechuga i1" />
              <span className="ingrediente-volador iv-tomate i2" />
              <span className="ingrediente-volador iv-queso i3" />
              <span className="ingrediente-volador iv-carne i4" />
              <span className="ingrediente-volador iv-semilla i5" />
              <span className="ingrediente-volador iv-lechuga i6" />

              {/* Hamburguesa hecha con CSS puro + animación flotar */}
              <div className="burger-flotante">
                <div className="burger">
                  <div className="pan-superior" />
                  <div className="ingrediente-lechuga" />
                  <div className="ingrediente-tomate" />
                  <div className="ingrediente-queso" />
                  <div className="carne" />
                  <div className="pan-inferior" />
                </div>
              </div>
            </Col>

            <Col md={4} className="text-center text-md-end" aria-hidden="true">
              <div className="inicio-hero-titulo">RAPI</div>
            </Col>
          </Row>

          <Row className="align-items-center mt-4">
            {/* Badge de Google Play (abajo a la izquierda).
                No es un enlace: la app todavía no tiene tienda donde enlazar, y un
                botón que no hace nada engaña más que un distintivo estático. */}
            <Col md={6} className="text-center text-md-start mb-4 mb-md-0">
              <div className="badge-google-play">
                <span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <span>
                  <span className="gp-texto-pequeno">Disponible en</span>
                  <br />
                  <span className="gp-texto-grande">Google Play</span>
                </span>
              </div>
            </Col>

            {/* Botón ORDENAR (abajo a la derecha). `as={Link}` deja un único
                elemento interactivo en vez de un Button anidado dentro de un
                Link, que duplicaba el nodo accesible y su tabulación. */}
            <Col md={6} className="text-center text-md-end">
              <Button
                as={Link}
                to="/cliente/catalogo"
                className="boton-ordenar d-inline-flex align-items-center gap-2"
                size="lg"
              >
                <FaShoppingCart aria-hidden="true" />
                ORDENAR
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ===================== 2. CATEGORÍAS ===================== */}
      <section className="py-5">
        <Container>
          <h2 className="seccion-titulo mb-4">NUESTRAS CATEGORÍAS</h2>
          <Row className="justify-content-center">
            {categorias.map((cat) => (
              <Col key={cat.id} xs={6} md={4} lg={2} className="mb-4 text-center">
                <Link
                  to={`/cliente/catalogo?categoria=${cat.id}`}
                  className="categoria-enlace"
                >
                  <div className="categoria-circulo">
                    {/* width/height reserves el espacio y evita el salto de layout
                        al cargar; lazy porque recién se ven si el usuario baja. */}
                    <img
                      src={cat.imagen}
                      alt={cat.nombre}
                      width={150}
                      height={150}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="categoria-nombre">{cat.nombre}</div>
                </Link>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ============ 3. MÁS VENDIDOS HOY ============ */}
      <section className="pb-5">
        <Container>
          <h2 className="seccion-titulo mb-4">MÁS VENDIDOS HOY</h2>
          <Row className="justify-content-center">
            {masVendidos.map((producto, index) => (
              <Col key={producto.id} md={4} className="mb-4">
                <ProductoCard producto={producto} rank={index + 1} />
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ============ 4. PROMOCIONES DEL DÍA ============ */}
      {promociones.length > 0 && (
        <section className="pb-5">
          <Container>
            <h2 className="seccion-titulo mb-4">PROMOCIONES DEL DÍA</h2>
            <Row className="justify-content-center">
              {promociones.map((promocion) => (
                <Col key={promocion.id} md={4} className="mb-4">
                  <PromocionCard promocion={promocion} />
                </Col>
              ))}
            </Row>
          </Container>
        </section>
      )}

      {/* ===================== 5. ENVÍO A DOMICILIO ===================== */}
      <section className="envio-section py-5">
        <Container className="text-center">
          <h2 className="seccion-titulo text-white mb-3">ENVÍO A DOMICILIO RÁPIDO</h2>
          <p className="envio-subtitulo mb-4">
            Pedí desde la app y recibí tu comida caliente, en tiempo récord y con seguimiento en vivo.
          </p>
          <Button
            as={Link}
            to="/cliente/catalogo"
            className="envio-boton d-inline-flex align-items-center gap-2"
            size="lg"
          >
            <BicicletaIcon />
            PIDE AHORA
          </Button>
        </Container>
      </section>

      {/* ===================== 6. FOOTER OSCURO ===================== */}
      {/* El footer oscuro ya lo renderiza el componente global <Footer /> (bg-dark)
          definido en src/components/comunes/Footer.jsx y montado en App.jsx. */}
    </>
  );
};

export default Inicio;
