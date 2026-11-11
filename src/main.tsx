import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { initTheme } from './lib/theme'
import { initA11y } from './lib/a11y'

// Applied synchronously, before first paint, so there is no flash of the wrong theme/scale.
initTheme()
initA11y()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
