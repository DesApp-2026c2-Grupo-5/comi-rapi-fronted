/**
 * Propósito: Editor de la receta de un combo (qué productos lo arman y cuántos).
 * Contenido: Selector de productos con cantidad por componente, máximo de combos
 *            por sucursal y validación mínima de la receta.
 * Dependencias: react-bootstrap, api/stock.js.
 * Uso: <EditarComponentes productos={productos} componentes={componentes}
 *       onChange={setComponentes} />
 *
 * El desplegable sólo ofrece productos simples: un combo no puede ser componente
 * de otro combo, así que la lista ya viene filtrada por tipo.
 *
 * El mínimo de 2 componentes y el veto a repetidos son reglas del backend
 * (lib/services/combo.js). Se repiten acá para que el admin entienda el error sin
 * ida y vuelta, no para reemplazar esa validación.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Form, Button, Card, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaPlus, FaTrashAlt } from 'react-icons/fa';
import { obtenerMaximosDeCombos } from '../../api/stock';

export const MIN_COMPONENTES = 2;

const EditarComponentes = ({ productos = [], componentes = [], onChange }) => {
  const [maximos, setMaximos] = useState(null);
  const [calculando, setCalculando] = useState(false);
  const [errorMaximos, setErrorMaximos] = useState('');
  // Se incrementa en cada recálculo: si la respuesta llega tarde y la receta ya
  // cambió, su token quedó viejo y se descarta en vez de pisar el resultado nuevo.
  const peticionRef = useRef(0);

  // Productos que pueden entrar en la receta: sólo los simples. Un combo no
  // puede ser componente de otro combo —el backend lo rechaza, y el stock de
  // un combo vendible sólo se descuenta a un nivel—, así que ni se ofrece en el
  // desplegable. Esto también saca al combo que se está armando, que es un
  // combo y por lo tanto no puede ser su propio componente.
  const productosElegibles = productos.filter((p) => p.tipo !== 'COMBO');

  // El máximo de combos por sucursal se calcula solo, cada vez que cambia la
  // receta: es el número que le dice al admin cuántos combos sale de cada local
  // antes de ponerlos en venta, y pedirlo a mano era un paso que se olvidaba.
  // Va con debounce porque cada línea se edita tecla por tecla y cada consulta
  // pega contra el backend.
  useEffect(() => {
    const validos = componentes.filter(
      (c) => Number(c.productoId) > 0 && Number(c.cantidad) > 0
    );

    // Todavía no hay receta completa: no se consulta nada. El error de
    // guardar el combo ya avisa por separado, así que no se duplica el aviso acá.
    if (validos.length < MIN_COMPONENTES) {
      setMaximos(null);
      setCalculando(false);
      return undefined;
    }

    const token = peticionRef.current + 1;
    peticionRef.current = token;
    setCalculando(true);
    setErrorMaximos('');

    const timer = setTimeout(async () => {
      const resultado = await obtenerMaximosDeCombos(validos);
      // Llegó una respuesta de una receta que ya no es la actual.
      if (token !== peticionRef.current) return;
      if (resultado.success) {
        setMaximos(resultado.data);
      } else {
        setMaximos(null);
        setErrorMaximos(resultado.error || 'No se pudo calcular el máximo.');
      }
      setCalculando(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [componentes]);

  const cambiar = (indice, campo, valor) => {
    const siguiente = componentes.map((componente, i) =>
      i === indice ? { ...componente, [campo]: valor } : componente
    );
    onChange(siguiente);
  };

  const agregar = () => {
    onChange([...componentes, { productoId: '', cantidad: 1 }]);
  };

  const quitar = (indice) => {
    onChange(componentes.filter((_, i) => i !== indice));
  };

  // Los repetidos se buscan sólo entre los productos ya elegidos: una fila sin
  // completar no es un duplicado, es una línea a medio llenar.
  const idsElegidos = componentes
    .map((c) => Number(c.productoId))
    .filter((id) => id > 0);
  const sinRepetidos = new Set(idsElegidos).size === idsElegidos.length;

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <Card.Title as="h5" className="mb-1">
          Componentes del combo
        </Card.Title>
        <p className="text-muted small mb-3">
          El combo se arma con {MIN_COMPONENTES} o más productos. Cada línea dice
          cuántas unidades lleva <em>una</em> unidad del combo: si el combo lleva
          2 papas, con 10 papas de stock salen 5 combos.
        </p>

        {componentes.length === 0 && (
          <Alert variant="info" className="py-2">
            Todavía no agregaste componentes. Un combo sin receta no se puede
            armar ni vender.
          </Alert>
        )}

        {componentes.map((componente, indice) => (
          <div
            key={indice}
            className="d-flex gap-2 align-items-end mb-2 flex-wrap"
          >
            <Form.Group className="flex-grow-1" style={{ minWidth: '220px' }}>
              <Form.Label className="small mb-1">
                Producto {indice + 1}
              </Form.Label>
              <Form.Select
                value={componente.productoId ?? ''}
                onChange={(e) => cambiar(indice, 'productoId', e.target.value)}
              >
                <option value="">Seleccionar producto</option>
                {productosElegibles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group style={{ width: '110px' }}>
              <Form.Label className="small mb-1">Cantidad</Form.Label>
              <Form.Control
                type="number"
                min="1"
                step="1"
                value={componente.cantidad ?? 1}
                onChange={(e) => cambiar(indice, 'cantidad', e.target.value)}
              />
            </Form.Group>
            <Button
              variant="outline-danger"
              onClick={() => quitar(indice)}
              aria-label={`Quitar componente ${indice + 1}`}
            >
              <FaTrashAlt aria-hidden="true" />
            </Button>
          </div>
        ))}

        <div className="d-flex gap-2 flex-wrap">
          <Button variant="outline-primary" size="sm" onClick={agregar}>
            <FaPlus className="me-1" aria-hidden="true" />
            Agregar componente
          </Button>
        </div>

        {!sinRepetidos && (
          <Alert variant="warning" className="py-2 mt-3 mb-0">
            No podés repetir el mismo producto en la receta.
          </Alert>
        )}
        {errorMaximos && (
          <Alert variant="danger" className="py-2 mt-3 mb-0">
            {errorMaximos}
          </Alert>
        )}

        {calculando && (
          <div className="d-flex align-items-center gap-2 text-muted small mt-3">
            <Spinner animation="border" size="sm" />
            Calculando el máximo por sucursal...
          </div>
        )}

        {maximos && (
          <div className="mt-3">
            <h6 className="mb-2">Máximo de combos por sucursal</h6>
            <p className="text-muted small mb-2">
              Con el stock actual de cada sucursal. En la pantalla de Stock vas a
              poder poner en venta hasta este número de combos.
            </p>
            {maximos.map((fila) => (
              <div
                key={fila.sucursalId}
                className="d-flex justify-content-between align-items-center border rounded px-2 py-1 mb-1"
              >
                <span>{fila.sucursal}</span>
                <Badge bg={fila.maximo > 0 ? 'success' : 'secondary'}>
                  {fila.maximo} {fila.maximo === 1 ? 'combo' : 'combos'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default EditarComponentes;
