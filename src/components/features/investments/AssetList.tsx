import { ConfirmDialog } from "@/components/features/ConfirmDialog";
import type { AssetCategory, InvestmentAsset } from "@/domain";
import { useBrapiCryptoQuotes, useBrapiQuotes } from "@/hooks/useBrapiQuotes";
import { useRemoveAsset } from "@/hooks/useInvestments";
import { useSelicRate } from "@/hooks/useSelicRate";
import { formatCurrency } from "@/lib/dateUtils";
import { calcularPrecoTeto, classificarPrecoTeto } from "@/lib/precoTetoUtils";
import type { BrapiFundamentals } from "@/services/brapi";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ChevronDownIcon,
  DotsHorizontalIcon,
  Pencil1Icon,
  PlusIcon,
  QuestionMarkCircledIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import * as Tooltip from "@radix-ui/react-tooltip";
import { clsx } from "clsx";
import { useState } from "react";
import { AssetDialog } from "./AssetDialog";

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

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

const HIDDEN_VALUE = "••••••";

interface Props {
  assets: InvestmentAsset[];
  isLoading: boolean;
  usdRate?: number;
  hideValues?: boolean;
  refreshing?: boolean;
  fundamentalsMap?: Map<string, BrapiFundamentals>;
}

const BRAPI_STOCK_CATEGORIES: AssetCategory[] = [
  "acoes",
  "fiis",
  "internacional",
];
const BRAPI_CATEGORIES: AssetCategory[] = [
  "acoes",
  "fiis",
  "internacional",
  "cripto",
];

export function AssetList({
  assets,
  isLoading,
  usdRate,
  hideValues = false,
  refreshing = false,
  fundamentalsMap,
}: Props) {
  const [editAsset, setEditAsset] = useState<InvestmentAsset | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<InvestmentAsset | null>(
    null,
  );
  const [addCategory, setAddCategory] = useState<AssetCategory | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<AssetCategory>
  >(
    new Set([
      "acoes",
      "fiis",
      "cripto",
      "internacional",
      "renda_fixa",
      "reserva_oportunidade",
    ] as AssetCategory[]),
  );
  const remove = useRemoveAsset();
  const { data: selicData } = useSelicRate();

  const stockTickers = assets
    .filter((a) => BRAPI_STOCK_CATEGORIES.includes(a.category))
    .map((a) => a.name.toUpperCase().trim());

  const cryptoTickers = assets
    .filter((a) => a.category === "cripto")
    .map((a) => a.name.toUpperCase().trim());

  const {
    data: quotes = [],
    isFetching: stockLoading,
    isError: stockError,
  } = useBrapiQuotes(stockTickers);
  const {
    data: cryptoQuotes = [],
    isFetching: cryptoLoading,
    isError: cryptoError,
  } = useBrapiCryptoQuotes(cryptoTickers);

  const quotesLoading = stockLoading || cryptoLoading;
  const quotesError = stockError && cryptoError;
  const quoteMap = new Map([
    ...quotes.map((q) => [q.symbol.toUpperCase(), q] as const),
    ...cryptoQuotes.map((q) => [q.symbol.toUpperCase(), q] as const),
  ]);

  function toggleCategory(key: AssetCategory) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toBrl(asset: InvestmentAsset): number {
    const quote = quoteMap.get(asset.name.toUpperCase().trim());
    const amount =
      quote != null && asset.quantity != null
        ? asset.quantity * quote.regularMarketPrice
        : asset.amount;
    if (asset.currency === "USD" && usdRate) return amount * usdRate;
    return amount;
  }

  const assetsByCategory = CATEGORIES.map((cat) => {
    const catAssets = assets.filter((a) => a.category === cat.key);
    const usdAssets = catAssets.filter((a) => a.currency === "USD");
    const usdTotal =
      usdAssets.length > 0
        ? usdAssets.reduce((s, a) => {
            const q = quoteMap.get(a.name.toUpperCase().trim());
            return (
              s +
              (q != null && a.quantity != null
                ? a.quantity * q.regularMarketPrice
                : a.amount)
            );
          }, 0)
        : null;
    return {
      ...cat,
      assets: catAssets.slice().sort((a, b) => toBrl(b) - toBrl(a)),
      total: catAssets.reduce((s, a) => s + toBrl(a), 0),
      usdTotal,
    };
  });

  const categoriesWithAssets = assetsByCategory
    .filter((c) => c.assets.length > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Carteira Atual
        </p>
        {quotesError && (
          <span className="text-xs text-red-500">Erro ao buscar cotações</span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg border border-border bg-card animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && assets.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Nenhum ativo cadastrado ainda.
        </div>
      )}

      {!isLoading && (
        <div className="space-y-3">
          {categoriesWithAssets.map((cat) => {
            const isCollapsed = collapsedCategories.has(cat.key);
            return (
              <div
                key={cat.key}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Category header — clicável para colapsar */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.key)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {cat.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {cat.usdTotal != null &&
                      (refreshing ? (
                        <div className="h-3.5 w-14 animate-pulse rounded bg-muted" />
                      ) : (
                        <span className="text-xs font-medium tabular-nums text-muted-foreground">
                          {hideValues ? HIDDEN_VALUE : formatUsd(cat.usdTotal)}
                        </span>
                      ))}
                    {refreshing ? (
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    ) : (
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {hideValues ? HIDDEN_VALUE : formatCurrency(cat.total)}
                      </span>
                    )}
                    <ChevronDownIcon
                      className={clsx(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                        isCollapsed && "-rotate-90",
                      )}
                    />
                  </div>
                </button>

                {/* Individual assets */}
                {!isCollapsed && (
                  <>
                    <div className="divide-y divide-border">
                      {cat.assets.map((asset) => {
                        const isUsd = asset.currency === "USD";
                        const quote = BRAPI_CATEGORIES.includes(asset.category)
                          ? quoteMap.get(asset.name.toUpperCase().trim())
                          : undefined;
                        const liveAmount =
                          quote && asset.quantity != null
                            ? asset.quantity * quote.regularMarketPrice
                            : null;
                        const displayAmount = liveAmount ?? asset.amount;
                        const brlValue =
                          isUsd && usdRate
                            ? displayAmount * usdRate
                            : displayAmount;
                        const gainPct =
                          asset.quantity != null && asset.avg_price != null
                            ? (() => {
                                const cost = asset.quantity * asset.avg_price;
                                const livePrice = quote?.regularMarketPrice;
                                const current =
                                  livePrice != null
                                    ? asset.quantity * livePrice
                                    : isUsd
                                      ? asset.amount
                                      : brlValue;
                                return cost > 0
                                  ? ((current - cost) / cost) * 100
                                  : null;
                              })()
                            : null;

                        const fundamentals = fundamentalsMap?.get(
                          asset.name.toUpperCase().trim(),
                        );
                        const precoAtual = quote?.regularMarketPrice ?? null;
                        const dividendoDyManual =
                          asset.dy_manual != null && precoAtual != null
                            ? precoAtual * (asset.dy_manual / 100)
                            : null;
                        const dividendoAnual =
                          fundamentals?.dividendoAnual ??
                          asset.dividendo_anual ??
                          dividendoDyManual;
                        const lpa = fundamentals?.lpa ?? asset.lpa;
                        const vpa = fundamentals?.vpa ?? asset.vpa;
                        const precoTeto = calcularPrecoTeto(
                          asset.category,
                          dividendoAnual,
                          lpa,
                          vpa,
                        );

                        return (
                          <div
                            key={asset.id}
                            className="flex items-center gap-3 px-4 py-3"
                          >
                            {/* Left: name + details */}
                            <div className="min-w-0 flex-1">
                              {/* Row 1: ticker + badges */}
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">
                                  {asset.name}
                                </p>
                                {isUsd && (
                                  <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-500">
                                    USD
                                  </span>
                                )}
                                {gainPct != null && (
                                  <span
                                    className={clsx(
                                      "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                                      gainPct >= 0
                                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                        : "bg-red-500/10 text-red-500 dark:text-red-400",
                                    )}
                                  >
                                    {gainPct >= 0 ? "+" : ""}
                                    {gainPct.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                              {/* Row 2: qty · PM · cotação do dia */}
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                {asset.quantity != null && (
                                  <span className="text-xs text-muted-foreground tabular-nums">
                                    {asset.quantity % 1 === 0
                                      ? asset.quantity.toFixed(0)
                                      : asset.quantity < 0.01
                                        ? asset.quantity.toFixed(4)
                                        : asset.quantity.toFixed(2)}{" "}
                                    unid.
                                  </span>
                                )}
                                {asset.avg_price != null && (
                                  <span className="text-xs text-muted-foreground tabular-nums">
                                    PM{" "}
                                    {isUsd
                                      ? formatUsd(asset.avg_price)
                                      : formatCurrency(asset.avg_price)}
                                  </span>
                                )}
                                {BRAPI_CATEGORIES.includes(asset.category) &&
                                  (quotesLoading ? (
                                    <span className="h-3 w-20 animate-pulse rounded bg-muted inline-block" />
                                  ) : quote ? (
                                    <span
                                      className={clsx(
                                        "text-xs tabular-nums",
                                        quote.regularMarketChangePercent >= 0
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-red-500 dark:text-red-400",
                                      )}
                                    >
                                      {isUsd
                                        ? formatUsd(quote.regularMarketPrice)
                                        : formatCurrency(
                                            quote.regularMarketPrice,
                                          )}{" "}
                                      <span className="text-[11px]">
                                        (
                                        {quote.regularMarketChangePercent >= 0
                                          ? "+"
                                          : ""}
                                        {quote.regularMarketChangePercent.toFixed(
                                          2,
                                        )}
                                        % hoje)
                                      </span>
                                    </span>
                                  ) : (
                                    !quotesError && (
                                      <span className="text-xs text-muted-foreground/40">
                                        sem cotação
                                      </span>
                                    )
                                  ))}
                                {asset.notes && (
                                  <span className="text-xs text-muted-foreground/60 truncate">
                                    {asset.notes}
                                  </span>
                                )}
                              </div>
                              {/* Row 3: preço teto */}
                              {precoTeto &&
                                (precoTeto.bazin != null ||
                                  precoTeto.graham != null) && (
                                  <Tooltip.Provider delayDuration={200}>
                                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                                      {precoTeto.bazin != null &&
                                        (() => {
                                          const b = quote
                                            ? classificarPrecoTeto(
                                                quote.regularMarketPrice,
                                                precoTeto.bazin!,
                                              )
                                            : null;
                                          return (
                                            <Tooltip.Root>
                                              <Tooltip.Trigger asChild>
                                                <div className="inline-flex items-center gap-1.5 cursor-default">
                                                  <span className="text-[11px] text-muted-foreground">
                                                    Preço teto Bazin:
                                                  </span>
                                                  <QuestionMarkCircledIcon className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                                                  <span className="text-[11px] font-semibold tabular-nums text-foreground">
                                                    {formatCurrency(
                                                      precoTeto.bazin!,
                                                    )}
                                                  </span>
                                                  {b && (
                                                    <span
                                                      className={clsx(
                                                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                                        b === "comprar" &&
                                                          "bg-green-500/10 text-green-600 dark:text-green-400",
                                                        b === "neutro" &&
                                                          "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                                                        b === "caro" &&
                                                          "bg-red-500/10 text-red-500 dark:text-red-400",
                                                      )}
                                                    >
                                                      {b === "comprar"
                                                        ? "Comprar"
                                                        : b === "neutro"
                                                          ? "Neutro"
                                                          : "Caro"}
                                                    </span>
                                                  )}
                                                </div>
                                              </Tooltip.Trigger>
                                              <Tooltip.Portal>
                                                <Tooltip.Content
                                                  side="bottom"
                                                  sideOffset={4}
                                                  className="z-50 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg animate-in fade-in-0 zoom-in-95"
                                                >
                                                  <p className="font-semibold text-foreground mb-1">Preço Teto — Bazin</p>
                                                  <p className="text-muted-foreground mb-1.5">Focado em <span className="text-foreground font-medium">renda</span>. Indica o preço máximo a pagar para que os dividendos gerem pelo menos 6% a.a. (ações) ou 9% a.a. (FIIs). Ideal para quem investe buscando fluxo de caixa passivo.</p>
                                                  <p className="text-muted-foreground mb-0.5 text-[11px]">Fórmula: Dividendo anual ÷ DY alvo</p>
                                                  <p className="text-muted-foreground/60 text-[10px]">Ex: dividendo R$ 3,00/ação ÷ 6% = teto R$ 50,00</p>
                                                  <Tooltip.Arrow className="fill-border" />
                                                </Tooltip.Content>
                                              </Tooltip.Portal>
                                            </Tooltip.Root>
                                          );
                                        })()}
                                      {precoTeto.graham != null &&
                                        (() => {
                                          const g = quote
                                            ? classificarPrecoTeto(
                                                quote.regularMarketPrice,
                                                precoTeto.graham!,
                                              )
                                            : null;
                                          return (
                                            <Tooltip.Root>
                                              <Tooltip.Trigger asChild>
                                                <div className="inline-flex items-center gap-1.5 cursor-default">
                                                  <span className="text-[11px] text-muted-foreground">
                                                    Preço Justo Graham:
                                                  </span>
                                                  <QuestionMarkCircledIcon className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                                                  <span className="text-[11px] font-semibold tabular-nums text-foreground">
                                                    {formatCurrency(
                                                      precoTeto.graham!,
                                                    )}
                                                  </span>
                                                  {g && (
                                                    <span
                                                      className={clsx(
                                                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                                        g === "comprar" &&
                                                          "bg-green-500/10 text-green-600 dark:text-green-400",
                                                        g === "neutro" &&
                                                          "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                                                        g === "caro" &&
                                                          "bg-red-500/10 text-red-500 dark:text-red-400",
                                                      )}
                                                    >
                                                      {g === "comprar"
                                                        ? "Comprar"
                                                        : g === "neutro"
                                                          ? "Neutro"
                                                          : "Caro"}
                                                    </span>
                                                  )}
                                                </div>
                                              </Tooltip.Trigger>
                                              <Tooltip.Portal>
                                                <Tooltip.Content
                                                  side="bottom"
                                                  sideOffset={4}
                                                  className="z-50 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg animate-in fade-in-0 zoom-in-95"
                                                >
                                                  <p className="font-semibold text-foreground mb-1">Preço Justo — Graham</p>
                                                  <p className="text-muted-foreground mb-1.5">Focado em <span className="text-foreground font-medium">valor</span>. Estima o preço justo com base no lucro e patrimônio da empresa. Comprar abaixo desse valor significa pagar menos do que a empresa vale — margem de segurança para valorização.</p>
                                                  <p className="text-muted-foreground mb-0.5 text-[11px]">Fórmula: √(22,5 × LPA × VPA)</p>
                                                  <p className="text-muted-foreground/60 text-[10px]">Ex: LPA R$ 4,00 · VPA R$ 20,00 → √(22,5 × 4 × 20) = R$ 42,43
                                                  </p>
                                                  <Tooltip.Arrow className="fill-border" />
                                                </Tooltip.Content>
                                              </Tooltip.Portal>
                                            </Tooltip.Root>
                                          );
                                        })()}
                                    </div>
                                  </Tooltip.Provider>
                                )}
                            </div>

                            {/* Right: total value */}
                            <div className="flex-shrink-0 text-right">
                              {hideValues ? (
                                <p className="text-sm font-semibold tabular-nums text-foreground">
                                  {HIDDEN_VALUE}
                                </p>
                              ) : refreshing ||
                                (BRAPI_CATEGORIES.includes(asset.category) &&
                                  quotesLoading) ? (
                                <>
                                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                                  {isUsd && (
                                    <div className="mt-1 h-3 w-12 animate-pulse rounded bg-muted ml-auto" />
                                  )}
                                </>
                              ) : isUsd ? (
                                <>
                                  <p className="text-sm font-semibold tabular-nums text-foreground">
                                    {formatUsd(displayAmount)}
                                  </p>
                                  {usdRate ? (
                                    <p className="text-xs tabular-nums text-muted-foreground">
                                      ≈ {formatCurrency(brlValue)}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-muted-foreground/60">
                                      carregando...
                                    </p>
                                  )}
                                </>
                              ) : (
                                <p className="text-sm font-semibold tabular-nums text-foreground">
                                  {formatCurrency(displayAmount)}
                                </p>
                              )}
                            </div>
                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <button
                                  type="button"
                                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                  aria-label="Opções"
                                >
                                  <DotsHorizontalIcon className="h-4 w-4" />
                                </button>
                              </DropdownMenu.Trigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                  align="end"
                                  sideOffset={4}
                                  className="z-50 min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
                                >
                                  <DropdownMenu.Item
                                    onSelect={() => setEditAsset(asset)}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-muted focus:bg-muted"
                                  >
                                    <Pencil1Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                    Editar
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Separator className="my-1 h-px bg-border" />
                                  <DropdownMenu.Item
                                    onSelect={() => setConfirmDelete(asset)}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 outline-none hover:bg-red-500/10 focus:bg-red-500/10"
                                  >
                                    <TrashIcon className="h-3.5 w-3.5" />
                                    Excluir
                                  </DropdownMenu.Item>
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          </div>
                        );
                      })}
                    </div>

                    {/* Selic info — renda_fixa only */}
                    {cat.key === "renda_fixa" && selicData && (
                      <div className="border-t border-border px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 bg-muted/20">
                        <span className="text-xs text-muted-foreground">
                          Selic{" "}
                          <span className="font-semibold text-foreground">
                            {selicData.annual.toFixed(2)}% a.a.
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {selicData.monthly.toFixed(3)}% a.m.
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Rendimento estimado:{" "}
                          <span className="font-semibold text-green-600 dark:text-green-400">
                            {hideValues
                              ? HIDDEN_VALUE
                              : `${formatCurrency((cat.total * selicData.monthly) / 100)}/mês`}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* Add asset button for this category */}
                    <div className="border-t border-border px-4 py-2">
                      <button
                        type="button"
                        onClick={() => setAddCategory(cat.key)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Adicionar ativo
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {/* Add buttons for categories with no assets yet */}
          <div className="flex flex-wrap gap-2 pt-1">
            {assetsByCategory
              .filter((c) => c.assets.length === 0)
              .map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setAddCategory(cat.key)}
                  className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                >
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <PlusIcon className="h-3 w-3" />
                  {cat.label}
                </button>
              ))}
          </div>
        </div>
      )}

      {editAsset && (
        <AssetDialog
          open={!!editAsset}
          onOpenChange={(o) => {
            if (!o) setEditAsset(null);
          }}
          asset={editAsset}
        />
      )}

      {addCategory && (
        <AssetDialog
          open={!!addCategory}
          onOpenChange={(o) => {
            if (!o) setAddCategory(null);
          }}
          defaultCategory={addCategory}
        />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(o) => {
          if (!o) setConfirmDelete(null);
        }}
        title="Excluir ativo"
        description={`O ativo "${confirmDelete?.name ?? ""}" será excluído permanentemente.`}
        confirmLabel="Excluir"
        onConfirm={() => {
          if (confirmDelete)
            remove.mutate(confirmDelete.id, {
              onSuccess: () => setConfirmDelete(null),
            });
        }}
        loading={remove.isPending}
      />
    </div>
  );
}
