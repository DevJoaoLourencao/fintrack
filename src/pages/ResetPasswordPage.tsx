import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { updatePassword, signOut } = useAuth()

  useEffect(() => {
    // Supabase processes the recovery token from the URL hash automatically
    // (detectSessionInUrl). Capture any error returned in the hash.
    const hash = new URLSearchParams(window.location.hash.slice(1))
    if (hash.get('error')) {
      setLinkError(
        hash.get('error_description')?.replace(/\+/g, ' ') ??
          'Link inválido ou expirado.'
      )
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await updatePassword(password)
      toast({ title: 'Senha redefinida!', description: 'Faça login com sua nova senha.' })
      await signOut()
      navigate('/login')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--background))] px-4">
      <div className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </div>

      <div className="pointer-events-none absolute -top-64 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-[380px]">
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-[22px] bg-violet-500 blur-xl opacity-40" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-violet-500 to-indigo-600 shadow-2xl shadow-violet-500/40">
              <span className="text-2xl font-bold text-white leading-none">$</span>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-[28px] font-bold tracking-tight text-foreground">Nova senha</h1>
            <p className="mt-1 text-sm text-muted-foreground">Defina uma nova senha para sua conta</p>
          </div>
        </div>

        <div
          className="rounded-3xl border border-white/10 bg-white/80 p-7 shadow-2xl shadow-black/10 backdrop-blur-xl dark:bg-white/[0.04] dark:shadow-black/40"
          style={{
            boxShadow:
              '0 8px 40px -8px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {linkError ? (
            <div className="flex flex-col gap-4 text-center">
              <p className="text-sm text-muted-foreground">{linkError}</p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Voltar ao login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Nova senha
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-violet-400 focus:bg-background focus:outline-none focus:ring-4 focus:ring-violet-500/10 dark:bg-white/5"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Confirmar senha
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-violet-400 focus:bg-background focus:outline-none focus:ring-4 focus:ring-violet-500/10 dark:bg-white/5"
                  placeholder="••••••••"
                />
              </div>

              {!ready && (
                <p className="-mt-1 text-xs leading-relaxed text-muted-foreground">
                  Verificando o link de recuperação…
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !ready}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  'Redefinir senha'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          <button
            onClick={() => navigate('/login')}
            className="font-semibold text-violet-500 hover:text-violet-400 transition-colors"
          >
            Voltar ao login
          </button>
        </p>
      </div>
    </div>
  )
}
