import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

type Mode = 'login' | 'signup'

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { signIn, signUp } = useAuth()

  const cardRef = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = cardRef.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = (e.clientX - left) / width  - 0.5   // -0.5 → 0.5
    const y = (e.clientY - top)  / height - 0.5
    el.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale3d(1.02,1.02,1.02)`
  }

  function handleMouseLeave() {
    const el = cardRef.current
    if (!el) return
    el.style.transform = 'perspective(700px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        toast({ title: 'Conta criada!', description: 'Verifique seu e-mail para confirmar o cadastro.' })
        setMode('login')
        return
      }
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      toast({ title: 'Erro', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[hsl(var(--background))] px-4">

      {/* Theme toggle — top right */}
      <div className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute -top-64 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-64 w-64 rounded-full bg-purple-500/8 blur-[90px]" />

      <div className="relative z-10 w-full max-w-[380px]">

        {/* Icon + brand */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-[22px] bg-violet-500 blur-xl opacity-40" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-violet-500 to-indigo-600 shadow-2xl shadow-violet-500/40">
              <span className="text-2xl font-bold text-white leading-none">$</span>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-[28px] font-bold tracking-tight text-foreground">fintrack</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta gratuitamente'}
            </p>
          </div>
        </div>

        {/* Glass card */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="rounded-3xl border border-white/10 bg-white/80 p-7 shadow-2xl shadow-black/10 backdrop-blur-xl dark:bg-white/[0.04] dark:shadow-black/40"
          style={{
            boxShadow: '0 8px 40px -8px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
            transition: 'transform 0.12s ease-out',
            willChange: 'transform',
          }}
        >
          {/* Mode tabs */}
          <div className="mb-6 flex rounded-xl bg-muted p-1">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? 'bg-white text-foreground shadow-sm dark:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Cadastrar'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-violet-400 focus:bg-background focus:outline-none focus:ring-4 focus:ring-violet-500/10 dark:bg-white/5"
                placeholder="seu@email.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-violet-400 focus:bg-background focus:outline-none focus:ring-4 focus:ring-violet-500/10 dark:bg-white/5"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-violet-500/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                mode === 'login' ? 'Entrar' : 'Criar conta'
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          {mode === 'login' ? (
            <>
              Não tem conta?{' '}
              <button onClick={() => setMode('signup')} className="font-semibold text-violet-500 hover:text-violet-400 transition-colors">
                Criar conta
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button onClick={() => setMode('login')} className="font-semibold text-violet-500 hover:text-violet-400 transition-colors">
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
