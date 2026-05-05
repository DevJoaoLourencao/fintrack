import { clsx } from 'clsx'
import { ICON_MAP, ICON_LIST, EMOJI_GROUPS } from '@/lib/iconMap'

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
      {EMOJI_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">{group.label}</p>
          <div className="flex flex-wrap gap-1">
            {group.icons.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onChange(emoji)}
                className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded-md border text-base transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted',
                  value === emoji
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background'
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Ícones</p>
        <div className="flex flex-wrap gap-1">
          {ICON_LIST.map((name) => {
            const Icon = ICON_MAP[name]
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                title={name.replace('Icon', '')}
                className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded-md border transition-colors',
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
      </div>
    </div>
  )
}
