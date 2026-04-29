import * as Switch from '@radix-ui/react-switch'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { useThemeStore } from '@/stores/themeStore'

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <div className="flex items-center gap-2">
      <SunIcon className="h-4 w-4 text-muted-foreground" />
      <Switch.Root
        checked={isDark}
        onCheckedChange={toggle}
        className="relative h-5 w-9 rounded-full bg-muted transition-colors data-[state=checked]:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Toggle dark mode"
      >
        <Switch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-[18px]" />
      </Switch.Root>
      <MoonIcon className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}
