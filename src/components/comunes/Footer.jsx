/**
 * Propósito: Pie de página estilo "fast food" para Comi-Rapi.
 * Contenido: Horarios, contacto y créditos.
 * Uso: <Footer /> en las pantallas de la tienda. AppLayout no lo monta en el
 *      panel de administración (ver esRutaDeAdmin en utils/rutas).
 */

import { Container, Row, Col } from 'react-bootstrap';
import { FaInstagram, FaFacebookSquare, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  const anio = new Date().getFullYear();

  return (
    <footer className="py-4 mt-5 bg-dark text-light">
      <Container>
        <Row>
          <Col md={4} className="mb-3">
            <h4 className="fw-bold mb-3">COMI-RAPI</h4>
            <p className="small mb-0">
              Pedí online y lo llevamos a tu puerta. Hamburguesas, pizzas, combos
              y mucho más.
            </p>
          </Col>
          <Col md={3} className="mb-3">
            <h5 className="mb-2">Horarios</h5>
            <ul className="list-unstyled small mb-0">
              <li>Lunes a Viernes: 11:00 – 23:00</li>
              <li>Sábados y Domingos: 11:00 – 00:00</li>
            </ul>
          </Col>
          <Col md={3} className="mb-3">
            <h5 className="mb-2">Atención al cliente</h5>
            <ul className="list-unstyled small mb-0">
              <li>WhatsApp: 11 5000-5000</li>
              <li>info@comirapi.com</li>
            </ul>
          </Col>
          <Col md={2} className="mb-3">
            <h5 className="mb-2">Seguinos</h5>
            <div className="d-flex gap-2">
              <a href="#" aria-label="Instagram" className="text-light fs-4">
                <FaInstagram />
              </a>
              <a href="#" aria-label="Facebook" className="text-light fs-4">
                <FaFacebookSquare />
              </a>
              <a href="#" aria-label="WhatsApp" className="text-light fs-4">
                <FaWhatsapp />
              </a>
            </div>
          </Col>
        </Row>
        <hr className="mt-3 mb-2 border-secondary" />
        <Row>
          <Col className="small text-center text-light">
            <span translate="no">&copy; {anio} COMI-RAPI</span> — Hecho para
            que no te quedes con hambre
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
