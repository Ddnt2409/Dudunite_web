import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';  // ✅ Importando o componente principal
import './index.css';         // Ou o nome do seu CSS principal

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
