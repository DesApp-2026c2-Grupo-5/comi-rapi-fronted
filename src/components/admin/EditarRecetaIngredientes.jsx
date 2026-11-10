import { useEffect, useState } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { FaPlus, FaTrashAlt } from 'react-icons/fa';
import { obtenerIngredientes } from '../../api/ingredientes';

const EditarRecetaIngredientes = ({ receta = [], onChange }) => {
  const [ingredientes, setIngredientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const result = await obtenerIngredientes();
      if (result.success) setIngredientes(result.data || []);
      setCargando(false);
    };
    cargar();
  }, []);

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

  return (
    <div className="mb-3">
      <Form.Label>Receta de ingredientes *</Form.Label>
      {cargando ? (
        <p className="text-muted small">Cargando ingredientes...</p>
      ) : (
        <>
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
                    <td>
                      <Form.Select
                        value={fila.ingredienteId}
                        onChange={(e) =>
                          cambiar(indice, 'ingredienteId', e.target.value)
                        }
                      >
                        <option value="">Seleccionar</option>
                        {ingredientes
                          .filter((i) => i.activo)
                          .map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.nombre}
                            </option>
                          ))}
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={fila.cantidad}
                        onChange={(e) =>
                          cambiar(indice, 'cantidad', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        value={ingrediente?.unidadMedida || ''}
                        readOnly
                        plaintext
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={Boolean(fila.permiteQuitar)}
                        onChange={(e) =>
                          cambiar(indice, 'permiteQuitar', e.target.checked)
                        }
                      />
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => quitar(indice)}
                      >
                        <FaTrashAlt />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Button size="sm" variant="outline-primary" onClick={agregar}>
            <FaPlus className="me-1" />
            Agregar ingrediente
          </Button>
          <Form.Text className="text-muted d-block mt-2">
            La receta es obligatoria para un producto. Los ingredientes con
            "¿Se puede quitar?" generan la opción "Sin X" en el detalle.
          </Form.Text>
        </>
      )}
    </div>
  );
};

export default EditarRecetaIngredientes;
