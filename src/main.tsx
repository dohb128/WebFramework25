import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'   // ✅ Tailwind 스타일 포함

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)