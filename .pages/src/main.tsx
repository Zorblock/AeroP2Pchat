import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import 'lenis/dist/lenis.css'
import './reset.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster 
      theme="light" 
      position="bottom-center" 
      toastOptions={{
        style: {
          background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.8)',
          color: '#0f172a',
          borderRadius: '16px',
          fontWeight: 600,
          fontFamily: 'sans-serif'
        }
      }} 
    />
    <App />
  </StrictMode>,
)
