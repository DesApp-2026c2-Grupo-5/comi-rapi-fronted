/**
 * Propósito: Formulario para crear/editar promociones con selector
 *            multi-producto (solo productos activos).
 * Contenido: Componente FormularioPromocion con campos controlados (nombre,
 *            descripcion, tipo, valor, fechas, activa) y checkboxes de productos.
 *            Valida en espejo al backend (tipo, valor 0-100 en porcentual,
 *            fechaFin >= fechaInicio). Devuelve productoIds; la página debe
 *            sincronizar los vínculos (asignar/quitar).
 * Dependencias: react-bootstrap (Form, Button, Card, Spinner, Alert),
 *               react-icons (FaSave), api/productos.js, useNotificaciones.
 * Uso: <FormularioPromocion promocion={promo} productoIdsIniciales={[...]} onGuardar={handler} />
 */

import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { FaSave } from 'react-icons/fa';
import { obtenerProductos } from '../../api/productos';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import './FormularioAdmin.css';

const TIPOS = [
  { valor: 'DESCUENTO_PORCENTUAL', etiqueta: 'Porcentual (%)' },
  { valor: 'DOS_POR_UNO', etiqueta: '2x1 (llevás 2, pagás 1)' },
];

const FormularioPromocion = ({ promocion, productoIdsIniciales, onGuardar }) => {
  const { notificar } = useNotificaciones();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('DESCUENTO_PORCENTUAL');
  const [valor, setValor] = useState('10');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [activa, setActiva] = useState(true);
  const [productos, setProductos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (promocion) {
      setNombre(promocion.nombre || '');
      setDescripcion(promocion.descripcion || '');
      setTipo(promocion.tipo || 'DESCUENTO_PORCENTUAL');
      setValor(
        promocion.valor !== undefined && promocion.valor !== null
          ? String(promocion.valor)
          : '10'
      );
      setFechaInicio(
        promocion.fechaInicio ? String(promocion.fechaInicio).slice(0, 10) : ''
      );
      setFechaFin(
        promocion.fechaFin ? String(promocion.fechaFin).slice(0, 10) : ''
      );
      setActiva(promocion.activa !== false);
    }
  }, [promocion]);

  useEffect(() => {
    setSeleccionados(
      Array.isArray(productoIdsIniciales)
        ? productoIdsIniciales.map((id) => String(id))
        : []
    );
  }, [productoIdsIniciales]);

  useEffect(() => {
    const cargar = async () => {
      setCargandoProductos(true);
      setErrorProductos('');
      const result = await obtenerProductos();
      if (result.success) {
        setProductos(result.data);
      } else {
        setErrorProductos(result.error || 'No se pudieron cargar los productos.');
      }
      setCargandoProductos(false);
    };
    cargar();
  }, []);

  const toggleProducto = (id) => {
    const clave = String(id);
    setSeleccionados((prev) =>
      prev.includes(clave) ? prev.filter((x) => x !== clave) : [...prev, clave]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      notificar('El nombre es obligatorio.', 'warning');
      return;
    }
    if (!TIPOS.some((t) => t.valor === tipo)) {
      notificar('Tipo de promoción inválido.', 'warning');
      return;
    }
    const valorNumero = Number(valor);
    if (Number.isNaN(valorNumero) || valorNumero < 0) {
      notificar('El valor debe ser un número mayor o igual a 0.', 'warning');
      return;
    }
    if (tipo === 'DESCUENTO_PORCENTUAL' && valorNumero > 100) {
      notificar('El descuento porcentual no puede superar 100.', 'warning');
      return;
    }
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      notificar(
        'La fecha de fin no puede ser anterior a la de inicio.',
        'warning'
      );
      return;
    }

    if (onGuardar) {
      onGuardar({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        tipo,
        valor: valorNumero,
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        activa,
        productoIds: seleccionados.map((id) => Number(id)),
      });
    }
  };

  const esDosPorUno = tipo === 'DOS_POR_UNO';
  const productosFiltrados = productos.filter((producto) =>
    busqueda
      ? producto.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
      : true
  );

  return (
    <Card className="shadow-sm formulario-admin-card formulario-admin-card-ancho">
      <Card.Body>
        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group className="mb-3" controlId="promocion-nombre">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de la promoción"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="promocion-descripcion">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              name="descripcion"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de la promoción"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="promocion-tipo">
            <Form.Label>Tipo *</Form.Label>
            <Form.Select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {TIPOS.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="promocion-valor">
            <Form.Label>Valor *</Form.Label>
            <Form.Control
              type="number"
              name="valor"
              min="0"
              max={esDosPorUno ? undefined : 100}
              value={esDosPorUno ? 50 : valor}
              disabled={esDosPorUno}
              onChange={(e) => setValor(e.target.value)}
              inputMode="numeric"
              required
            />
            <Form.Text className="text-muted">
              {esDosPorUno
                ? '2x1 literal: llevás 2 y pagás 1. Se guarda 50 por convención y se ignora en el cálculo.'
                : 'Porcentaje de descuento (0–100).'}
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="promocion-fecha-inicio">
            <Form.Label>Vigente desde</Form.Label>
            <Form.Control
              type="date"
              name="fechaInicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="promocion-fecha-fin">
            <Form.Label>Vigente hasta</Form.Label>
            <Form.Control
              type="date"
              name="fechaFin"
              value={fechaFin}
              min={fechaInicio || undefined}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="promocion-activa">
            <Form.Check
              type="switch"
              id="promocion-activa"
              name="activa"
              label="Promoción activa"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="promocion-busqueda-producto">
            <Form.Label>
              Productos alcanzados ({seleccionados.length} seleccionados)
            </Form.Label>
            <Form.Control
              type="search"
              name="busquedaProducto"
              className="mb-2"
              placeholder="Buscar producto…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            {cargandoProductos ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" variant="danger" />
              </div>
            ) : errorProductos ? (
              <Alert variant="danger" role="alert" className="py-2">
                {errorProductos}
              </Alert>
            ) : (
              /* fieldset/legend: la lista de checkboxes comparte un mismo rótulo
                 ("Productos alcanzados"), no son campos independientes sueltos. */
              <fieldset className="promocion-lista-productos">
                <legend className="visually-hidden">
                  Productos alcanzados por la promoción
                </legend>
                {productosFiltrados.map((producto) => (
                  <Form.Check
                    key={producto.id}
                    type="checkbox"
                    id={`promo-prod-${producto.id}`}
                    name="productosAlcanzados"
                    value={producto.id}
                    label={`${producto.nombre} — $${producto.precio}`}
                    checked={seleccionados.includes(String(producto.id))}
                    onChange={() => toggleProducto(producto.id)}
                  />
                ))}
                {productosFiltrados.length === 0 && (
                  <span className="text-muted small">
                    No hay productos que coincidan.
                  </span>
                )}
              </fieldset>
            )}
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100">
            <FaSave className="me-1" aria-hidden="true" />
            Guardar cambios
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FormularioPromocion;
