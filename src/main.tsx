import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import './index.css';
import './registerSW'; // Register service worker

console.log('Rendering app...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Failed to find the root element');
  
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        color: red;
        padding: 20px;
        font-family: Arial;
        max-width: 600px;
        margin: 50px auto;
        text-align: center;
        border: 2px solid red;
        border-radius: 5px;
      ">
        <h2>Failed to load the game</h2>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        <button 
          onclick="window.location.reload()"
          style="
            padding: 10px 20px;
            font-size: 16px;
            margin-top: 20px;
            cursor: pointer;
            background-color: #ff4444;
            color: white;
            border: none;
            border-radius: 4px;
          "
        >
          Reload Game
        </button>
      </div>
    `;
  }
}
