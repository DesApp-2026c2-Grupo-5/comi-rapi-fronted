/**
 * Propósito: Botón para subir la imagen de un producto o de una categoría
 * desde el dispositivo (desktop o celular). El backend la guarda como
 * archivo en el repo del frontend y devuelve la ruta relativa.
 * Contenido: Componente SubirImagen con input oculto, spinner de subida y
 * vista previa de la imagen actual.
 * Dependencias: react-bootstrap (Button, Spinner), react-icons, api/imagenes.js.
 * Uso:
 *   <SubirImagen imagen={producto.imagen} onImagenSubida={setImagen} />
 *   <SubirImagen tipo="categoria" imagen={cat.imagen} onImagenSubida={setImagen} />
 */

import React, { useRef, useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { FaCloudUploadAlt } from 'react-icons/fa';
import {
  subirImagenCategoria,
  subirImagenProducto,
} from '../../api/imagenes';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import './SubirImagen.css';

/* El proyecto no usa PropTypes en ningún componente. */
/* eslint-disable react/prop-types */
const SubirImagen = ({ tipo = 'producto', imagen, onImagenSubida }) => {
  const { notificar } = useNotificaciones();
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);

  const handleSeleccion = async (e) => {
    const archivo = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!archivo) {
      return;
    }
    setSubiendo(true);
    const result =
      tipo === 'categoria'
        ? await subirImagenCategoria(archivo)
        : await subirImagenProducto(archivo);
    setSubiendo(false);
    if (result.success) {
      notificar('Imagen subida correctamente.', 'success');
      if (onImagenSubida) {
        onImagenSubida(result.url);
      }
    } else {
      notificar(result.error || 'No se pudo subir la imagen.', 'danger');
    }
  };

  const esCategoria = tipo === 'categoria';
  const nombreSujeto = esCategoria ? 'la categoría' : 'el producto';

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      {/* El input real está oculto y este botón lo dispara. Un `<label>` no
          alcanzaba porque el input es de tipo file con `display: none`. */}
      <Button
        type="button"
        variant="outline-primary"
        onClick={() => inputRef.current && inputRef.current.click()}
        disabled={subiendo}
      >
        {subiendo ? (
          <Spinner animation="border" size="sm" className="me-1" aria-hidden="true" />
        ) : (
          <FaCloudUploadAlt className="me-1" aria-hidden="true" />
        )}
        {subiendo ? 'Subiendo…' : 'Subir imagen'}
      </Button>
      <input
        ref={inputRef}
        type="file"
        name="imagen"
        accept="image/*"
        onChange={handleSeleccion}
        className="d-none"
        tabIndex={-1}
        aria-hidden="true"
      />
      {/* `aria-live` para que al terminar la subida se anuncie sin tener que
          buscar el cambio en pantalla. */}
      <span className="visually-hidden" role="status" aria-live="polite">
        {subiendo ? 'Subiendo la imagen…' : ''}
      </span>
      {imagen ? (
        <img
          src={imagen}
          alt={`Vista previa de la imagen actual de ${nombreSujeto}`}
          className="subir-imagen-preview rounded"
          width={80}
          height={60}
          decoding="async"
        />
      ) : null}
    </div>
  );
};
/* eslint-enable react/prop-types */

export default SubirImagen;