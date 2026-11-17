/**
 * Propósito: Formulario para crear/editar productos usando Form de Bootstrap.
 * Contenido: Componente FormularioProducto con campos controlados y, si el tipo
 *            es COMBO, el editor de componentes (receta). El tipo no se le pide:
 *            se deduce de la pantalla (producto o combo).
 * Dependencias: react-bootstrap (Form, Button, Card), react-icons,
 *               api/categorias.js, api/productos.js, EditarComponentes,
 *               components/comunes/Skeleton (SkeletonTarjeta).
 * Uso: <FormularioProducto producto={producto} onGuardar={handler} />
 */

import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { FaSave } from 'react-icons/fa';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { useParametros } from '../../hooks/useParametros';
import { useCategorias, useProductos } from '../../hooks/queries';
import useMediaQuery from '../../hooks/useMediaQuery';
import { IMAGEN_PRODUCTO_POR_DEFECTO } from '../../utils/imagenes';
import { SkeletonTarjeta } from '../comunes/Skeleton';
import SubirImagen from './SubirImagen';
import EditarComponentes from './EditarComponentes';
import EditarRecetaIngredientes from './EditarRecetaIngredientes';
import FormularioPasos from './FormularioPasos';
import './FormularioAdmin.css';
import './FormularioABM.css';

// La categoría "Combos" es la de los combos y no se le ofrece al admin: se
// deduce del tipo. En un producto normal ni siquiera aparece en el desplegable,
// así nadie clasifica una hamburguesa como combo por error.
const CATEGORIA_COMBOS = 'combos';

const PASOS_PRODUCTO = [
  { id: 'datos', etiqueta: 'Datos básicos' },
  { id: 'receta', etiqueta: 'Receta' },
  { id: 'presentacion', etiqueta: 'Imagen y descripción' },
];

const esCategoriaCombos = (categoria) =>
  String(categoria?.nombre).trim().toLowerCase() === CATEGORIA_COMBOS;

// "Pan, carne, queso" → ['Pan', 'carne', 'queso']. Se aceptan comas y saltos de
// línea, se descartan vacíos y se quitan repetidos sin distinguir mayúsculas.
const parsearIngredientes = (texto) => {
  const nombres = String(texto || '')
    .split(/[,\n]/)
    .map((nombre) => nombre.trim())
    .filter(Boolean);
  return nombres.filter(
    (nombre, indice) =>
      nombres.findIndex(
        (otro) => otro.toLowerCase() === nombre.toLowerCase()
      ) === indice
  );
};

const FormularioProducto = ({ producto, onGuardar, forzarTipo = null }) => {
  const { notificar } = useNotificaciones();
  const { parametros } = useParametros();
  // Mismo corte que la barra inferior del shell (NavInferior, <992px): cuando
  // se navega como móvil, el formulario también usa pasos y tarjetas.
  const esMobile = useMediaQuery('(max-width: 991.98px)');
  const [paso, setPaso] = useState(1);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [imagen, setImagen] = useState('');
  const [descripcion, setDescripcion] = useState('');
  // Receta de ingredientes del producto (obligatoria para PRODUCTO).
  const [recetaIngredientes, setRecetaIngredientes] = useState([]);
  // Receta del combo: [{ productoId, cantidad }]
  const [componentes, setComponentes] = useState([]);

  // El tipo se deduce solo de la pantalla: /superadmin/producto/nuevo crea un
  // PRODUCTO y /superadmin/producto/nuevo-combo crea un COMBO. En la edición es el
  // que ya tiene el producto. No se le pregunta al superadministrador.
  const tipoEfectivo = forzarTipo || producto?.tipo || 'PRODUCTO';
  const esCombo = tipoEfectivo === 'COMBO';

  // Catálogo compartido con la caché pública: RealtimeBridge invalida estas
  // claves cuando cambia una categoría o un producto.
  const { data: categorias = [], isPending: cargandoCategorias } =
    useCategorias();
  // Los productos posibles de una receta; se mantiene la query siempre activa
  // para recibir actualizaciones en tiempo real (RealtimeBridge → setQueryData).
  const { data: productos = [] } = useProductos();

  // Un combo se guarda siempre en la categoría "Combos": el admin no la elige.
  const categoriaCombos = categorias.find(esCategoriaCombos);

  // En un producto normal la categoría "Combos" queda fuera del desplegable.
  const categoriasVisibles = categorias.filter(
    (cat) => esCombo || !esCategoriaCombos(cat)
  );

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre || '');
      setPrecio(producto.precio ?? '');
      setCategoriaId(producto.categoriaId ?? '');
      setImagen(producto.imagen || '');
      setDescripcion(producto.descripcion || '');
      setRecetaIngredientes(
        Array.isArray(producto.recetaIngredientes)
          ? producto.recetaIngredientes.map((r) => ({
              ingredienteId: r.ingredienteId,
              cantidad: r.cantidad,
              permiteQuitar: r.permiteQuitar,
            }))
          : []
      );
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
    setPaso(1);
  }, [producto, forzarTipo]);

  const validarDatosBasicos = () => {
    if (!nombre.trim() || precio === '') {
      notificar('Por favor completa todos los campos obligatorios.', 'warning');
      return false;
    }

    // Un combo siempre va a la categoría "Combos"; el admin no la elige. Si esa
    // categoría no existe todavía no hay dónde guardarlo, así que se avisa en
    // vez de mandarlo a otra.
    if (esCombo && !categoriaCombos) {
      notificar(
        'No se encontró la categoría "Combos". Creala antes de armar un combo.',
        'warning'
      );
      return false;
    }

    // Para un producto normal la categoría sí se elige; la "Combos" está
    // filtrada del desplegable, pero se valida igual por si viene por URL.
    const categoriaEfectiva = esCombo ? categoriaCombos.id : Number(categoriaId);
    if (!categoriaEfectiva || Number.isNaN(categoriaEfectiva)) {
      notificar('Elegí una categoría.', 'warning');
      return false;
    }

    return true;
  };

  const validarReceta = () => {
    if (!esCombo) {
      return true;
    }

    const receta = componentes
      .map((c) => ({
        productoId: Number(c.productoId),
        cantidad: Number(c.cantidad),
      }))
      .filter((c) => c.productoId > 0 && c.cantidad > 0);

    const minimoComponentes = parametros.minimoComponentesCombo;
    if (receta.length < minimoComponentes) {
      notificar(
        `Un combo tiene que armarse con ${minimoComponentes} o más productos.`,
        'warning'
      );
      return false;
    }

    return true;
  };

  const irAPaso = (nuevoPaso) => setPaso(nuevoPaso);

  const guardarProducto = () => {
    if (!validarDatosBasicos() || !validarReceta()) {
      return;
    }

    const categoriaEfectiva = esCombo
      ? categoriaCombos.id
      : Number(categoriaId);

    const datosProducto = {
      nombre: nombre.trim(),
      precio: Number(precio),
      categoriaId: categoriaEfectiva,
      // Viaja siempre: el backend lo exige y el admin no lo elige.
      tipo: tipoEfectivo,
      descripcion: descripcion.trim(),
      imagen: imagen.trim() || IMAGEN_PRODUCTO_POR_DEFECTO,
    };

    if (!esCombo) {
      datosProducto.recetaIngredientes = recetaIngredientes
        .filter((r) => Number(r.ingredienteId) > 0 && Number(r.cantidad) > 0)
        .map((r) => ({
          ingredienteId: Number(r.ingredienteId),
          cantidad: Number(r.cantidad),
          permiteQuitar: Boolean(r.permiteQuitar),
        }));
    }

    if (esCombo) {
      datosProducto.componentes = componentes
        .map((c) => ({
          productoId: Number(c.productoId),
          cantidad: Number(c.cantidad),
        }))
        .filter((c) => c.productoId > 0 && c.cantidad > 0);
    }

    if (onGuardar) {
      onGuardar(datosProducto);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!esMobile) {
      guardarProducto();
      return;
    }

    if (paso === 1) {
      if (validarDatosBasicos()) {
        irAPaso(2);
      }
      return;
    }

    if (paso === 2) {
      if (validarReceta()) {
        irAPaso(3);
      }
      return;
    }

    guardarProducto();
  };

  const footerPasos = (
    <div className="w-100">
      <span className="abm-stepper-footer-paso">
        Paso {paso} de {PASOS_PRODUCTO.length}
      </span>
      <div className="abm-stepper-footer-acciones mt-2">
        {paso > 1 && (
          <Button
            variant="secondary"
            type="button"
            onClick={() => irAPaso(paso - 1)}
          >
            Atrás
          </Button>
        )}
        <Button variant="primary" type="submit">
          {paso === 3 ? (
            <>
              <FaSave className="me-1" aria-hidden="true" />
              Guardar cambios
            </>
          ) : (
            'Siguiente'
          )}
        </Button>
      </div>
    </div>
  );

  if (cargandoCategorias) {
    return (
      <div role="status" aria-live="polite">
        <span className="visually-hidden">Cargando formulario de producto…</span>
        <SkeletonTarjeta />
      </div>
    );
  }

  return (
    <Card className="shadow-sm formulario-admin-card">
      <Card.Body>
        <Form onSubmit={handleSubmit} noValidate>
          <FormularioPasos
            pasos={PASOS_PRODUCTO}
            paso={paso}
            onPaso={irAPaso}
            esMobile={esMobile}
            footer={footerPasos}
          >
            {(!esMobile || paso === 1) && (
              <section className="abm-seccion">
                <h4 className="abm-seccion-titulo">Datos básicos</h4>
                <div className="abm-form-grid">
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
                  {!esCombo && (
                    <Form.Group
                      className="mb-3 abm-full"
                      controlId="producto-categoria"
                    >
                      <Form.Label>Categoría *</Form.Label>
                      <Form.Select
                        name="categoriaId"
                        value={categoriaId}
                        onChange={(e) => setCategoriaId(e.target.value)}
                      >
                        <option value="">Seleccionar categoría</option>
                        {categoriasVisibles.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  )}
                </div>
              </section>
            )}

            {(!esMobile || paso === 2) && (
              <section className="abm-seccion">
                <h4 className="abm-seccion-titulo">
                  {esCombo ? 'Componentes del combo' : 'Receta de ingredientes'}
                </h4>
                {!esCombo && (
                  <EditarRecetaIngredientes
                    receta={recetaIngredientes}
                    onChange={setRecetaIngredientes}
                  />
                )}
                {esCombo && (
                  <EditarComponentes
                    productos={productos}
                    componentes={componentes}
                    onChange={setComponentes}
                  />
                )}
              </section>
            )}

            {(!esMobile || paso === 3) && (
              <section className="abm-seccion">
                <h4 className="abm-seccion-titulo">Imagen y descripción</h4>
                <Form.Group className="mb-3" controlId="producto-descripcion">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="descripcion"
                    rows={3}
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
                    placeholder="/api/imagenes/productos/tu-imagen.jpg"
                  />
                  <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
                    <SubirImagen imagen={imagen} onImagenSubida={setImagen} />
                  </div>
                  <Form.Text className="text-muted">
                    Subí una imagen desde tu dispositivo; queda guardada como
                    archivo del proyecto y se ve en el catálogo. También podés
                    escribir la ruta o pegar un link.
                  </Form.Text>
                </Form.Group>
              </section>
            )}

            {!esMobile && (
              <Button variant="primary" type="submit" className="w-100">
                <FaSave className="me-1" aria-hidden="true" />
                Guardar cambios
              </Button>
            )}
          </FormularioPasos>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FormularioProducto;
