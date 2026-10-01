import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Auto-recover from stale chunks when new deployments occur while user has tab open
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  console.warn('vite:preloadError detected. Reloading page to fetch latest deployment...');
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

