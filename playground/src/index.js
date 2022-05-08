import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GeistProvider, CssBaseline } from '@geist-ui/core'

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GeistProvider>
      <CssBaseline />
      <App />
    </GeistProvider>
  </React.StrictMode>
);