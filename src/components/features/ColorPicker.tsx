import { useRef } from 'react'
import { clsx } from 'clsx'
import { CheckIcon } from '@radix-ui/react-icons'

const COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#64748B',
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isCustom = !COLORS.includes(value)

  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={clsx(
            'h-8 w-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
            value === color && 'ring-2 ring-offset-2 ring-current'
          )}
          style={{ backgroundColor: color }}
          aria-label={color}
        >
          {value === color && <CheckIcon className="h-4 w-4 text-white" />}
        </button>
      ))}

      {/* Custom color swatch */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'h-8 w-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden',
          isCustom && 'ring-2 ring-offset-2 ring-current'
        )}
        style={isCustom ? { backgroundColor: value } : undefined}
        aria-label="Cor personalizada"
        title="Cor personalizada"
      >
        {isCustom
          ? <CheckIcon className="h-4 w-4 text-white" />
          : <span
              className="h-full w-full block rounded-full"
              style={{ background: 'conic-gradient(hsl(0,80%,55%), hsl(45,80%,55%), hsl(90,70%,45%), hsl(150,70%,40%), hsl(200,80%,50%), hsl(240,80%,60%), hsl(280,80%,55%), hsl(320,80%,55%), hsl(360,80%,55%))' }}
            />
        }
      </button>

      <input
        ref={inputRef}
        type="color"
        value={isCustom ? value : '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
