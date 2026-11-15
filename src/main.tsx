import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { startUpdates } from './pwa'
import { StoreProvider } from './state/StoreProvider'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

startUpdates()

createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
