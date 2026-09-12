/**
 * Propósito: Formulario para crear/editar productos usando Form de Bootstrap.
 * Contenido: Componente FormularioProducto con campos controlados y categorías reales.
 * Dependencias: react-bootstrap (Form, Button, Card, Spinner), api/categorias.js.
 * Uso: <FormularioProducto producto={producto} onGuardar={handler} />
 */

import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Spinner } from 'react-bootstrap';
import { FaSave } from 'react-icons/fa';
import { obtenerCategorias } from '../../api/categorias';

const FormularioProducto = ({ producto, onGuardar }) => {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('');
  const [imagen, setImagen] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerCategorias().then((resultado) => {
      if (resultado.success) {
        setCategorias(resultado.data);
      }
      setCargando(false);
    });
  }, []);

  useEffect(() => {
    if (producto) {
      setNombre(producto.nombre || '');
      setPrecio(producto.precio || '');
      setCategoria(producto.categoria || '');
      setImagen(producto.imagen || '');
    }
  }, [producto]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre.trim() || !precio || !categoria) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }

    const datosProducto = {
      nombre: nombre.trim(),
      precio: Number(precio),
      categoria,
      imagen: imagen.trim() || 'https://via.placeholder.com/300x200?text=Producto',
    };

    if (onGuardar) {
      onGuardar(datosProducto);
    }
  };

  return (
    <Card className="shadow-sm" style={{ maxWidth: '500px' }}>
      <Card.Body>
        {cargando ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="danger" />
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nombre *</Form.Label>
              <Form.Control
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre del producto"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Precio *</Form.Label>
              <Form.Control
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Categoría *</Form.Label>
              <Form.Select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>URL de imagen</Form.Label>
              <Form.Control
                type="url"
                value={imagen}
                onChange={(e) => setImagen(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              <FaSave className="me-1" aria-hidden="true" />
              Guardar cambios
            </Button>
          </Form>
        )}
      </Card.Body>
    </Card>
  );
};

export default FormularioProducto;