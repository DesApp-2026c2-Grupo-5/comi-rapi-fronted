/**
 * Propósito: Avatar circular reutilizable del usuario: muestra la foto de perfil
 *            si hay una y, si no, las iniciales sobre fondo naranja.
 * Contenido: Componente Avatar.
 * Dependencias: react-icons/fa, utils/formatters.js (obtenerIniciales), Avatar.css.
 * Uso: <Avatar src={usuario.fotoPerfilUrl} nombre={usuario.nombre} size={40} />
 *
 * El tamaño se pasa por prop (en píxeles) para que el mismo componente sirva al
 * navbar (40px) y a la portada del perfil (128px) sin duplicar CSS.
 */

/* El proyecto no tiene la dependencia "prop-types" (ningún componente declara
   PropTypes), así que se desactiva esa regla en este archivo en vez de agregar
   un paquete nuevo. */
/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { obtenerIniciales } from '../../utils/formatters';
import './Avatar.css';

const Avatar = ({ src, nombre = '', apellido = '', size = 40, alt = '', className = '' }) => {
  // Si la imagen falla (archivo borrado del servidor, URL vieja), se cae a las
  // iniciales en lugar de dejar el ícono de imagen rota del navegador.
  const [imagenRota, setImagenRota] = useState(false);

  useEffect(() => {
    setImagenRota(false);
  }, [src]);

  const estilo = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${Math.round(size * 0.36)}px`,
  };
  const clases = `avatar-comirapi ${className}`.trim();

  if (src && !imagenRota) {
    return (
      <img
        src={src}
        alt={alt}
        className={clases}
        style={estilo}
        onError={() => setImagenRota(true)}
      />
    );
  }

  // Las iniciales son decorativas: el nombre siempre se muestra al lado.
  return (
    <span className={`${clases} avatar-comirapi-inicial`} style={estilo} aria-hidden="true">
      {obtenerIniciales(nombre, apellido) || <FaUserCircle />}
    </span>
  );
};

export default Avatar;
