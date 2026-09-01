/**
 * Propósito: Página de inicio del cliente con hero, categorías, favoritos y envío a domicilio.
 * Contenido: Hero naranja (COMI + hamburguesa flotante + RAPI), 5 categorías circulares,
 *            favoritos de la semana, sección de envío a domicilio.
 * Dependencias: react-bootstrap (Container, Row, Col, Button), react-router-dom (Link),
 *               seedData.js, ProductoCard, Inicio.css.
 * Uso: Ruta "/cliente/inicio" → <Inicio />
 *
 * CAMBIOS REALIZADOS:
 *  1. Hero: fondo #FF9F1C, "COMI"/"RAPI" en blanco + hamburguesa flotante centrada
 *     (no se superponen porque cada uno ocupa una columna propia en filas del Row).
 *     Badge de Google Play abajo a la izquierda y botón ORDENAR abajo a la derecha.
 *  2. Categorías: 5 cards circulares (Hamburguesas, Combos, Papas, Bebidas, Postres).
 *  3. Favoritos de la semana: 3 products reutilizando <ProductoCard /> para
 *     mantener un estilo idéntico con el catálogo.
 *  4. Envío a domicilio: fondo naranja, título, subtítulo y botón "PIDE AHORA" con bicicleta.
 *  5. Footer oscuro: ya lo provee el componente global <Footer /> (bg-dark) en App.jsx.
 *  Extra: toda la customización visual vive en ./Inicio.css.
 */

import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaShoppingCart } from 'react-icons/fa';
import { productosMock } from '../../services/seedData';
import ProductoCard from '../../components/cliente/ProductoCard';
import './Inicio.css';

const Inicio = () => {
  // MOCK - reemplazar por llamada a la API de categorías.
  const categorias = [
    { id: 1, nombre: 'Hamburguesas', imagen: 'https://via.placeholder.com/150/C0392B/FFF?text=Hamburguesas' },
    { id: 2, nombre: 'Combos', imagen: 'https://via.placeholder.com/150/F39C12/FFF?text=Combos' },
    { id: 3, nombre: 'Papas', imagen: 'https://via.placeholder.com/150/F1C40F/FFF?text=Papas' },
    { id: 4, nombre: 'Bebidas', imagen: 'https://via.placeholder.com/150/3498DB/FFF?text=Bebidas' },
    { id: 5, nombre: 'Postres', imagen: 'https://via.placeholder.com/150/E91E63/FFF?text=Postres' },
  ];

  // MOCK - favoritos de la semana elegidos del seed de productos.
  const favoritos = productosMock.filter((p) => [1, 3, 5].includes(p.id));

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
            {/* COMI a la izquierda */}
            <Col md={4} className="text-center text-md-start">
              <h1 className="inicio-hero-titulo">COMI</h1>
            </Col>

            {/* Hamburguesa flotante en el centro (con ingredientes volando) */}
            <Col md={4} className="text-center position-relative hero-cola-burger">
              {/* Ingredientes volando (decoración animada) */}
              <span className="ingrediente-volador iv-lechuga i1" aria-hidden="true" />
              <span className="ingrediente-volador iv-tomate i2" aria-hidden="true" />
              <span className="ingrediente-volador iv-queso i3" aria-hidden="true" />
              <span className="ingrediente-volador iv-carne i4" aria-hidden="true" />
              <span className="ingrediente-volador iv-semilla i5" aria-hidden="true" />
              <span className="ingrediente-volador iv-lechuga i6" aria-hidden="true" />

              {/* Hamburguesa hecha con CSS puro + animación flotar */}
              <div className="burger-flotante" aria-hidden="true">
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

            {/* RAPI a la derecha */}
            <Col md={4} className="text-center text-md-end">
              <h1 className="inicio-hero-titulo">RAPI</h1>
            </Col>
          </Row>

          <Row className="align-items-center mt-4">
            {/* Badge de Google Play (abajo a la izquierda) */}
            <Col md={6} className="text-center text-md-start mb-4 mb-md-0">
              <a
                href="#"
                role="button"
                className="badge-google-play"
                aria-label="Disponible en Google Play"
              >
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
              </a>
            </Col>

            {/* Botón ORDENAR (abajo a la derecha) */}
            <Col md={6} className="text-center text-md-end">
              <Link to="/cliente/catalogo">
                <Button className="boton-ordenar d-inline-flex align-items-center gap-2" size="lg">
                  <FaShoppingCart aria-hidden="true" />
                  ORDENAR
                </Button>
              </Link>
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
              <Col key={cat.id} xs={6} md={4} lg className="mb-4 text-center">
                <Link to="/cliente/catalogo" className="categoria-enlace">
                  <div className="categoria-circulo">
                    <img src={cat.imagen} alt={cat.nombre} />
                  </div>
                  <div className="categoria-nombre">{cat.nombre}</div>
                </Link>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ===================== 3. FAVORITOS DE LA SEMANA ===================== */}
      <section className="pb-5">
        <Container>
          <h2 className="seccion-titulo mb-4">FAVORITOS DE LA SEMANA</h2>
          <Row className="justify-content-center">
            {favoritos.map((producto) => (
              <Col key={producto.id} md={4} className="mb-4">
                <ProductoCard producto={producto} />
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ===================== 4. ENVÍO A DOMICILIO ===================== */}
      <section className="envio-section py-5">
        <Container className="text-center">
          <h2 className="seccion-titulo text-white mb-3">ENVÍO A DOMICILIO RÁPIDO</h2>
          <p className="envio-subtitulo mb-4">
            Pedí desde la app y recibí tu comida caliente, en tiempo récord y con seguimiento en vivo.
          </p>
          <Link to="/cliente/catalogo">
            <Button className="envio-boton d-inline-flex align-items-center gap-2" size="lg">
              <BicicletaIcon />
              PIDE AHORA
            </Button>
          </Link>
        </Container>
      </section>

      {/* ===================== 5. FOOTER OSCURO ===================== */}
      {/* El footer oscuro ya lo renderiza el componente global <Footer /> (bg-dark)
          definido en src/components/comunes/Footer.jsx y montado en App.jsx. */}
    </>
  );
};

export default Inicio;