import { useContext } from 'react';
import { PersonalizacionContext } from '../context/PersonalizacionContext';

export const usePersonalizacion = () => {
  const ctx = useContext(PersonalizacionContext);
  if (!ctx) throw new Error('usePersonalizacion debe usarse dentro de PersonalizacionProvider');
  return ctx;
};

export default usePersonalizacion;
