import { AllocationChart } from "@/components/features/investments/AllocationChart";
import { AllocationTargetChart } from "@/components/features/investments/AllocationTargetChart";
import { AssetList } from "@/components/features/investments/AssetList";
import { InvestmentDialog } from "@/components/features/investments/InvestmentDialog";
import { PortfolioEvolutionChart } from "@/components/features/investments/PortfolioEvolutionChart";
import { PortfolioNotes } from "@/components/features/investments/PortfolioNotes";
import { SnapshotList } from "@/components/features/investments/SnapshotList";
import type { AssetCategory, InvestmentAsset } from "@/domain";
import { useBrapiCryptoQuotes, useBrapiQuotes } from "@/hooks/useBrapiQuotes";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import {
  useInvestmentAssetsQuery,
  useInvestmentSnapshotsQuery,
} from "@/hooks/useInvestments";
import { formatCurrency } from "@/lib/dateUtils";
import { useHideValuesStore } from "@/stores/hideValuesStore";
import { PlusIcon, UpdateIcon } from "@radix-ui/react-icons";
import { useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { useMemo, useState } from "react";

const CATEGORIES: { key: AssetCategory; label: string; color: string }[] = [
  { key: "acoes", label: "Ações", color: "#6366f1" },
  { key: "fiis", label: "FIIs", color: "#f59e0b" },
  { key: "cripto", label: "Cripto", color: "#f97316" },
  { key: "internacional", label: "Internacional", color: "#8b5cf6" },
  { key: "renda_fixa", label: "Renda Fixa", color: "#10b981" },
  {
    key: "reserva_oportunidade",
    label: "Reserva de Oportunidade",
    color: "#06b6d4",
  },
];

const BRAPI_CATEGORIES: AssetCategory[] = [
  "acoes",
  "fiis",
  "internacional",
  "cripto",
];

function toBrl(
  asset: InvestmentAsset,
  usdRate?: number,
  quoteMap?: Map<string, number>,
): number {
  const livePrice = quoteMap?.get(asset.name.toUpperCase().trim());
  const amount =
    livePrice != null && asset.quantity != null
      ? asset.quantity * livePrice
      : asset.amount;
  if (asset.currency === "USD" && usdRate) return amount * usdRate;
  return amount;
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
  const [refreshing, setRefreshing] = useState(false);
  const { hideValues } = useHideValuesStore();
  const queryClient = useQueryClient();
  const { data: snapshots = [], isLoading: snapshotsLoading } =
    useInvestmentSnapshotsQuery();
  const { data: assets = [], isLoading: assetsLoading } =
    useInvestmentAssetsQuery();
  const {
    data: usdRate,
    isLoading: rateLoading,
    isFetching: rateFetching,
    isError: rateError,
    refetch: refetchRate,
  } = useExchangeRate();
  const stockTickers = assets
    .filter((a) =>
      (["acoes", "fiis", "internacional"] as AssetCategory[]).includes(
        a.category,
      ),
    )
    .map((a) => a.name.toUpperCase().trim());
  const cryptoTickers = assets
    .filter((a) => a.category === "cripto")
    .map((a) => a.name.toUpperCase().trim());

  const { data: quotes = [] } = useBrapiQuotes(stockTickers);
  const { data: cryptoQuotes = [] } = useBrapiCryptoQuotes(cryptoTickers);

  const quoteMap = useMemo(
    () =>
      new Map<string, number>([
        ...quotes.map(
          (q) => [q.symbol.toUpperCase(), q.regularMarketPrice] as const,
        ),
        ...cryptoQuotes.map(
          (q) => [q.symbol.toUpperCase(), q.regularMarketPrice] as const,
        ),
      ]),
    [quotes, cryptoQuotes],
  );

  async function handleRefreshAll() {
    setRefreshing(true);
    await Promise.all([
      refetchRate(),
      queryClient.invalidateQueries({ queryKey: ["brapi_quotes"] }),
      queryClient.invalidateQueries({ queryKey: ["brapi_crypto_quotes"] }),
    ]);
    setRefreshing(false);
  }

  const isLoading =
    snapshotsLoading || assetsLoading || rateLoading || refreshing;

  const categoryTotals = useMemo(() => {
    const totals: Record<AssetCategory, number> = {
      acoes: 0,
      fiis: 0,
      cripto: 0,
      internacional: 0,
      renda_fixa: 0,
      reserva_oportunidade: 0,
    };
    for (const asset of assets) {
      totals[asset.category] += toBrl(asset, usdRate, quoteMap);
    }
    return totals;
  }, [assets, usdRate, quoteMap]);

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
      reserva_oportunidade: categoryTotals.reserva_oportunidade,
    }),
    [categoryTotals],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top row: exchange rate + refresh button */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <span>🇺🇸</span>
          <span>Dólar:</span>
          {rateLoading || rateFetching ? (
            <span className="h-4 w-14 animate-pulse rounded bg-muted inline-block" />
          ) : rateError ? (
            <span className="text-red-500">Erro</span>
          ) : usdRate ? (
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(usdRate)}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleRefreshAll}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
        >
          <UpdateIcon
            className={clsx("h-3.5 w-3.5", refreshing && "animate-spin")}
          />
          {refreshing ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      {/* Summary cards — computed from assets */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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

      {/* Allocation charts — current vs target */}
      {!isLoading && total > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AllocationChart
            snapshot={{ ...assetSnapshot, usd_rate: usdRate ?? 0 }}
          />
          <AllocationTargetChart />
        </div>
      )}

      {/* Asset list */}
      <AssetList
        assets={assets}
        isLoading={assetsLoading}
        usdRate={usdRate}
        hideValues={hideValues}
        refreshing={refreshing}
      />

      {/* Observations */}
      <PortfolioNotes />

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
