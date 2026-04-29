import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import { queryClient } from '@/lib/queryClient'
import './index.css'
import App from './App'

// Apply persisted theme before render to avoid flash
const saved = localStorage.getItem('fintrack-theme')
if (saved) {
  try {
    const { state } = JSON.parse(saved) as { state: { theme: string } }
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
  } catch {
    // ignore malformed storage
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
)
