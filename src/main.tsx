import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Initialize i18n before React renders
import '@/shared/i18n'

import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
