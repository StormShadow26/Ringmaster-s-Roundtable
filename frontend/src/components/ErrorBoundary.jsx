import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-2xl mx-auto p-8">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                🚨 Something went wrong
              </h1>
              <p className="text-gray-700 mb-4">
                The application encountered an error and couldn't render properly.
              </p>
              
              <div className="bg-red-50 p-4 rounded border">
                <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                <p className="text-sm text-red-700 font-mono">
                  {this.state.error && this.state.error.toString()}
                </p>
                
                {this.state.errorInfo && (
                  <details className="mt-3">
                    <summary className="text-sm font-semibold text-red-800 cursor-pointer">
                      Stack Trace (Click to expand)
                    </summary>
                    <pre className="text-xs text-red-600 mt-2 overflow-auto whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
              
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                🔄 Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;