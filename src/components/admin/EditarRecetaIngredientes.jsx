import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Table } from 'react-bootstrap';
import { FaPlus, FaTrashAlt } from 'react-icons/fa';
import { useIngredientesQuery } from '../../hooks/queries';
import useMediaQuery from '../../hooks/useMediaQuery';

const EditarRecetaIngredientes = ({ receta = [], onChange }) => {
  const esMobile = useMediaQuery('(max-width: 575.98px)');
  const [ingredientes, setIngredientes] = useState([]);
  const { data: ingredientesCache = [], isPending: cargandoCache } =
    useIngredientesQuery();

  useEffect(() => {
    if (ingredientesCache.length > 0) {
      setIngredientes(ingredientesCache);
    }
  }, [ingredientesCache]);

  const cargando = cargandoCache && ingredientes.length === 0;

  const cambiar = (indice, campo, valor) => {
    const siguiente = receta.map((fila, i) =>
      i === indice ? { ...fila, [campo]: valor } : fila
    );
    onChange(siguiente);
  };

  const agregar = () => {
    onChange([...receta, { ingredienteId: '', cantidad: 1, permiteQuitar: true }]);
  };

  const quitar = (indice) => {
    onChange(receta.filter((_, i) => i !== indice));
  };

  const ingredienteDe = (id) =>
    ingredientes.find((i) => Number(i.id) === Number(id));

  const ingredientesActivos = ingredientes.filter((i) => i.activo);

  const selectorIngrediente = (fila, indice) => (
    <Form.Select
      value={fila.ingredienteId}
      onChange={(e) => cambiar(indice, 'ingredienteId', e.target.value)}
      aria-label={`Ingrediente ${indice + 1}`}
    >
      <option value="">Seleccionar</option>
      {ingredientesActivos.map((i) => (
        <option key={i.id} value={i.id}>
          {i.nombre}
        </option>
      ))}
    </Form.Select>
  );

  const inputCantidad = (fila, indice) => (
    <Form.Control
      type="number"
      min="0.001"
      step="0.001"
      value={fila.cantidad}
      onChange={(e) => cambiar(indice, 'cantidad', e.target.value)}
      aria-label={`Cantidad del ingrediente ${indice + 1}`}
    />
  );

  const inputUnidad = (ingrediente, indice) => (
    <Form.Control
      type="text"
      value={ingrediente?.unidadMedida || ''}
      readOnly
      plaintext
      aria-label={`Unidad del ingrediente ${indice + 1}`}
    />
  );

  const checkboxQuitar = (fila, indice, conEtiqueta = false) => (
    <Form.Check
      type="checkbox"
      id={`receta-permite-quitar-${indice}`}
      checked={Boolean(fila.permiteQuitar)}
      onChange={(e) =>
        cambiar(indice, 'permiteQuitar', e.target.checked)
      }
      label={conEtiqueta ? 'Se puede quitar' : undefined}
    />
  );

  const botonQuitar = (indice) => (
    <Button
      type="button"
      size="sm"
      variant="outline-danger"
      onClick={() => quitar(indice)}
      aria-label={`Quitar ingrediente ${indice + 1}`}
    >
      <FaTrashAlt aria-hidden="true" />
    </Button>
  );

  return (
    <div className="mb-3">
      <Form.Label>Receta de ingredientes *</Form.Label>
      {cargando ? (
        <p className="text-muted small">Cargando ingredientes...</p>
      ) : (
        <>
          {esMobile ? (
            <div className="receta-ingredientes-mobile">
              {receta.map((fila, indice) => {
                const ingrediente = ingredienteDe(fila.ingredienteId);
                return (
                  <div className="receta-ingrediente-card" key={indice}>
                    <div className="receta-ingrediente-card-header">
                      <span className="fw-semibold">
                        Ingrediente {indice + 1}
                      </span>
                      {botonQuitar(indice)}
                    </div>
                    <Form.Group
                      className="mb-3"
                      controlId={`receta-ingrediente-${indice}`}
                    >
                      <Form.Label className="small mb-1">
                        Ingrediente
                      </Form.Label>
                      {selectorIngrediente(fila, indice)}
                    </Form.Group>
                    <div className="receta-ingrediente-card-grid">
                      <Form.Group controlId={`receta-cantidad-${indice}`}>
                        <Form.Label className="small mb-1">
                          Cantidad
                        </Form.Label>
                        {inputCantidad(fila, indice)}
                      </Form.Group>
                      <Form.Group controlId={`receta-unidad-${indice}`}>
                        <Form.Label className="small mb-1">Unidad</Form.Label>
                        {inputUnidad(ingrediente, indice)}
                      </Form.Group>
                    </div>
                    <div className="mt-2">
                      {checkboxQuitar(fila, indice, true)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Table size="sm" bordered>
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th>¿Se puede quitar?</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {receta.map((fila, indice) => {
                  const ingrediente = ingredienteDe(fila.ingredienteId);
                  return (
                    <tr key={indice}>
                      <td>{selectorIngrediente(fila, indice)}</td>
                      <td>{inputCantidad(fila, indice)}</td>
                      <td>{inputUnidad(ingrediente, indice)}</td>
                      <td className="text-center">
                        {checkboxQuitar(fila, indice)}
                      </td>
                      <td>{botonQuitar(indice)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline-primary"
            onClick={agregar}
          >
            <FaPlus className="me-1" aria-hidden="true" />
            Agregar ingrediente
          </Button>
          <Form.Text className="text-muted d-block mt-2">
            La receta es obligatoria para un producto. Los ingredientes con
            &quot;¿Se puede quitar?&quot; generan la opción &quot;Sin X&quot;
            en el detalle.
          </Form.Text>
        </>
      )}
    </div>
  );
};

EditarRecetaIngredientes.propTypes = {
  receta: PropTypes.arrayOf(
    PropTypes.shape({
      ingredienteId: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string,
      ]),
      cantidad: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      permiteQuitar: PropTypes.bool,
    })
  ),
  onChange: PropTypes.func.isRequired,
};

export default EditarRecetaIngredientes;
