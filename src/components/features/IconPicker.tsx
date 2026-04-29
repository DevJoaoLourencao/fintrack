import { clsx } from 'clsx'
import { ICON_MAP, ICON_LIST } from '@/lib/iconMap'

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ICON_LIST.map((name) => {
        const Icon = ICON_MAP[name]
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(name)}
            title={name.replace('Icon', '')}
            className={clsx(
              'flex h-9 w-9 items-center justify-center rounded-md border transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted',
              value === name
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background'
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        )
      })}
    </div>
  )
}
