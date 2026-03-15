import React from 'react';
import ReactDOM from 'react-dom/client';
import { OptionsShell } from './OptionsShell';
import './index.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <OptionsShell />
    </React.StrictMode>
  );
}
