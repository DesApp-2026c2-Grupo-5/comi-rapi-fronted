/**
 * Propósito: Combobox territorial reutilizable (fix bug 2, iteración 3):
 *            un input que admite texto libre para BUSCAR y una lista de
 *            sugerencias filtradas client-side, con selección explícita de
 *            una opción válida.
 * Contenido: Componente Autocomplete (controlado: `value`/`onChange`).
 * Dependencias: react-bootstrap (Form, ListGroup), react.
 * Uso: <Autocomplete etiqueta="Provincia *" value={p} opciones={[{id, nombre}]}
 *        onChange={setP} placeholder="Buscá tu provincia…" />
 *
 * Comportamiento:
 *   - Tipear filtra las opciones (insensible a mayúsculas/acentos) y las
 *     muestra ordenadas alfabéticamente; sin texto, enfocar muestra todas.
 *   - Se confirma SOLO con una selección de la lista (click): `onChange`
 *     recibe el nombre oficial. El texto libre jamás se propaga como valor.
 *   - Escape cierra la lista; si se escribe texto y se sale del campo sin
 *     seleccionar, el texto se descarta (se restaura el valor confirmado).
 *   - Sin llamadas HTTP: filtra las opciones ya cargadas por el hook
 *     territorial (catálogos cacheados en el backend).
 *   - La invalidación padre→hijo (provincia limpia partido, etc.) la maneja
 *     el hook: el valor externo siempre se refleja en el input.
 */

import { useState, useEffect, useMemo } from 'react';
import { Form, ListGroup } from 'react-bootstrap';

const normalizar = (valor) =>
  String(valor ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const nombreDe = (opcion) =>
  typeof opcion === 'string' ? opcion : opcion.nombre;

const Autocomplete = ({
  etiqueta,
  value,
  opciones = [],
  onChange,
  placeholder,
  disabled = false,
  ayudaOpcional,
}) => {
  const [texto, setTexto] = useState(value || '');
  const [abierto, setAbierto] = useState(false);

  // El valor confirmado (o limpiado por el hook) siempre se refleja en el
  // input; el texto libre sin confirmar no sobrevive a un cambio externo.
  useEffect(() => {
    setTexto(value || '');
  }, [value]);

  const filtradas = useMemo(() => {
    const lista = opciones.map(nombreDe);
    const busqueda = normalizar(texto);
    const visibles = busqueda
      ? lista.filter((nombre) => normalizar(nombre).includes(busqueda))
      : lista;
    return [...visibles].sort((a, b) => a.localeCompare(b, 'es'));
  }, [opciones, texto]);

  const seleccionar = (nombre) => {
    setTexto(nombre);
    setAbierto(false);
    if (onChange && nombre !== value) {
      onChange(nombre);
    }
  };

  const handleChange = (e) => {
    setTexto(e.target.value);
    setAbierto(true);
  };

  const handleBlur = () => {
    // Sin selección explícita, el texto libre se descarta.
    if (texto !== (value || '')) {
      setTexto(value || '');
    }
    setAbierto(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setTexto(value || '');
      setAbierto(false);
      e.preventDefault();
    } else if (e.key === 'Enter' && abierto && filtradas.length > 0) {
      // Enter confirma la primera coincidencia filtrada (selección válida).
      seleccionar(filtradas[0]);
      e.preventDefault();
    }
  };

  return (
    <Form.Group className="mb-3">
      {etiqueta && <Form.Label>{etiqueta}</Form.Label>}
      <Form.Control
        type="text"
        value={texto}
        onChange={handleChange}
        onFocus={() => setAbierto(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {/* onMouseDown preventDefault evita que el click pierda el foco antes
          de confirmar la selección (carrera blur→click). */}
      {abierto && filtradas.length > 0 && (
        <ListGroup className="mt-1" style={{ maxHeight: 200, overflowY: 'auto' }}>
          {filtradas.map((nombre) => (
            <ListGroup.Item
              key={nombre}
              action
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => seleccionar(nombre)}
            >
              {nombre}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
      {ayudaOpcional && !abierto && (
        <Form.Text muted>{ayudaOpcional}</Form.Text>
      )}
    </Form.Group>
  );
};

export default Autocomplete;
