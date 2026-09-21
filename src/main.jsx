import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { bootstrapLineFromURL } from './config/line';
import './index.css';

// 必须在渲染前跑：?line=cn 会写入 localStorage 并可能触发整页重载
bootstrapLineFromURL();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
