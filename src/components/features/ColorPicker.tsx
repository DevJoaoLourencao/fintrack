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
    </div>
  )
}
