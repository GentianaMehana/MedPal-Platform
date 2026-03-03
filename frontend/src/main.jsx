// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/medical-theme.css';  // ← Shto këtë

ReactDOM.createRoot(document.getElementById('root')).render(<App />);