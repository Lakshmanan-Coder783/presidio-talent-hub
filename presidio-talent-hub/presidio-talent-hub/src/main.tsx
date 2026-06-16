import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

window.onerror = (msg, src, line, col, err) => {
  document.body.innerHTML = `<div style="padding:2rem;font-family:monospace;background:#fee;color:#800;white-space:pre-wrap">
<h2>Window Error</h2>
<b>${msg}</b>
File: ${src} Line: ${line}:${col}
${err?.stack ?? ''}
</div>`;
};

window.addEventListener('unhandledrejection', (e) => {
  document.body.innerHTML = `<div style="padding:2rem;font-family:monospace;background:#fee;color:#800;white-space:pre-wrap">
<h2>Unhandled Promise Rejection</h2>
${e.reason?.message ?? String(e.reason)}
${e.reason?.stack ?? ''}
</div>`;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
