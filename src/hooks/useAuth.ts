import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth'

const MOCK_ENABLED = import.meta.env.VITE_MOCK_AUTH === 'true'

export function useAuth() {
  const { user, session, loading, setUser, setSession, setLoading, reset } = useAuthStore()

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    if (MOCK_ENABLED) return

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [setUser, setSession, setLoading])

  async function signIn(email: string, password: string) {
    const result = await authService.signIn(email, password)
    setSession(result.session)
    setUser(result.session?.user ?? result.user ?? null)
    return result
  }

  async function signUp(email: string, password: string) {
    return authService.signUp(email, password)
  }

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut: () => authService.signOut().then(reset),
  }
}
