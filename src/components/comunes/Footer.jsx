/**
 * Propósito: Pie de página de marca para Comi-Rapi.
 * Contenido: Marca con logo, horarios, contacto, redes y créditos.
 * Dependencias: react-bootstrap, react-icons, logo SVG (public/imagenes),
 *   Footer.css (superficie crema y tipografía de marca).
 * Uso: <Footer /> en las pantallas de la tienda. AppLayout no lo monta en el
 *      panel de administración (ver esRutaDeAdmin en utils/rutas).
 */

import { Container, Row, Col } from 'react-bootstrap';
import { FaInstagram, FaFacebookSquare, FaWhatsapp } from 'react-icons/fa';

import './Footer.css';

const Footer = () => {
  const anio = new Date().getFullYear();

  return (
    <footer className="footer-comirapi py-4 mt-5">
      <Container>
        <Row>
          <Col md={4} className="mb-3">
            <span className="footer-marca">
              <img src="/imagenes/logo-comirapi.svg" alt="" aria-hidden="true" />
              <span translate="no">Comi-Rapi</span>
            </span>
            <p className="footer-texto mb-0">
              Pedí online y lo llevamos a tu puerta. Hamburguesas, pizzas, combos
              y mucho más.
            </p>
          </Col>
          <Col md={3} className="mb-3">
            <h5 className="footer-titulo">Horarios</h5>
            <ul className="list-unstyled footer-lista mb-0">
              <li>Lunes a Viernes: 11:00 – 23:00</li>
              <li>Sábados y Domingos: 11:00 – 00:00</li>
            </ul>
          </Col>
          <Col md={3} className="mb-3">
            <h5 className="footer-titulo">Atención al cliente</h5>
            <ul className="list-unstyled footer-lista mb-0">
              <li>WhatsApp: 11 5000-5000</li>
              <li>info@comirapi.com</li>
            </ul>
          </Col>
          <Col md={2} className="mb-3">
            <h5 className="footer-titulo">Seguinos</h5>
            <div className="d-flex gap-2">
              <a href="#" aria-label="Instagram" className="footer-red">
                <FaInstagram />
              </a>
              <a href="#" aria-label="Facebook" className="footer-red">
                <FaFacebookSquare />
              </a>
              <a href="#" aria-label="WhatsApp" className="footer-red">
                <FaWhatsapp />
              </a>
            </div>
          </Col>
        </Row>
        <hr className="footer-separador mt-3 mb-2" />
        <Row>
          <Col className="footer-cierre text-center">
            <span translate="no">&copy; {anio} COMI-RAPI</span> — Hecho para
            que no te quedes con hambre
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
