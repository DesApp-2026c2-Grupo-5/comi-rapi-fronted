/**
 * Propósito: Formulario para crear/editar promociones con selector
 *            multi-producto (solo productos activos, nunca combos: el combo ya
 *            es la promoción).
 * Contenido: Componente FormularioPromocion con campos controlados (nombre,
 *            descripcion, tipo, valor, fechas, activa) y checkboxes de productos.
 *            Valida en espejo al backend (tipo, valor 0-porcentajeMaximo en
 *            porcentual, fechaFin >= fechaInicio). Devuelve productoIds; la
 *            página debe sincronizar los vínculos (asignar/quitar).
 * Dependencias: react-bootstrap (Form, Button, Card, Spinner, Alert),
 *               react-icons (FaSave), prop-types, api/productos.js,
 *               useNotificaciones.
 * Uso: <FormularioPromocion promocion={promo} productoIdsIniciales={[...]} onGuardar={handler} />
 *
 * Opcionales: promocion (null al crear una nueva), productoIdsIniciales y
 * onGuardar (EditarPromocion lo pasa en undefined mientras guarda, para dejar
 * el formulario sin acción).
 */

import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { FaSave } from 'react-icons/fa';
import { obtenerProductos } from '../../api/productos';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { useParametros } from '../../hooks/useParametros';
import './FormularioAdmin.css';

const TIPOS = [
  { valor: 'DESCUENTO_PORCENTUAL', etiqueta: 'Porcentual (%)' },
  { valor: 'DOS_POR_UNO', etiqueta: '2x1 (llevás 2, pagás 1)' },
];

/**
 * Nombre de la categoría de un producto, como texto.
 *
 * El backend devuelve `categoria` ya resuelta (string) en `GET /productos`, pero
 * en otros puntos del dominio viene como objeto. Se contemplan las dos formas y
 * se cae a 'Sin categoría': el `categoriaId` no sirve como etiqueta (es un
 * número) y mezclar números con strings en el `sort` de la lista de categorías
 * revienta con `localeCompare is not a function`.
 *
 * @param {object} producto - Producto con `categoria` y/o `categoriaId`.
 * @returns {string} Nombre de la categoría.
 */
const nombreCategoria = (producto) => {
  const cat = producto?.categoria;
  if (typeof cat === 'string' && cat.trim()) return cat.trim();
  if (cat && typeof cat === 'object' && cat.nombre) return cat.nombre;
  return 'Sin categoría';
};

const FormularioPromocion = ({ promocion, productoIdsIniciales, onGuardar }) => {
  const { notificar } = useNotificaciones();
  const { parametros } = useParametros();
  const porcentajeMaximo = parametros.porcentajeMaximoDescuento;
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
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');

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
        quitarCombosSeleccionados(result.data);
      } else {
        setErrorProductos(result.error || 'No se pudieron cargar los productos.');
      }
      setCargandoProductos(false);
    };
    cargar();
  }, []);

  /**
   * Un combo no puede ser alcanzado por una promoción (su precio ya es la
   * promoción respecto de sus componentes), así que no se ofrece para marcar.
   * Si la promoción guardada tenía un combo, se lo quita al guardar.
   */
  const quitarCombosSeleccionados = (lista) => {
    const idsCombo = (lista || [])
      .filter((p) => p.tipo === 'COMBO')
      .map((p) => String(p.id));
    if (idsCombo.length === 0) return;
    setSeleccionados((prev) => prev.filter((id) => !idsCombo.includes(id)));
  };

  const toggleProducto = (id) => {
    const clave = String(id);
    setSeleccionados((prev) =>
      prev.includes(clave) ? prev.filter((x) => x !== clave) : [...prev, clave]
    );
  };

  const seleccionarCategoria = () => {
    if (!categoriaSeleccionada) return;
    const ids = productosDeCategoria.map((p) => String(p.id));
    setSeleccionados((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const deseleccionarCategoria = () => {
    if (!categoriaSeleccionada) return;
    const ids = new Set(productosDeCategoria.map((p) => String(p.id)));
    setSeleccionados((prev) => prev.filter((x) => !ids.has(x)));
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
    if (tipo === 'DESCUENTO_PORCENTUAL' && valorNumero > porcentajeMaximo) {
      notificar(
        `El descuento porcentual no puede superar ${porcentajeMaximo}.`,
        'warning'
      );
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
        productoIds: seleccionados
          .filter((id) => !idsCombo.has(id))
          .map((id) => Number(id)),
      });
    }
  };

  const esDosPorUno = tipo === 'DOS_POR_UNO';
  const idsCombo = new Set(
    productos.filter((p) => p.tipo === 'COMBO').map((p) => String(p.id))
  );
  const productosAlcanzables = productos.filter((p) => p.tipo !== 'COMBO');
  const productosFiltrados = productosAlcanzables.filter((producto) =>
    busqueda
      ? producto.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
      : true
  );
  const categorias = React.useMemo(() => {
    const map = new Map();
    for (const p of productosAlcanzables) {
      const cat = nombreCategoria(p);
      map.set(cat, (map.get(cat) || 0) + 1);
    }
    return Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
  }, [productosAlcanzables]);
  const productosDeCategoria = React.useMemo(() => {
    if (!categoriaSeleccionada) return [];
    return productosAlcanzables.filter(
      (p) => nombreCategoria(p) === categoriaSeleccionada
    );
  }, [productosAlcanzables, categoriaSeleccionada]);

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
              max={esDosPorUno ? undefined : porcentajeMaximo}
              value={esDosPorUno ? 50 : valor}
              disabled={esDosPorUno}
              onChange={(e) => setValor(e.target.value)}
              inputMode="numeric"
              required
            />
            <Form.Text className="text-muted">
              {esDosPorUno
                ? '2x1 literal: llevás 2 y pagás 1. Se guarda 50 por convención y se ignora en el cálculo.'
                : `Porcentaje de descuento (0–${porcentajeMaximo}).`}
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
          <Form.Group className="mb-3" controlId="promocion-categoria">
            <Form.Label>Seleccionar por categoría</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              <Form.Select
                className="flex-grow-1"
                style={{ maxWidth: '320px' }}
                value={categoriaSeleccionada}
                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              >
                <option value="">Elegir categoría</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Form.Select>
              <Button
                variant="outline-primary"
                type="button"
                onClick={seleccionarCategoria}
                disabled={!categoriaSeleccionada}
              >
                Marcar todos de esta categoría
              </Button>
              <Button
                variant="outline-secondary"
                type="button"
                onClick={deseleccionarCategoria}
                disabled={!categoriaSeleccionada}
              >
                Desmarcar todos de esta categoría
              </Button>
            </div>
            <Form.Text className="text-muted">
              Esto marca/desmarca todos los productos de esa categoría.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
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

FormularioPromocion.propTypes = {
  // `null` al crear una promoción nueva: el componente arranca con los valores
  // por defecto y solo precarga cuando viene una existente.
  promocion: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nombre: PropTypes.string,
    descripcion: PropTypes.string,
    tipo: PropTypes.oneOf(['DESCUENTO_PORCENTUAL', 'DOS_POR_UNO']),
    // La columna es DECIMAL(10,2) y Postgres la devuelve como string, no como
    // número: por eso el form la normaliza con String()/Number().
    valor: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    // DATE: el backend las serializa a ISO (yyyy-mm-ddTHH:mm:ss.sssZ) y el
    // form las recorta a yyyy-mm-dd para el input[type=date].
    fechaInicio: PropTypes.string,
    fechaFin: PropTypes.string,
    activa: PropTypes.bool,
  }),
  // IDs de los productos ya vinculados; el form los pasa a string para poder
  // compararlos con los que devuelve GET /productos.
  productoIdsIniciales: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  ),
  onGuardar: PropTypes.func,
};
