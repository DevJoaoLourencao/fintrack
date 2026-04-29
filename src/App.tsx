import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Layout } from '@/components/ui/Layout'
import { ToastProvider } from '@/components/ui/Toast'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { ConfigurationsPage } from '@/pages/ConfigurationsPage'
import { VehiclesPage } from '@/pages/VehiclesPage'
import { InvestmentsPage } from '@/pages/InvestmentsPage'
import { AssetsPage } from '@/pages/AssetsPage'
import { useAuth } from '@/hooks/useAuth'

function Spinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return <Spinner />
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AuthInitializer() {
  useAuth()
  return null
}

export default function App() {
  return (
    <>
      <AuthInitializer />
      <ToastProvider />
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/lancamentos" element={<TransactionsPage />} />
          <Route path="/configuracoes" element={<ConfigurationsPage />} />
          <Route path="/motos" element={<VehiclesPage />} />
          <Route path="/investimentos" element={<InvestmentsPage />} />
          <Route path="/bens" element={<AssetsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
