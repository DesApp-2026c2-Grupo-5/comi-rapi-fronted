import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Form, Button, Card, InputGroup } from 'react-bootstrap';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { TIPO_PERSONALIZACION } from '../../utils/constants';
import { validatePersonalizacionElemento, validatePlantillaCategoria } from '../../utils/validators';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { obtenerInsumos } from '../../api/insumos';
import './FormularioAdmin.css';

const FormularioPersonalizacion = ({
  elemento,
  productos = [],
  productoPreseleccionado,
  categoriaId,
  categoriaNombre,
  volverA,
  onGuardar,
}) => {
  const navigate = useNavigate();
  const { notificar } = useNotificaciones();

  // Modo plantilla por categoría: en vez de un producto concreto, el elemento
  // pertenece a una categoría y se copia a los productos nuevos.
  const categoriaEfectiva =
    categoriaId !== undefined && categoriaId !== null
      ? categoriaId
      : elemento?.categoriaId ?? '';
  const esModoCategoria = Boolean(categoriaEfectiva);

  const [productoId, setProductoId] = useState(elemento?.productoId ? String(elemento.productoId) : productoPreseleccionado ? String(productoPreseleccionado) : '');
  const [tipo, setTipo] = useState(elemento?.tipo || '');
  const [nombre, setNombre] = useState(elemento?.nombre || '');
  const [insumoId, setInsumoId] = useState(elemento?.insumoId ? String(elemento.insumoId) : '');
  const [insumos, setInsumos] = useState([]);
  const [precio, setPrecio] = useState(elemento?.precio ?? '');
  const [productoReferenciaId, setProductoReferenciaId] = useState(elemento?.productoReferenciaId ? String(elemento.productoReferenciaId) : '');
  const [minimo, setMinimo] = useState(elemento?.minimo ?? 0);
  const [maximo, setMaximo] = useState(elemento?.maximo ?? 1);
  const [activo, setActivo] = useState(elemento?.activo ?? true);

  // El catálogo de insumos se carga una sola vez. El superadmin recibe todos
  // (también los dados de baja) para poder conservar el vínculo de un elemento
  // existente aunque su insumo ya no se ofrezca.
  useEffect(() => {
    let vigente = true;
    obtenerInsumos().then((resultado) => {
      if (vigente && resultado.success) setInsumos(resultado.data || []);
    });
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    if (elemento && elemento.productoId) {
      setProductoId(String(elemento.productoId));
      setTipo(elemento.tipo || '');
      setNombre(elemento.nombre || '');
      setInsumoId(elemento.insumoId ? String(elemento.insumoId) : '');
      setPrecio(elemento.precio ?? '');
      setProductoReferenciaId(elemento.productoReferenciaId ? String(elemento.productoReferenciaId) : '');
      setMinimo(elemento.minimo ?? 0);
      setMaximo(elemento.maximo ?? 1);
      setActivo(elemento.activo ?? true);
    } else if (elemento) {
      // Elemento parcial (p. ej. "nuevo" con tipo preseleccionado): solo el
      // tipo viene dado; el producto se toma de la URL.
      setTipo(elemento.tipo || '');
      if (elemento.nombre) setNombre(elemento.nombre);
      if (elemento.insumoId) setInsumoId(String(elemento.insumoId));
      if (elemento.precio !== undefined) setPrecio(elemento.precio);
      if (elemento.productoReferenciaId) setProductoReferenciaId(String(elemento.productoReferenciaId));
      if (elemento.minimo !== undefined) setMinimo(elemento.minimo);
      if (elemento.maximo !== undefined) setMaximo(elemento.maximo);
      if (elemento.activo !== undefined) setActivo(elemento.activo);
      if (productoPreseleccionado) setProductoId(String(productoPreseleccionado));
    } else if (productoPreseleccionado) {
      setProductoId(String(productoPreseleccionado));
    }
  }, [elemento, productoPreseleccionado]);

  const productosDisponiblesParaReferencia = useMemo(
    () =>
      productos.filter(
        (p) => esModoCategoria || String(p.id) !== String(productoId)
      ),
    [productos, productoId, esModoCategoria]
  );

  // Para extra/condimento el nombre ya no se escribe a mano: sale del catálogo
  // de insumos. Se muestran los activos y, si el elemento ya estaba vinculado,
  // también su insumo aunque esté dado de baja (para no perder el vínculo).
  const esExtraOCondimento =
    tipo === TIPO_PERSONALIZACION.EXTRA ||
    tipo === TIPO_PERSONALIZACION.CONDIMENTO;
  const insumosDisponibles = useMemo(
    () =>
      insumos.filter(
        (insumo) =>
          insumo.tipo === tipo &&
          (insumo.activo || String(insumo.id) === String(insumoId))
      ),
    [insumos, tipo, insumoId]
  );

  const handleTipoChange = (e) => {
    const nuevo = e.target.value;
    setTipo(nuevo);
    if (nuevo === 'acompanar') {
      // precio se deja editable, no se limpia
    }
    if (nuevo === 'personalizar' || nuevo === 'condimento') {
      setPrecio('');
      setProductoReferenciaId('');
    }
    if (nuevo === 'extra') {
      setProductoReferenciaId('');
    }
    // El insumo depende del tipo: al cambiarlo hay que elegir uno nuevo.
    if (
      nuevo !== TIPO_PERSONALIZACION.EXTRA &&
      nuevo !== TIPO_PERSONALIZACION.CONDIMENTO
    ) {
      setInsumoId('');
    } else if (nuevo !== tipo) {
      setInsumoId('');
    }
  };

  const handleInsumoChange = (e) => {
    const valor = e.target.value;
    setInsumoId(valor);
    const insumo = insumos.find((i) => String(i.id) === String(valor));
    if (!insumo) return;
    setNombre(insumo.nombre);
    // El insumo define el precio base; el elemento puede pisarlo después.
    setPrecio(insumo.tipo === 'extra' ? insumo.precio ?? '' : '');
  };

  const handleReferenciaChange = (e) => {
    const val = e.target.value;
    setProductoReferenciaId(val);
    if (val) {
      const prod = productos.find((p) => String(p.id) === String(val));
      if (prod) {
        // Precarga editable: si precio vacío o 0, poner el del producto
        if (precio === '' || precio == null) setPrecio(String(prod.precio));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const datosBase = {
      ...(esModoCategoria
        ? { categoriaId: Number(categoriaEfectiva) }
        : { productoId: productoId ? Number(productoId) : null }),
      tipo,
      activo,
      minimo: Number(minimo),
      maximo: Number(maximo),
    };

    let datos = { ...datosBase };

    if (tipo === 'acompanar') {
      const refProd = productos.find((p) => String(p.id) === String(productoReferenciaId));
      datos.productoReferenciaId = productoReferenciaId ? Number(productoReferenciaId) : null;
      datos.precio = precio !== '' ? Number(precio) : null;
      datos.nombre = refProd ? refProd.nombre : nombre.trim();
      datos.insumoId = null;
    } else if (esExtraOCondimento) {
      const insumo = insumos.find((i) => String(i.id) === String(insumoId));
      datos.insumoId = insumoId ? Number(insumoId) : null;
      datos.nombre = insumo ? insumo.nombre : nombre.trim();
      datos.precio = tipo === 'extra' ? (precio !== '' ? Number(precio) : null) : null;
      datos.productoReferenciaId = null;
    } else {
      datos.nombre = nombre.trim();
      datos.precio = tipo === 'extra' ? (precio !== '' ? Number(precio) : null) : null;
      datos.productoReferenciaId = null;
      datos.insumoId = null;
    }

    const errores = esModoCategoria
      ? validatePlantillaCategoria({ ...datos, productos })
      : validatePersonalizacionElemento({ ...datos, productos });
    if (Object.keys(errores).length > 0) {
      notificar(Object.values(errores).join(' '), 'warning');
      return;
    }

    if (onGuardar) onGuardar(datos);
  };

  const handleCancelar = () => {
    if (volverA) {
      navigate(volverA);
      return;
    }
    if (esModoCategoria) {
      const query = categoriaEfectiva ? `?categoriaId=${categoriaEfectiva}` : '';
      navigate(`/superadmin/personalizacion/categorias${query}`);
      return;
    }
    if (productoId) navigate(`/superadmin/personalizacion?productoId=${productoId}`);
    else navigate('/superadmin/personalizacion');
  };

  const esAcompanar = tipo === TIPO_PERSONALIZACION.ACOMPANAR;
  const esPersonalizarOCondimento = tipo === TIPO_PERSONALIZACION.PERSONALIZAR || tipo === TIPO_PERSONALIZACION.CONDIMENTO;

  return (
    <Card className="shadow-sm formulario-admin-card formulario-admin-card-personalizacion">
      <Card.Body>
        <Form onSubmit={handleSubmit} noValidate>
          {esModoCategoria ? (
            <Form.Group className="mb-3" controlId="personalizacion-categoria">
              <Form.Label>Categoría *</Form.Label>
              <Form.Control
                plaintext
                readOnly
                value={
                  categoriaNombre || `Categoría #${categoriaEfectiva}`
                }
              />
              <Form.Text className="text-muted">
                La plantilla se copia automáticamente a los productos nuevos
                de esta categoría.
              </Form.Text>
            </Form.Group>
          ) : (
            <Form.Group className="mb-3" controlId="personalizacion-producto">
              <Form.Label>Producto *</Form.Label>
              <Form.Select name="productoId" value={productoId} onChange={(e) => setProductoId(e.target.value)}>
                <option value="">— Elegí producto —</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — {p.categoria} — ${p.precio}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          <Form.Group className="mb-3" controlId="personalizacion-tipo">
            <Form.Label>Categoría / Tipo *</Form.Label>
            <Form.Select name="tipo" value={tipo} onChange={handleTipoChange}>
              <option value="">— Elegí categoría —</option>
              <option value={TIPO_PERSONALIZACION.EXTRA}>Extra — Agregar ingrediente (cobra)</option>
              <option value={TIPO_PERSONALIZACION.PERSONALIZAR}>Personalizar — Quitar ingrediente (no cobra)</option>
              <option value={TIPO_PERSONALIZACION.ACOMPANAR}>Acompaña tu orden con — Upsell (cobra)</option>
              <option value={TIPO_PERSONALIZACION.CONDIMENTO}>Condimentos adicionales — Sobre (no cobra)</option>
            </Form.Select>
          </Form.Group>

          {esModoCategoria &&
            tipo === TIPO_PERSONALIZACION.PERSONALIZAR && (
              <Form.Text className="text-muted d-block mb-3">
                Los ingredientes ya no se heredan por categoría: cargalos en el
                campo &quot;Ingredientes&quot; del formulario de cada producto.
              </Form.Text>
            )}

          {!esAcompanar && esExtraOCondimento && (
            <Form.Group className="mb-3" controlId="personalizacion-insumo">
              <Form.Label>Insumo *</Form.Label>
              <Form.Select
                name="insumoId"
                value={insumoId}
                onChange={handleInsumoChange}
                required
              >
                <option value="">— Elegí un insumo —</option>
                {insumosDisponibles.map((insumo) => (
                  <option key={insumo.id} value={insumo.id}>
                    {insumo.nombre}
                    {insumo.activo ? '' : ' (dado de baja)'}
                    {tipo === TIPO_PERSONALIZACION.EXTRA && insumo.precio !== null
                      ? ` — $${insumo.precio}`
                      : ''}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                {insumosDisponibles.length === 0
                  ? 'No hay insumos de este tipo. Creá uno en Catálogo → Insumos.'
                  : 'El insumo define el nombre y el precio base; el precio se puede pisar abajo.'}
              </Form.Text>
            </Form.Group>
          )}

          {!esAcompanar && !esExtraOCondimento && (
            <Form.Group className="mb-3" controlId="personalizacion-nombre">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={tipo === 'personalizar' ? 'Ej: Queso Cheddar en fetas' : 'Ej: Bacon'}
                required
              />
              {tipo === 'personalizar' && <Form.Text className="text-muted">Se mostrará como &quot;Sin {nombre || 'X'}&quot;</Form.Text>}
            </Form.Group>
          )}

          {esAcompanar && (
            <Form.Group className="mb-3" controlId="personalizacion-producto-referencia">
              <Form.Label>Producto a ofrecer *</Form.Label>
              <Form.Select
                name="productoReferenciaId"
                value={productoReferenciaId}
                onChange={handleReferenciaChange}
                disabled={!esModoCategoria && !productoId}
                aria-describedby={!esModoCategoria && !productoId ? 'personalizacion-referencia-ayuda' : 'personalizacion-referencia-nota'}
              >
                <option value="">— Elegí producto para ofrecer —</option>
                {productosDisponiblesParaReferencia.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — {p.categoria} — ${p.precio}
                  </option>
                ))}
              </Form.Select>
              {!esModoCategoria && !productoId && (
                /* role="alert": es un error de validación, no una nota informativa. */
                <Form.Text id="personalizacion-referencia-ayuda" role="alert" className="text-danger">
                  Elegí primero el producto.
                </Form.Text>
              )}
              {(esModoCategoria || productoId) && (
                <Form.Text id="personalizacion-referencia-nota" className="text-muted">
                  {esModoCategoria
                    ? 'Se ofrecerá en todos los productos nuevos de la categoría. Precio precargado editable.'
                    : 'Se excluye el producto que estás personalizando. Precio precargado editable.'}
                </Form.Text>
              )}
            </Form.Group>
          )}

          {!esPersonalizarOCondimento && (
            <Form.Group className="mb-3" controlId="personalizacion-precio">
              <Form.Label>Precio $ *</Form.Label>
              <InputGroup>
                <InputGroup.Text className="precio-adorno">$</InputGroup.Text>
                <Form.Control
                  type="number"
                  name="precio"
                  className="precio-input"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="2700"
                  min="0"
                  step="100"
                  inputMode="numeric"
                  required
                  aria-describedby="personalizacion-precio-ayuda"
                />
              </InputGroup>
              <Form.Text id="personalizacion-precio-ayuda" className="text-muted">
                {esAcompanar ? 'Editable — default del producto elegido. Podés poner promo.' : 'Requerido para Extra — suma al total.'}
              </Form.Text>
            </Form.Group>
          )}

          <Form.Group className="mb-3" controlId="personalizacion-cantidades">
            <Form.Label>Cantidad mínima y máxima</Form.Label>
            <div className="row g-2">
              <div className="col-6">
                <InputGroup>
                  <InputGroup.Text className="precio-adorno">Mín</InputGroup.Text>
                  <Form.Control
                    type="number"
                    name="minimo"
                    value={minimo}
                    onChange={(e) => setMinimo(e.target.value)}
                    min="0"
                    step="1"
                    inputMode="numeric"
                    aria-describedby="personalizacion-cantidades-ayuda"
                  />
                </InputGroup>
              </div>
              <div className="col-6">
                <InputGroup>
                  <InputGroup.Text className="precio-adorno">Máx</InputGroup.Text>
                  <Form.Control
                    type="number"
                    name="maximo"
                    value={maximo}
                    onChange={(e) => setMaximo(e.target.value)}
                    min="1"
                    step="1"
                    inputMode="numeric"
                    aria-describedby="personalizacion-cantidades-ayuda"
                  />
                </InputGroup>
              </div>
            </div>
            <Form.Text id="personalizacion-cantidades-ayuda" className="text-muted">
              Cuántas unidades de ESTE elemento puede elegir el cliente. Mínimo 0 = opcional, máximo 1 = una sola. Por defecto: mín 0, máx 1.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Check type="switch" id="activo-switch" name="activo" label="Activo" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          </Form.Group>

          <div className="d-flex gap-2">
            <Button variant="primary" type="submit" className="flex-fill">
              <FaSave className="me-1" aria-hidden="true" /> Guardar
            </Button>
            <Button variant="secondary" type="button" onClick={handleCancelar} className="flex-fill">
              <FaTimes className="me-1" aria-hidden="true" /> Cancelar
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

FormularioPersonalizacion.propTypes = {
  elemento: PropTypes.object,
  productos: PropTypes.arrayOf(PropTypes.object),
  productoPreseleccionado: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  categoriaId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  categoriaNombre: PropTypes.string,
  volverA: PropTypes.string,
  onGuardar: PropTypes.func,
};

export default FormularioPersonalizacion;
