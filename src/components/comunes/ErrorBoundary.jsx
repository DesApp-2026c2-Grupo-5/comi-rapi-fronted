/**
 * Propósito: Componente Error Boundary para capturar errores de renderizado
 *            en subárboles de la aplicación y mostrar información de diagnóstico.
 * Contenido: ErrorBoundary con fallback que muestra el error y stack trace.
 * Dependencias: React (Component).
 * Uso: <ErrorBoundary><MiComponente /></ErrorBoundary>
 */
import { Component } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { FaBug, FaTerminal } from 'react-icons/fa';
import PropTypes from 'prop-types';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('[ErrorBoundary] Render error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      return (
        <Alert variant="danger" className="m-3" role="alert">
          <h4 className="alert-heading d-flex align-items-center gap-2">
            <FaBug className="text-danger" aria-hidden="true" />
            Error de renderizado en Panel de Superadmin
          </h4>
          <hr />
          <p className="mb-2">
            <strong>Mensaje:</strong> {error?.message || 'Error desconocido'}
          </p>
          <p className="mb-2">
            <strong>Componente:</strong> {error?.name || 'Desconocido'}
          </p>
          {errorInfo?.componentStack && (
            <details style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
              <summary>
                <FaTerminal className="me-1" aria-hidden="true" />
                Stack trace (clic para expandir)
              </summary>
              <pre className="mt-2 p-2 bg-dark text-light rounded small overflow-auto">
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
          <hr />
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => window.location.reload()}>
              Recargar página
            </Button>
            <Button variant="outline-secondary" onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}>
              Reintentar render
            </Button>
          </div>
        </Alert>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;