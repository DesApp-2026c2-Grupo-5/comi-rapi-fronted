import React, { useState, useEffect, useMemo } from 'react';
import { Form, Button, Card, InputGroup } from 'react-bootstrap';
import { FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { TIPO_PERSONALIZACION } from '../../utils/constants';
import { validatePersonalizacionElemento } from '../../utils/validators';
import { productosMock } from '../../services/seedData';

const FormularioPersonalizacion = ({ elemento, productos = productosMock, productoPreseleccionado, onGuardar }) => {
  const navigate = useNavigate();

  const [productoId, setProductoId] = useState(elemento?.productoId ? String(elemento.productoId) : productoPreseleccionado ? String(productoPreseleccionado) : '');
  const [tipo, setTipo] = useState(elemento?.tipo || '');
  const [nombre, setNombre] = useState(elemento?.nombre || '');
  const [precio, setPrecio] = useState(elemento?.precio ?? '');
  const [productoReferenciaId, setProductoReferenciaId] = useState(elemento?.productoReferenciaId ? String(elemento.productoReferenciaId) : '');
  const [activo, setActivo] = useState(elemento?.activo ?? true);

  useEffect(() => {
    if (elemento) {
      setProductoId(String(elemento.productoId || ''));
      setTipo(elemento.tipo || '');
      setNombre(elemento.nombre || '');
      setPrecio(elemento.precio ?? '');
      setProductoReferenciaId(elemento.productoReferenciaId ? String(elemento.productoReferenciaId) : '');
      setActivo(elemento.activo ?? true);
    } else if (productoPreseleccionado) {
      setProductoId(String(productoPreseleccionado));
    }
  }, [elemento, productoPreseleccionado]);

  const productosDisponiblesParaReferencia = useMemo(
    () => productos.filter((p) => String(p.id) !== String(productoId)),
    [productos, productoId]
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
      productoId: productoId ? Number(productoId) : null,
      tipo,
      activo,
    };

    let datos = { ...datosBase };

    if (tipo === 'acompanar') {
      const refProd = productos.find((p) => String(p.id) === String(productoReferenciaId));
      datos.productoReferenciaId = productoReferenciaId ? Number(productoReferenciaId) : null;
      datos.precio = precio !== '' ? Number(precio) : null;
      datos.nombre = refProd ? refProd.nombre : nombre.trim();
    } else {
      datos.nombre = nombre.trim();
      datos.precio = tipo === 'extra' ? (precio !== '' ? Number(precio) : null) : null;
      datos.productoReferenciaId = null;
    }

    const errores = validatePersonalizacionElemento({ ...datos, productos });
    if (Object.keys(errores).length > 0) {
      alert(Object.values(errores).join('\n'));
      return;
    }

    if (onGuardar) onGuardar(datos);
  };

  const handleCancelar = () => {
    if (productoId) navigate(`/admin/personalizacion?productoId=${productoId}`);
    else navigate('/admin/personalizacion');
  };

  const esAcompanar = tipo === TIPO_PERSONALIZACION.ACOMPANAR;
  const esPersonalizarOCondimento = tipo === TIPO_PERSONALIZACION.PERSONALIZAR || tipo === TIPO_PERSONALIZACION.CONDIMENTO;

  return (
    <Card className="shadow-sm" style={{ maxWidth: '560px' }}>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Producto *</Form.Label>
            <Form.Select value={productoId} onChange={(e) => setProductoId(e.target.value)} disabled={!!elemento}>
              <option value="">— Elegí producto —</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {p.categoria} — ${p.precio}
                </option>
              ))}
            </Form.Select>
            {elemento && <Form.Text className="text-muted">No se cambia de producto al editar.</Form.Text>}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Categoría / Tipo *</Form.Label>
            <Form.Select value={tipo} onChange={handleTipoChange}>
              <option value="">— Elegí categoría —</option>
              <option value={TIPO_PERSONALIZACION.EXTRA}>Extra — Agregar ingrediente (cobra)</option>
              <option value={TIPO_PERSONALIZACION.PERSONALIZAR}>Personalizar — Quitar ingrediente (no cobra)</option>
              <option value={TIPO_PERSONALIZACION.ACOMPANAR}>Acompaña tu orden con — Upsell (cobra)</option>
              <option value={TIPO_PERSONALIZACION.CONDIMENTO}>Condimentos adicionales — Sobre (no cobra)</option>
            </Form.Select>
          </Form.Group>

          {!esAcompanar && (
            <Form.Group className="mb-3">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={tipo === 'personalizar' ? 'Ej: Queso Cheddar en fetas' : tipo === 'condimento' ? 'Ej: Sobre de Ketchup' : 'Ej: Bacon'}
              />
              {tipo === 'personalizar' && <Form.Text className="text-muted">Se mostrará como &quot;Sin {nombre || 'X'}&quot;</Form.Text>}
            </Form.Group>
          )}

          {esAcompanar && (
            <Form.Group className="mb-3">
              <Form.Label>Producto a ofrecer *</Form.Label>
              <Form.Select value={productoReferenciaId} onChange={handleReferenciaChange} disabled={!productoId}>
                <option value="">— Elegí producto para ofrecer —</option>
                {productosDisponiblesParaReferencia.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — {p.categoria} — ${p.precio}
                  </option>
                ))}
              </Form.Select>
              {!productoId && <Form.Text className="text-danger">Elegí primero el producto.</Form.Text>}
              {productoId && <Form.Text className="text-muted">Se excluye el producto que estás personalizando. Precio precargado editable.</Form.Text>}
            </Form.Group>
          )}

          {!esPersonalizarOCondimento && (
            <Form.Group className="mb-3">
              <Form.Label>Precio $ *</Form.Label>
              <InputGroup>
                <InputGroup.Text style={{ border: '2px solid #f1c27d', borderRight: 'none', borderRadius: '12px 0 0 12px', background: '#fff4e2' }}>$</InputGroup.Text>
                <Form.Control
                  type="number"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="2700"
                  min="0"
                  step="100"
                  style={{ borderLeft: 'none', borderRadius: '0 12px 12px 0' }}
                />
              </InputGroup>
              <Form.Text className="text-muted">
                {esAcompanar ? 'Editable — default del producto elegido. Podés poner promo.' : 'Requerido para Extra — suma al total.'}
              </Form.Text>
            </Form.Group>
          )}

          <Form.Group className="mb-4">
            <Form.Check type="switch" id="activo-switch" label="Activo" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
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

export default FormularioPersonalizacion;
