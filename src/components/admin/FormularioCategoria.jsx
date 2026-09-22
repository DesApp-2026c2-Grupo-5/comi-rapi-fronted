/**
 * Propósito: Formulario para crear/editar categorías usando Form de Bootstrap.
 * Contenido: Componente FormularioCategoria con campos controlados (nombre,
 * descripcion, imagen, activa).
 * Dependencias: react-bootstrap (Form, Button, Card), react-icons (FaSave),
 * SubirImagen, useNotificaciones.
 * Uso: <FormularioCategoria categoria={categoria} onGuardar={handler} />
 */

import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { FaSave } from 'react-icons/fa';
import SubirImagen from './SubirImagen';
import { useNotificaciones } from '../../hooks/useNotificaciones';

const FormularioCategoria = ({ categoria, onGuardar }) => {
  const { notificar } = useNotificaciones();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState('');
  const [activa, setActiva] = useState(true);

  useEffect(() => {
    if (categoria) {
      setNombre(categoria.nombre || '');
      setDescripcion(categoria.descripcion || '');
      setImagen(categoria.imagen || '');
      setActiva(categoria.activa !== false);
    }
  }, [categoria]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      notificar('El nombre es obligatorio.', 'warning');
      return;
    }

    const datosCategoria = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      imagen: imagen.trim(),
      activa,
    };

    if (onGuardar) {
      onGuardar(datosCategoria);
    }
  };

  return (
    <Card className="shadow-sm" style={{ maxWidth: '500px' }}>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de la categoría"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de la categoría"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Imagen</Form.Label>
            <Form.Control
              type="text"
              value={imagen}
              onChange={(e) => setImagen(e.target.value)}
              placeholder="/imagenes/categorias/tu-imagen.jpg"
            />
            <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
              <SubirImagen tipo="categoria" imagen={imagen} onImagenSubida={setImagen} />
            </div>
            <Form.Text className="text-muted">
              Subí una imagen desde tu dispositivo; queda guardada como archivo
              del proyecto y se muestra en la home.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="switch"
              id="categoria-activa"
              label="Categoría activa"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
            />
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

export default FormularioCategoria;
