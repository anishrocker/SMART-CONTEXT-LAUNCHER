import React from 'react';
import ReactDOM from 'react-dom/client';
import { CommandCenterShell } from './CommandCenterShell';
import './index.css';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <CommandCenterShell />
    </React.StrictMode>
  );
}
