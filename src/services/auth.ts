import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const MOCK_ENABLED = import.meta.env.VITE_MOCK_AUTH === 'true'
const MOCK_SESSION_KEY = 'fintrack-mock-session'

function buildMockSession(email: string): Session {
  const user: User = {
    id: 'mock-00000000-0000-0000-0000-000000000001',
    email,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User

  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  } as Session
}

const mockAuth = {
  async signIn(email: string, _password: string) {
    const session = buildMockSession(email)
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
    return { user: session.user, session }
  },
  async signUp(email: string, _password: string) {
    const session = buildMockSession(email)
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
    return { user: session.user, session }
  },
  async signOut() {
    localStorage.removeItem(MOCK_SESSION_KEY)
  },
  async getSession(): Promise<Session | null> {
    const raw = localStorage.getItem(MOCK_SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  },
}

export const authService = {
  async signIn(email: string, password: string) {
    if (MOCK_ENABLED) return mockAuth.signIn(email, password)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signUp(email: string, password: string) {
    if (MOCK_ENABLED) return mockAuth.signUp(email, password)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    if (MOCK_ENABLED) return mockAuth.signOut()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    if (MOCK_ENABLED) return mockAuth.getSession()
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },
}
