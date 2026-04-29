import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { useEnsureRecurring } from '@/hooks/useEnsureRecurring'
import { ExitIcon, DashboardIcon, ListBulletIcon, GearIcon, CardStackIcon, LayersIcon, BarChartIcon, HomeIcon } from '@radix-ui/react-icons'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/lancamentos', label: 'Lançamentos', icon: ListBulletIcon },
  { to: '/motos', label: 'Motos & Vendas', icon: LayersIcon },
  { to: '/investimentos', label: 'Investimentos', icon: BarChartIcon },
  { to: '/bens', label: 'Meus Bens', icon: HomeIcon },
  { to: '/configuracoes', label: 'Configurações', icon: GearIcon },
]

export function Layout() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  useEnsureRecurring()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'FT'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 flex-shrink-0 flex-col bg-gradient-to-b from-violet-950 to-slate-950 text-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500 shadow-lg shadow-violet-900/50">
            <CardStackIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">fintrack</span>
        </div>

        {/* Navigation */}
        <NavigationMenu.Root orientation="vertical" className="flex-1 px-3 pt-4">
          <NavigationMenu.List className="flex flex-col gap-0.5">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive = pathname === to
              return (
                <NavigationMenu.Item key={to}>
                  <NavigationMenu.Link asChild>
                    <Link
                      to={to}
                      className={clsx(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-white/[0.12] text-white'
                          : 'text-white/60 hover:bg-white/[0.07] hover:text-white/90'
                      )}
                    >
                      <Icon
                        className={clsx(
                          'h-4 w-4 flex-shrink-0',
                          isActive ? 'text-violet-300' : 'text-white/45'
                        )}
                      />
                      {label}
                    </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              )
            })}
          </NavigationMenu.List>
        </NavigationMenu.Root>

        {/* User + Logout */}
        <div className="space-y-1 border-t border-white/10 px-3 py-4">
          <div className="flex items-center gap-3 rounded-lg bg-white/[0.06] px-3 py-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/60 text-[11px] font-bold">
              {initials}
            </div>
            <span className="truncate text-xs text-white/55">{user?.email}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white/80"
          >
            <ExitIcon className="h-4 w-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <h1 className="text-base font-semibold text-foreground">
            {navItems.find((n) => n.to === pathname)?.label ?? 'fintrack'}
          </h1>
          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
