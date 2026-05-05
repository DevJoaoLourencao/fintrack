import { PERSONAL_ASSET_CATEGORIES } from "@/components/features/assets/PersonalAssetDialog";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useInvestmentAssetsQuery } from "@/hooks/useInvestments";
import { useBrapiQuotes, useBrapiCryptoQuotes } from "@/hooks/useBrapiQuotes";
import { usePersonalAssetsQuery } from "@/hooks/usePersonalAssets";
import { useVehicleSalesQuery, useVehiclesQuery } from "@/hooks/useVehicles";
import type { InvestmentAsset, AssetCategory } from "@/domain";
import { formatCurrency } from "@/lib/dateUtils";
import { useNavStore } from "@/stores/navStore";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { clsx } from "clsx";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const BRAPI_STOCK_CATEGORIES: AssetCategory[] = ["acoes", "fiis", "internacional"];

function useLiveBrl(assets: InvestmentAsset[], usdRate: number | undefined) {
  const stockTickers = assets
    .filter((a) => BRAPI_STOCK_CATEGORIES.includes(a.category))
    .map((a) => a.name.toUpperCase().trim())
  const cryptoTickers = assets
    .filter((a) => a.category === "cripto")
    .map((a) => a.name.toUpperCase().trim())

  const { data: quotes = [] } = useBrapiQuotes(stockTickers)
  const { data: cryptoQuotes = [] } = useBrapiCryptoQuotes(cryptoTickers)

  const quoteMap = useMemo(() => new Map([
    ...quotes.map((q) => [q.symbol.toUpperCase(), q.regularMarketPrice] as const),
    ...cryptoQuotes.map((q) => [q.symbol.toUpperCase(), q.regularMarketPrice] as const),
  ]), [quotes, cryptoQuotes])

  function toBrl(asset: InvestmentAsset): number {
    const livePrice = quoteMap.get(asset.name.toUpperCase().trim())
    const amount = livePrice != null && asset.quantity != null
      ? asset.quantity * livePrice
      : asset.amount
    if (asset.currency === "USD" && usdRate) return amount * usdRate
    return amount
  }

  return { toBrl }
}

const CATEGORIES: { key: string; label: string; color: string }[] = [
  { key: "acoes",                label: "Ações",                    color: "#6366f1" },
  { key: "fiis",                 label: "FIIs",                     color: "#f59e0b" },
  { key: "cripto",               label: "Cripto",                   color: "#f97316" },
  { key: "internacional",        label: "Internacional",            color: "#8b5cf6" },
  { key: "renda_fixa",           label: "Renda Fixa",              color: "#10b981" },
  { key: "reserva_oportunidade", label: "Reserva de Oportunidade", color: "#06b6d4" },
];

const HIDDEN_VALUE = "••••••";

function WidgetCard({
  title,
  to,
  isLoading,
  children,
}: {
  title: string;
  to?: string;
  isLoading?: boolean;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 flex flex-col gap-3 shadow-card-md transition-shadow hover:shadow-card-lg">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {to && (
          <button
            type="button"
            onClick={() => navigate(to)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver mais <ArrowRightIcon className="h-3 w-3" />
          </button>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-5 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border" />;
}

// ── Investimentos ─────────────────────────────────────────────────────────────

function InvestimentosWidget({ hideValues }: { hideValues: boolean }) {
  const { data: assets = [], isLoading } = useInvestmentAssetsQuery();
  const { data: usdRate } = useExchangeRate();
  const { toBrl } = useLiveBrl(assets, usdRate);

  const { total, byCategory } = useMemo(() => {
    const cats: Record<string, number> = {};
    let sum = 0;
    for (const a of assets) {
      const brl = toBrl(a);
      sum += brl;
      cats[a.category] = (cats[a.category] ?? 0) + brl;
    }
    const sorted = CATEGORIES.map((c) => ({
      ...c,
      value: cats[c.key] ?? 0,
    })).filter((c) => c.value > 0);
    return { total: sum, byCategory: sorted };
  }, [assets, usdRate, toBrl]);

  return (
    <WidgetCard title="Investimentos" to="/investimentos" isLoading={isLoading}>
      <div>
        <p className="text-xs text-muted-foreground">Patrimônio total</p>
        <p className="text-xl font-bold tabular-nums text-foreground">
          {hideValues ? HIDDEN_VALUE : formatCurrency(total)}
        </p>
      </div>

      {byCategory.length > 0 && (
        <>
          <Divider />
          <div className="space-y-2">
            {byCategory.map((cat) => {
              const pct = total > 0 ? (cat.value / total) * 100 : 0;
              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums text-foreground">
                        {hideValues ? HIDDEN_VALUE : formatCurrency(cat.value)}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground w-8 text-right">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {assets.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum ativo cadastrado.
        </p>
      )}
    </WidgetCard>
  );
}

// ── Veículos ──────────────────────────────────────────────────────────────────

function VeiculosWidget({ hideValues }: { hideValues: boolean }) {
  const { data: vehicles = [], isLoading: loadingV } = useVehiclesQuery();
  const { data: sales = [], isLoading: loadingS } = useVehicleSalesQuery();

  const active = vehicles.filter((v) => v.status === "active");
  const pending = sales.filter((s) => !s.completed);
  const completed = sales.filter((s) => s.completed);

  const totalInvested = active.reduce((s, v) => s + v.purchase_price, 0);
  const totalReceivable = pending.reduce(
    (s, sale) =>
      s +
      (sale.installments_count - sale.installments_paid) *
        sale.installments_amount,
    0,
  );
  const totalProfit = completed.reduce(
    (s, sale) => s + (sale.total_sale_price - sale.vehicle.purchase_price),
    0,
  );

  const isLoading = loadingV || loadingS;

  return (
    <WidgetCard title="Veículos" to="/motos" isLoading={isLoading}>
      {/* Em estoque — destaque principal */}
      <div>
        <p className="text-xs text-muted-foreground">Em estoque</p>
        <p className="text-xl font-bold tabular-nums text-foreground">
          {hideValues ? HIDDEN_VALUE : formatCurrency(totalInvested)}
        </p>
        <p className="text-xs text-muted-foreground">
          {active.length} {active.length === 1 ? "veículo" : "veículos"}
        </p>
      </div>

      <Divider />

      {/* A receber + Lucro lado a lado */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">A receber</p>
          <p className="text-sm font-bold tabular-nums text-foreground">
            {hideValues ? HIDDEN_VALUE : formatCurrency(totalReceivable)}
          </p>
          <p className="text-xs text-muted-foreground">
            {pending.length} {pending.length === 1 ? "venda" : "vendas"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Lucro realizado</p>
          <p
            className={clsx(
              "text-sm font-bold tabular-nums",
              completed.length === 0
                ? "text-foreground"
                : totalProfit >= 0
                  ? "text-green-500"
                  : "text-red-500",
            )}
          >
            {hideValues
              ? HIDDEN_VALUE
              : completed.length > 0
                ? (totalProfit >= 0 ? "+" : "") + formatCurrency(totalProfit)
                : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {completed.length}{" "}
            {completed.length === 1 ? "concluída" : "concluídas"}
          </p>
        </div>
      </div>
    </WidgetCard>
  );
}

// ── Bens Pessoais ─────────────────────────────────────────────────────────────

function BensWidget({ hideValues }: { hideValues: boolean }) {
  const { data: assets = [], isLoading } = usePersonalAssetsQuery();

  const { total, byCategory } = useMemo(() => {
    const cats: Record<string, number> = {};
    let sum = 0;
    for (const a of assets) {
      const val = a.current_value ?? a.purchase_value;
      sum += val;
      cats[a.category] = (cats[a.category] ?? 0) + val;
    }
    const sorted = PERSONAL_ASSET_CATEGORIES.map((c) => ({
      ...c,
      value: cats[c.key] ?? 0,
    })).filter((c) => c.value > 0);
    return { total: sum, byCategory: sorted };
  }, [assets]);

  return (
    <WidgetCard title="Meus Bens" to="/bens" isLoading={isLoading}>
      <div>
        <p className="text-xs text-muted-foreground">Valor total dos bens</p>
        <p className="text-xl font-bold tabular-nums text-foreground">
          {hideValues ? HIDDEN_VALUE : formatCurrency(total)}
        </p>
        <p className="text-xs text-muted-foreground">
          {assets.length} {assets.length === 1 ? "bem" : "bens"}
        </p>
      </div>

      {byCategory.length > 0 && (
        <>
          <Divider />
          <div className="space-y-2">
            {byCategory.map((cat) => {
              const pct = total > 0 ? (cat.value / total) * 100 : 0;
              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums text-foreground">
                        {hideValues ? HIDDEN_VALUE : formatCurrency(cat.value)}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground w-8 text-right">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {assets.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhum bem cadastrado.</p>
      )}
    </WidgetCard>
  );
}

// ── Patrimônio Total ──────────────────────────────────────────────────────────

function PatrimonioWidget({ hideValues }: { hideValues: boolean }) {
  const { isVisible } = useNavStore();
  const showInv = isVisible("investimentos");
  const showMot = isVisible("motos");
  const showBens = isVisible("bens");

  const { data: assets = [], isLoading: loadingAssets } = useInvestmentAssetsQuery();
  const { data: usdRate } = useExchangeRate();
  const { data: vehicles = [], isLoading: loadingVehicles } = useVehiclesQuery();
  const { data: personalAssets = [], isLoading: loadingPersonal } = usePersonalAssetsQuery();
  const { toBrl: toInvBrl } = useLiveBrl(assets, usdRate);

  const totalInvestimentos = useMemo(() => {
    if (!showInv) return 0;
    return assets.reduce((sum, a) => sum + toInvBrl(a), 0);
  }, [assets, usdRate, showInv, toInvBrl]);

  const totalVeiculos = showMot
    ? vehicles.filter((v) => v.status === "active").reduce((s, v) => s + v.purchase_price, 0)
    : 0;

  const totalBens = showBens
    ? personalAssets.reduce((s, a) => s + (a.current_value ?? a.purchase_value), 0)
    : 0;

  const totalGeral = totalInvestimentos + totalVeiculos + totalBens;
  const isLoading = loadingAssets || loadingVehicles || loadingPersonal;

  const lines = [
    showInv && { label: "Investimentos",     value: totalInvestimentos, color: "bg-primary"   },
    showMot && { label: "Veículos em estoque", value: totalVeiculos,    color: "bg-amber-500" },
    showBens && { label: "Bens pessoais",     value: totalBens,          color: "bg-pink-500"  },
  ].filter((l): l is { label: string; value: number; color: string } => !!l && l.value > 0);

  return (
    <WidgetCard title="Patrimônio Total" isLoading={isLoading}>
      <div>
        <p className="text-xs text-muted-foreground">Total consolidado</p>
        <p className="text-xl font-bold tabular-nums text-foreground">
          {hideValues ? HIDDEN_VALUE : formatCurrency(totalGeral)}
        </p>
      </div>

      {lines.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum patrimônio cadastrado.</p>
      ) : (
        <>
          <Divider />
          <div className="space-y-2">
            {lines.map((l) => {
              const pct = totalGeral > 0 ? (l.value / totalGeral) * 100 : 0;
              return (
                <div key={l.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-muted-foreground">{l.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums text-foreground">
                        {hideValues ? HIDDEN_VALUE : formatCurrency(l.value)}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground w-8 text-right">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${l.color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </WidgetCard>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function OverviewWidgets({ hideValues }: { hideValues: boolean }) {
  const { isVisible } = useNavStore();
  const showInv = isVisible("investimentos");
  const showMot = isVisible("motos");
  const showBens = isVisible("bens");
  const showPatrimonio = showInv || showMot || showBens;

  if (!showInv && !showMot && !showBens) return null;

  const cardCount = [showInv, showMot, showBens].filter(Boolean).length + 1;
  const gridCols = GRID_COLS[cardCount] ?? GRID_COLS[4];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Visão Geral
      </p>
      <div className={`grid gap-4 ${gridCols}`}>
        {showInv  && <InvestimentosWidget hideValues={hideValues} />}
        {showMot  && <VeiculosWidget      hideValues={hideValues} />}
        {showBens && <BensWidget          hideValues={hideValues} />}
        {showPatrimonio && <PatrimonioWidget hideValues={hideValues} />}
      </div>
    </div>
  );
}
