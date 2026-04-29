import { AllocationChart } from "@/components/features/investments/AllocationChart";
import { AssetList } from "@/components/features/investments/AssetList";
import { InvestmentDialog } from "@/components/features/investments/InvestmentDialog";
import { PortfolioEvolutionChart } from "@/components/features/investments/PortfolioEvolutionChart";
import { SnapshotList } from "@/components/features/investments/SnapshotList";
import type { AssetCategory, InvestmentAsset } from "@/domain";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import {
  useInvestmentAssetsQuery,
  useInvestmentSnapshotsQuery,
} from "@/hooks/useInvestments";
import { formatCurrency } from "@/lib/dateUtils";
import {
  EyeClosedIcon,
  EyeOpenIcon,
  PlusIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import { clsx } from "clsx";
import { useMemo, useState } from "react";

const CATEGORIES: { key: AssetCategory; label: string; color: string }[] = [
  { key: "acoes", label: "Ações", color: "#6366f1" },
  { key: "fiis", label: "FIIs", color: "#f59e0b" },
  { key: "cripto", label: "Cripto", color: "#f97316" },
  { key: "internacional", label: "Internacional", color: "#8b5cf6" },
  { key: "renda_fixa", label: "Renda Fixa", color: "#10b981" },
];

function toBrl(asset: InvestmentAsset, usdRate?: number): number {
  if (asset.currency === "USD" && usdRate) return asset.amount * usdRate;
  return asset.amount;
}

const HIDDEN_VALUE = "••••••";

function SummaryCard({
  label,
  value,
  color,
  isLoading,
  hideValues,
}: {
  label: string;
  value: number;
  color?: string;
  isLoading: boolean;
  hideValues: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-1.5">
        {color && (
          <span
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {isLoading ? (
        <div className="mt-1 h-6 w-24 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
          {hideValues ? HIDDEN_VALUE : formatCurrency(value)}
        </p>
      )}
    </div>
  );
}

export function InvestmentsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [hideValues, setHideValues] = useState(true);
  const [rateRefreshing, setRateRefreshing] = useState(false);
  const { data: snapshots = [], isLoading: snapshotsLoading } =
    useInvestmentSnapshotsQuery();
  const { data: assets = [], isLoading: assetsLoading } =
    useInvestmentAssetsQuery();
  const {
    data: usdRate,
    isLoading: rateLoading,
    isError: rateError,
    refetch: refetchRate,
  } = useExchangeRate();

  const rateFetching = rateLoading || rateRefreshing;

  async function handleRefetchRate() {
    setRateRefreshing(true);
    await Promise.all([refetchRate(), new Promise((r) => setTimeout(r, 3000))]);
    setRateRefreshing(false);
  }

  const isLoading = snapshotsLoading || assetsLoading;

  const categoryTotals = useMemo(() => {
    const totals: Record<AssetCategory, number> = {
      acoes: 0,
      fiis: 0,
      cripto: 0,
      internacional: 0,
      renda_fixa: 0,
    };
    for (const asset of assets) {
      totals[asset.category] += toBrl(asset, usdRate);
    }
    return totals;
  }, [assets, usdRate]);

  const total = Object.values(categoryTotals).reduce((s, v) => s + v, 0);

  const assetSnapshot = useMemo(
    () => ({
      id: "current",
      user_id: "",
      date: "",
      notes: null,
      created_at: "",
      acoes: categoryTotals.acoes,
      fiis: categoryTotals.fiis,
      cripto: categoryTotals.cripto,
      internacional: categoryTotals.internacional,
      renda_fixa: categoryTotals.renda_fixa,
    }),
    [categoryTotals],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar: exchange rate + toggle hide values */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <span className="text-base">🇺🇸</span>
          <span>Dólar comercial:</span>
          {rateFetching ? (
            <span className="h-4 w-16 animate-pulse rounded bg-muted inline-block" />
          ) : rateError ? (
            <span className="text-red-500">Erro ao buscar cotação</span>
          ) : usdRate ? (
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(usdRate)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={handleRefetchRate}
            disabled={rateFetching}
            className="ml-1 rounded p-0.5 hover:bg-muted transition-colors disabled:opacity-50"
            aria-label="Atualizar cotação"
          >
            <UpdateIcon
              className={clsx("h-3.5 w-3.5", rateFetching && "animate-spin")}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setHideValues((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label={hideValues ? "Exibir valores" : "Ocultar valores"}
        >
          {hideValues ? (
            <>
              <EyeOpenIcon className="h-3.5 w-3.5" />
              Exibir valores
            </>
          ) : (
            <>
              <EyeClosedIcon className="h-3.5 w-3.5" />
              Ocultar valores
            </>
          )}
        </button>
      </div>

      {/* Summary cards — computed from assets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard
          label="Total (BRL)"
          value={total}
          isLoading={isLoading}
          hideValues={hideValues}
        />
        {CATEGORIES.map((c) => (
          <SummaryCard
            key={c.key}
            label={c.label}
            value={categoryTotals[c.key]}
            color={c.color}
            isLoading={isLoading}
            hideValues={hideValues}
          />
        ))}
      </div>

      {/* Allocation chart — from asset totals */}
      {!isLoading && total > 0 && <AllocationChart snapshot={assetSnapshot} />}

      {/* Asset list */}
      <AssetList
        assets={assets}
        isLoading={assetsLoading}
        usdRate={usdRate}
        hideValues={hideValues}
      />

      {/* Portfolio evolution chart — only if ≥2 snapshots */}
      {!snapshotsLoading && snapshots.length >= 2 && (
        <PortfolioEvolutionChart snapshots={snapshots} />
      )}

      {/* Snapshot section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span />
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <PlusIcon className="h-4 w-4" />
            Registrar
          </button>
        </div>
        <SnapshotList snapshots={snapshots} isLoading={snapshotsLoading} />
      </div>

      <InvestmentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        currentAssets={assets}
      />
    </div>
  );
}
