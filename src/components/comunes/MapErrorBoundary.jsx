import React, { Component } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { FaExclamationTriangle, FaUndo } from 'react-icons/fa';

export class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[MapErrorBoundary] Error caught:', error);
    console.error('[MapErrorBoundary] Component stack:', errorInfo.componentStack);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="comi-map-error" role="alert">
          <Alert variant="danger" className="d-flex flex-column align-items-center gap-3 p-4">
            <div className="text-center">
              <FaExclamationTriangle size={48} className="mb-2" />
              <h5 className="mb-1">Error cargando el mapa</h5>
              <p className="text-muted small mb-0">
                {this.state.error?.message || 'Error desconocido'}
              </p>
            </div>
            <details style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto', width: '100%' }}>
              <summary className="text-muted small mb-1">Detalles técnicos (clic para expandir)</summary>
              <pre className="small text-muted" style={{ fontSize: '0.7rem' }}>
                {this.state.error?.stack || 'Sin stack trace'}
              </pre>
            </details>
            <Button variant="outline-primary" onClick={this.handleRetry}>
              <FaUndo className="me-1" /> Reintentar
            </Button>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;