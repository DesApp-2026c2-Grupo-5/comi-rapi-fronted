/**
 * Propósito: Selector de tema claro / oscuro / sistema para los encabezados de
 *            la app (navbar del cliente y navbar del panel).
 * Contenido: Botón compacto con ícono del tema activo que abre un menú de tres
 *            opciones (Claro, Oscuro, Sistema) y marca la elegida.
 * Dependencias: react-bootstrap (Dropdown), react-icons/fa, useTema,
 *               utils/temaStorage (TEMAS), SelectorTema.css.
 * Uso: <SelectorTema /> dentro de la barra de acciones de un header.
 *
 * El botón hereda el color del contenedor (currentColor), así que se ve bien
 * sobre el naranja de la navbar del cliente y sobre la del panel sin reglas
 * específicas por rol. Los ítems del menú usan role="menuitemradio" para que el
 * lector de pantalla anuncie cuál está elegido.
 */

import { Dropdown } from 'react-bootstrap';
import {
  FaCheck,
  FaDesktop,
  FaMoon,
  FaSun,
} from 'react-icons/fa';
import { useTema } from '../../hooks/useTema';
import { TEMAS } from '../../utils/temaStorage';
import './SelectorTema.css';

const OPCIONES = [
  { valor: TEMAS.CLARO, etiqueta: 'Claro', Icono: FaSun },
  { valor: TEMAS.OSCURO, etiqueta: 'Oscuro', Icono: FaMoon },
  { valor: TEMAS.SISTEMA, etiqueta: 'Sistema', Icono: FaDesktop },
];

const SelectorTema = () => {
  const { tema, temaResuelto, definirTema } = useTema();
  const opcionActual = OPCIONES.find((opcion) => opcion.valor === tema) || OPCIONES[2];
  const IconoActual = opcionActual.Icono;
  // "Sistema" resuelve a claro u oscuro según el SO. El sufijo (claro|oscuro)
  // deja ver qué tema se está pintando ahora, tanto en el botón como en el ítem
  // del menú (si no, "Sistema" y "Claro" parecen lo mismo con el SO en claro).
  const sufijoSistema = temaResuelto ? ` (${temaResuelto})` : '';
  const detalleSistema = tema === TEMAS.SISTEMA ? sufijoSistema : '';
  const descripcion = `Tema: ${opcionActual.etiqueta}${detalleSistema}. Cambiar tema`;

  return (
    <Dropdown align="end" className="selector-tema">
      <Dropdown.Toggle
        as="button"
        type="button"
        variant=""
        className="selector-tema-btn"
        aria-label={descripcion}
        title={descripcion}
      >
        <IconoActual aria-hidden="true" />
      </Dropdown.Toggle>
      <Dropdown.Menu className="selector-tema-menu">
        {OPCIONES.map(({ valor, etiqueta, Icono }) => {
          const elegida = tema === valor;
          const texto =
            valor === TEMAS.SISTEMA ? `${etiqueta}${sufijoSistema}` : etiqueta;
          return (
            <Dropdown.Item
              key={valor}
              as="button"
              type="button"
              role="menuitemradio"
              aria-checked={elegida}
              active={elegida}
              onClick={() => definirTema(valor)}
            >
              <Icono aria-hidden="true" />
              <span className="selector-tema-etiqueta">{texto}</span>
              {elegida && (
                <FaCheck className="selector-tema-check" aria-hidden="true" />
              )}
            </Dropdown.Item>
          );
        })}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default SelectorTema;
