import { useEffect, useState } from 'react'
import * as NavigationMenu from '@radix-ui/react-navigation-menu'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { useEnsureRecurring } from '@/hooks/useEnsureRecurring'
import {
  ExitIcon, DashboardIcon, ListBulletIcon, GearIcon, LayersIcon,
  BarChartIcon, HomeIcon, PersonIcon, EyeOpenIcon, EyeClosedIcon,
  HamburgerMenuIcon, Cross2Icon, ChevronLeftIcon, ChevronRightIcon,
} from '@radix-ui/react-icons'
import { useNavStore } from '@/stores/navStore'
import { useHideValuesStore } from '@/stores/hideValuesStore'

const ALL_NAV_ITEMS = [
  { to: '/dashboard',     key: null,             label: 'Dashboard',          icon: DashboardIcon },
  { to: '/lancamentos',   key: 'lancamentos',    label: 'Lançamentos',        icon: ListBulletIcon },
  { to: '/motos',         key: 'motos',          label: 'Loja de Veículos',   icon: LayersIcon },
  { to: '/investimentos', key: 'investimentos',  label: 'Investimentos',      icon: BarChartIcon },
  { to: '/bens',          key: 'bens',           label: 'Meus Bens',          icon: HomeIcon },
  { to: '/configuracoes', key: null,             label: 'Configurações',      icon: GearIcon },
] as const

// ── UserMenu ──────────────────────────────────────────────────────────────────

function UserMenu({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const name = email.split('@')[0]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Menu do usuário"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400">
            <PersonIcon className="h-3.5 w-3.5" />
          </span>
          <span className="max-w-[120px] truncate text-sm font-medium text-foreground">{name}</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[200px] rounded-xl border border-border bg-card p-3 shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          <div className="mb-3 px-1">
            <p className="text-xs font-semibold text-foreground">Conta</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{email}</p>
          </div>

          <DropdownMenu.Separator className="my-2 h-px bg-border" />

          <DropdownMenu.Item
            onSelect={onSignOut}
            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-red-500 outline-none hover:bg-red-500/10 focus:bg-red-500/10"
          >
            <ExitIcon className="h-3.5 w-3.5" />
            Sair
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// ── SidebarContent ────────────────────────────────────────────────────────────

interface SidebarProps {
  pathname: string
  navItems: typeof ALL_NAV_ITEMS[number][]
  hideValues: boolean
  toggleHideValues: () => void
  onNavClick?: () => void
  showCloseButton?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
}

function SidebarContent({
  pathname, navItems, hideValues, toggleHideValues,
  onNavClick, showCloseButton, collapsed, onToggleCollapse,
}: SidebarProps) {
  return (
    <>
      {/* Logo */}
      <div className={clsx(
        'flex h-16 flex-shrink-0 items-center border-b border-border/60 dark:border-white/8',
        collapsed ? 'justify-center px-2' : 'justify-between px-5'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 rounded-lg bg-violet-500 blur-md opacity-40 dark:opacity-50" />
              <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-indigo-600 shadow-lg shadow-violet-500/30 dark:shadow-violet-900/60">
                <span className="text-sm font-bold text-white leading-none">$</span>
              </div>
            </div>
            <span className="text-base font-bold tracking-tight text-foreground dark:text-white">fintrack</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="rounded-lg p-1.5 text-muted-foreground dark:text-white/35 hover:bg-muted hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white/70 transition-colors"
              aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {collapsed
                ? <ChevronRightIcon className="h-4 w-4" />
                : <ChevronLeftIcon className="h-4 w-4" />
              }
            </button>
          )}
          {showCloseButton && (
            <button
              type="button"
              onClick={onNavClick}
              className="rounded-lg p-1.5 text-muted-foreground dark:text-white/35 hover:bg-muted hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white/70 transition-colors"
              aria-label="Fechar menu"
            >
              <Cross2Icon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <NavigationMenu.Root
        orientation="vertical"
        className={clsx('flex-1 pt-4 overflow-y-auto', collapsed ? 'px-2' : 'px-3')}
      >
        <NavigationMenu.List className="flex flex-col gap-0.5">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = pathname === to
            return (
              <NavigationMenu.Item key={to}>
                <NavigationMenu.Link asChild>
                  <Link
                    to={to}
                    onClick={onNavClick}
                    title={collapsed ? label : undefined}
                    className={clsx(
                      'relative flex items-center rounded-xl py-2.5 text-sm font-medium transition-all duration-150',
                      collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                      isActive
                        ? 'bg-violet-50 text-violet-700 shadow-sm shadow-violet-100 dark:bg-white/[0.13] dark:text-white dark:shadow-black/20'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-white/55 dark:hover:bg-white/[0.06] dark:hover:text-white/85'
                    )}
                  >
                    {isActive && !collapsed && (
                      <span className="absolute left-2 h-4 w-0.5 rounded-full bg-violet-500 dark:bg-violet-400" />
                    )}
                    <Icon
                      className={clsx(
                        'h-4 w-4 flex-shrink-0 transition-colors',
                        isActive ? 'text-violet-500 dark:text-violet-300' : 'text-slate-400 dark:text-white/40'
                      )}
                    />
                    {!collapsed && label}
                  </Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            )
          })}
        </NavigationMenu.List>
      </NavigationMenu.Root>

      {/* Bottom controls */}
      <div className="border-t border-border/60 dark:border-white/8 flex-shrink-0">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1 py-3">
            <button
              type="button"
              onClick={toggleHideValues}
              className="rounded-lg p-2 text-muted-foreground dark:text-white/35 hover:text-foreground dark:hover:text-white/70 transition-colors"
              aria-label={hideValues ? 'Exibir valores' : 'Ocultar valores'}
            >
              {hideValues ? <EyeClosedIcon className="h-4 w-4" /> : <EyeOpenIcon className="h-4 w-4" />}
            </button>
            <div className="py-1">
              <ThemeToggle />
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground dark:text-white/35">Valores</span>
              <button
                type="button"
                onClick={toggleHideValues}
                className="rounded-lg p-1 text-muted-foreground dark:text-white/35 hover:text-foreground dark:hover:text-white/70 transition-colors"
                aria-label={hideValues ? 'Exibir valores' : 'Ocultar valores'}
              >
                {hideValues ? <EyeClosedIcon className="h-4 w-4" /> : <EyeOpenIcon className="h-4 w-4" />}
              </button>
            </div>
            <div className="px-5 py-3 flex items-center justify-between border-t border-border/60 dark:border-white/8">
              <span className="text-xs text-muted-foreground dark:text-white/35">Tema</span>
              <ThemeToggle />
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

export function Layout() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { isVisible } = useNavStore()
  const { hideValues, toggle: toggleHideValues } = useHideValuesStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  useEnsureRecurring()

  useEffect(() => {
    useNavStore.persist.rehydrate()
    useHideValuesStore.persist.rehydrate()
  }, [user?.id])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navItems = ALL_NAV_ITEMS.filter((item) => item.key === null || isVisible(item.key))

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const sidebarProps: SidebarProps = {
    pathname,
    navItems,
    hideValues,
    toggleHideValues,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/*
       * Mobile overlay — always mounted so CSS exit animations play.
       * pointer-events-none when closed prevents interaction with off-screen panel.
       */}
      <div
        className={clsx(
          'fixed inset-0 z-50 md:hidden',
          !mobileMenuOpen && 'pointer-events-none'
        )}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Backdrop */}
        <div
          className={clsx(
            'absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300',
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Sidebar panel — slides in from the left */}
        <aside
          className={clsx(
            'absolute left-0 top-0 h-full w-64 flex flex-col',
            'border-r border-border bg-gradient-to-b from-slate-50 to-white',
            'dark:border-transparent dark:from-violet-950 dark:via-indigo-950 dark:to-slate-950',
            'shadow-2xl',
            'transition-transform duration-300 ease-in-out',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <SidebarContent
            {...sidebarProps}
            onNavClick={() => setMobileMenuOpen(false)}
            showCloseButton
          />
        </aside>
      </div>

      {/* Desktop sidebar — collapsible */}
      <aside
        className={clsx(
          'hidden md:flex flex-shrink-0 flex-col overflow-hidden',
          'border-r border-border bg-gradient-to-b from-slate-50 to-white',
          'dark:border-transparent dark:from-violet-950 dark:via-indigo-950 dark:to-slate-950',
          'transition-[width] duration-300 ease-in-out',
          sidebarCollapsed ? 'w-14' : 'w-60'
        )}
      >
        <SidebarContent
          {...sidebarProps}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        />
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border/60 bg-card/80 px-4 md:px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Hamburger — animates to X when menu is open */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              <span
                className={clsx(
                  'transition-transform duration-200',
                  mobileMenuOpen ? 'rotate-90 scale-90' : 'rotate-0 scale-100'
                )}
              >
                {mobileMenuOpen
                  ? <Cross2Icon className="h-4 w-4" />
                  : <HamburgerMenuIcon className="h-4 w-4" />
                }
              </span>
            </button>
            <h1 className="text-base font-semibold text-foreground">
              {navItems.find((n) => n.to === pathname)?.label ?? 'fintrack'}
            </h1>
          </div>
          {user?.email && (
            <UserMenu email={user.email} onSignOut={handleSignOut} />
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
