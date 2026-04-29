export const queryKeys = {
  cards: (userId: string) => ['cards', userId] as const,
  categories: (userId: string) => ['categories', userId] as const,
  installmentsByMonth: (userId: string, month: string) =>
    ['installments', 'month', userId, month] as const,
  installmentsUpcoming: (userId: string) =>
    ['installments', 'upcoming', userId] as const,
  installmentsTrend: (userId: string) =>
    ['installments', 'trend', userId] as const,
  invoices: (userId: string) => ['invoices', userId] as const,
  activeInstallments: (userId: string) => ['installments', 'active', userId] as const,
  subscriptions: (userId: string) => ['transactions', 'subscriptions', userId] as const,
  vehicles: (userId: string) => ['vehicles', userId] as const,
  vehicleSales: (userId: string) => ['vehicle_sales', userId] as const,
  investmentSnapshots: (userId: string) => ['investment_snapshots', userId] as const,
  investmentAssets: (userId: string) => ['investment_assets', userId] as const,
  personalAssets: (userId: string) => ['personal_assets', userId] as const,
}
