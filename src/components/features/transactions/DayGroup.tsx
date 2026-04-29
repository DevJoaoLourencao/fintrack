import type { RichInstallment } from '@/domain'
import { formatDate } from '@/lib/dateUtils'
import { InstallmentRow } from './InstallmentRow'

interface DayGroupProps {
  date: string
  items: RichInstallment[]
}

export function DayGroup({ date, items }: DayGroupProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {formatDate(date)}
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <InstallmentRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
