import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Simple Error Boundary to catch React crashes
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("React Uncaught Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'sans-serif', backgroundColor: '#f2f2f7', height: '100vh' }}>
          <h2 style={{ color: '#ff3b30', fontWeight: 'bold', fontSize: '20px' }}>应用遇到了问题</h2>
          <p style={{ marginTop: 10, color: '#8e8e93' }}>请截图以下信息并联系开发者：</p>
          <div style={{ marginTop: 20, padding: 16, backgroundColor: 'white', borderRadius: 12, overflow: 'auto', fontSize: '12px', border: '1px solid #e5e5ea' }}>
             <p style={{ color: '#000', fontWeight: 'bold' }}>{this.state.error?.toString()}</p>
             <pre style={{ marginTop: 10, color: '#666' }}>{this.state.error?.stack}</pre>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: 20, width: '100%', padding: 14, backgroundColor: '#007aff', color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold' }}
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

console.log('App is mounting...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);