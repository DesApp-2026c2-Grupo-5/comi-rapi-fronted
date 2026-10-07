/**
 * Propósito: Formulario para crear/editar productos usando Form de Bootstrap.
 * Contenido: Componente FormularioProducto con campos controlados y, si el tipo
 *            es COMBO, el editor de componentes (receta). El tipo no se le pide:
 *            se deduce de la pantalla (producto o combo).
 * Dependencias: react-bootstrap (Form, Button, Card, Spinner), react-icons,
 *               api/categorias.js, api/productos.js, EditarComponentes.
 * Uso: <FormularioProducto producto={producto} onGuardar={handler} />
 */

import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Spinner } from 'react-bootstrap';
import { FaSave } from 'react-icons/fa';
import { obtenerCategorias } from '../../api/categorias';
import { obtenerProductos } from '../../api/productos';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import SubirImagen from './SubirImagen';
import EditarComponentes, { MIN_COMPONENTES } from './EditarComponentes';
import './FormularioAdmin.css';

// La categoría "Combos" es la de los combos y no se le ofrece al admin: se
// deduce del tipo. En un producto normal ni siquiera aparece en el desplegable,
// así nadie clasifica una hamburguesa como combo por error.
const CATEGORIA_COMBOS = 'combos';

const esCategoriaCombos = (categoria) =>
  String(categoria?.nombre).trim().toLowerCase() === CATEGORIA_COMBOS;

const FormularioProducto = ({ producto, onGuardar, forzarTipo = null }) => {
  const { notificar } = useNotificaciones();
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [imagen, setImagen] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  // Receta del combo: [{ productoId, cantidad }]
  const [componentes, setComponentes] = useState([]);
  // Catálogo para elegir los productos de la receta.
  const [productos, setProductos] = useState([]);

  // El tipo se deduce solo de la pantalla: /superadmin/producto/nuevo crea un
  // PRODUCTO y /superadmin/producto/nuevo-combo crea un COMBO. En la edición es el
  // que ya tiene el producto. No se le pregunta al superadministrador.
  const tipoEfectivo = forzarTipo || producto?.tipo || 'PRODUCTO';

  // Un combo se guarda siempre en la categoría "Combos": el admin no la elige.
  const categoriaCombos = categorias.find(esCategoriaCombos);
  const esCombo = tipoEfectivo === 'COMBO';

  // En un producto normal la categoría "Combos" queda fuera del desplegable.
  const categoriasVisibles = categorias.filter(
    (cat) => esCombo || !esCategoriaCombos(cat)
  );

  useEffect(() => {
    const cargar = async () => {
      const result = await obtenerCategorias();
      if (result.success) {
        setCategorias(result.data);
      }
      setCargandoCategorias(false);
    };
    cargar();
  }, []);

  // Los productos posibles de una receta; se piden sólo si el producto es combo.
  useEffect(() => {
    if (forzarTipo !== 'COMBO' && producto?.tipo !== 'COMBO') return;
    const cargar = async () => {
      const result = await obtenerProductos();
      if (result.success) setProductos(result.data);
    };
    cargar();
  }, [forzarTipo, producto]);

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre || '');
      setPrecio(producto.precio ?? '');
      setCategoriaId(producto.categoriaId ?? '');
      setImagen(producto.imagen || '');
      setDescripcion(producto.descripcion || '');
      // El backend devuelve la receta en `componentes` (productoId + cantidad).
      setComponentes(
        Array.isArray(producto.componentes)
          ? producto.componentes.map((c) => ({
              productoId: c.productoId,
              cantidad: c.cantidad,
            }))
          : []
      );
    }
  }, [producto, forzarTipo]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre.trim() || precio === '') {
      notificar('Por favor completa todos los campos obligatorios.', 'warning');
      return;
    }

    // Un combo siempre va a la categoría "Combos"; el admin no la elige. Si esa
    // categoría no existe todavía no hay dónde guardarlo, así que se avisa en
    // vez de mandarlo a otra.
    if (esCombo && !categoriaCombos) {
      notificar(
        'No se encontró la categoría "Combos". Creala antes de armar un combo.',
        'warning'
      );
      return;
    }

    // Para un producto normal la categoría sí se elige; la "Combos" está
    // filtrada del desplegable, pero se valida igual por si viene por URL.
    const categoriaEfectiva = esCombo ? categoriaCombos.id : Number(categoriaId);
    if (!categoriaEfectiva || Number.isNaN(categoriaEfectiva)) {
      notificar('Elegí una categoría.', 'warning');
      return;
    }

    const datosProducto = {
      nombre: nombre.trim(),
      precio: Number(precio),
      categoriaId: categoriaEfectiva,
      // Viaja siempre: el backend lo exige y el admin no lo elige.
      tipo: tipoEfectivo,
      descripcion: descripcion.trim(),
      imagen:
        imagen.trim() || 'https://via.placeholder.com/300x200?text=Producto',
    };

    if (esCombo) {
      const receta = componentes
        .map((c) => ({
          productoId: Number(c.productoId),
          cantidad: Number(c.cantidad),
        }))
        .filter((c) => c.productoId > 0 && c.cantidad > 0);

      // Se valida acá para avisar sin ida y vuelta; el backend igual lo exige.
      if (receta.length < MIN_COMPONENTES) {
        notificar(
          `Un combo tiene que armarse con ${MIN_COMPONENTES} o más productos.`,
          'warning'
        );
        return;
      }
      datosProducto.componentes = receta;
    }

    if (onGuardar) {
      onGuardar(datosProducto);
    }
  };

  if (cargandoCategorias) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  return (
    <>
{/* Más ancho para combo: las filas de la receta llevan selector + cantidad + */}
      {/* botón de quitar, y a 500px quedan apretadas. */}
      <Card className={`shadow-sm formulario-admin-card ${esCombo ? 'formulario-admin-card-ancho' : ''}`}>
        <Card.Body>
          <Form onSubmit={handleSubmit} noValidate>
          <Form.Group className="mb-3" controlId="producto-nombre">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del producto"
              required
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="producto-precio">
            <Form.Label>Precio *</Form.Label>
            <Form.Control
              type="number"
              name="precio"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              inputMode="decimal"
              required
            />
          </Form.Group>
{/* Un combo se categoriza solo como "Combos", así que no se le
              pregunta la categoría al admin. */}
          {!esCombo && (            <Form.Group className="mb-3" controlId="producto-categoria">
              <Form.Label>Categoría *</Form.Label>
              <Form.Select name="categoriaId" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                <option value="">Seleccionar categoría</option>
                {categoriasVisibles.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          {/* La receta va en el medio del formulario: es lo que define qué es un
              combo, así que va después de los datos básicos y antes de la
              descripción y la imagen, que son metadatos. */}
          {esCombo && (
            <div className="mb-3">
              <EditarComponentes
                productos={productos}
                componentes={componentes}
                onChange={setComponentes}
              />
            </div>
          )}

          <Form.Group className="mb-3" controlId="producto-descripcion">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              name="descripcion"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del producto"
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="producto-imagen">
            <Form.Label>Imagen</Form.Label>
            <Form.Control
              type="text"
              name="imagen"
              value={imagen}
              onChange={(e) => setImagen(e.target.value)}
              placeholder="/imagenes/productos/tu-imagen.jpg"
            />
            <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
              <SubirImagen imagen={imagen} onImagenSubida={setImagen} />
            </div>
            <Form.Text className="text-muted">
              Subí una imagen desde tu dispositivo; queda guardada como archivo
              del proyecto y se ve en el catálogo. También podés escribir la
              ruta o pegar un link.
            </Form.Text>
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100">
            <FaSave className="me-1" aria-hidden="true" />
            Guardar cambios
          </Button>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default FormularioProducto;
