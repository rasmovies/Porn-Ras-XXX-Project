import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Global error handler - Streamtape iframe cross-origin hatalarını bastır
window.addEventListener('error', (event) => {
  // Streamtape iframe cross-origin hatalarını bastır
  if (
    event.message?.includes('Blocked a frame with origin') ||
    event.message?.includes('streamtape.com') ||
    event.message?.includes('document.domain') ||
    event.filename?.includes('streamtape.com') ||
    event.filename?.includes('.mp4')
  ) {
    event.preventDefault();
    return false;
  }
}, true);

// Global unhandled rejection handler - Streamtape ile ilgili promise rejection'ları bastır
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason?.toString() || '';
  if (
    reason.includes('streamtape.com') ||
    reason.includes('Blocked a frame') ||
    reason.includes('document.domain')
  ) {
    event.preventDefault();
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
