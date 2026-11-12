import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Container } from 'react-bootstrap';
import FormularioAdministrador from '../../components/admin/FormularioAdministrador';
import PaginaFormularioABM from '../../components/admin/PaginaFormularioABM';
import {
  crearUsuarioPanel,
  actualizarUsuarioPanel,
} from '../../api/usuarios';
import { useAdministradoresQuery } from '../../hooks/queries';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { SkeletonTarjeta } from '../../components/comunes/Skeleton';

const CLAVE_ADMINISTRADORES = ['private', 'administradores'];

const EditarAdministrador = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notificar } = useNotificaciones();
  const {
    data: dataAdministradores,
    isPending,
    error: errorQuery,
  } = useAdministradoresQuery();

  const administrador = useMemo(
    () =>
      id
        ? (dataAdministradores?.items || []).find(
            (item) => String(item.id) === String(id)
          )
        : null,
    [dataAdministradores, id]
  );

  const handleGuardar = async (datos) => {
    const resultado = id
      ? await actualizarUsuarioPanel(id, datos)
      : await crearUsuarioPanel(datos);

    if (!resultado.success) {
      return {
        ok: false,
        error:
          resultado.error ||
          (id
            ? 'No se pudo actualizar el administrador.'
            : 'No se pudo crear el administrador.'),
      };
    }

    await queryClient.invalidateQueries({ queryKey: CLAVE_ADMINISTRADORES });
    notificar(
      id
        ? 'Administrador actualizado correctamente.'
        : 'Administrador creado correctamente.',
      'success'
    );
    navigate('/superadmin/administrador');
    return { ok: true };
  };

  if (id && isPending) {
    return (
      <Container className="py-5" role="status" aria-live="polite">
        <span className="visually-hidden">Cargando administrador…</span>
        <SkeletonTarjeta />
      </Container>
    );
  }

  if (id && !administrador) {
    return (
      <PaginaFormularioABM
        titulo="Administrador no encontrado"
        volverA="/superadmin/administrador"
        volverTexto="Volver a administradores"
      >
        <Alert variant="warning" role="alert">
          {errorQuery?.message ||
            'No se encontró el administrador solicitado.'}
        </Alert>
      </PaginaFormularioABM>
    );
  }

  return (
    <PaginaFormularioABM
      titulo={id ? `Editar administrador #${id}` : 'Nuevo administrador'}
      descripcion="Definí los datos personales, el rol y el acceso al panel."
      volverA="/superadmin/administrador"
      volverTexto="Volver a administradores"
    >
      {errorQuery?.message && (
        <Alert variant="danger" role="alert" className="mb-3">
          {errorQuery.message}
        </Alert>
      )}
      <FormularioAdministrador
        administrador={administrador}
        onGuardar={handleGuardar}
      />
    </PaginaFormularioABM>
  );
};

export default EditarAdministrador;
