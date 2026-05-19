import { calculatorTrustCopy } from "../model/copy";
import type { MultiMenuMarginInput } from "../model/calculateMultiMenuMargin";
import { formatPercent, formatWon } from "../model/formatters";

type MobileCalculatorView = "result" | "adjust" | "details";

type SavedMultiMenuState = {
  id: string;
  name: string;
  input: MultiMenuMarginInput;
  savedAt: string;
};

export function SaveCalculatorCard({
  onSave,
  onExportCsv,
  message,
  recentStates = [],
  onLoadState,
}: {
  onSave?: () => void;
  onExportCsv?: () => void;
  message?: string;
  recentStates?: SavedMultiMenuState[];
  onLoadState?: (state: SavedMultiMenuState) => void;
}) {
  return (
    <div className="cm-card-muted rounded-2xl p-4">
      <p className="text-sm font-semibold text-[#0b2545]">{onExportCsv ? "저장 · CSV · 링크 공유" : "저장 · 링크 공유"}</p>
      <p className="mt-1 text-sm leading-6 text-[var(--cm-muted)]" role="status" aria-live="polite">{message}</p>
      <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-bold leading-5 text-[#0b2545] ring-1 ring-[#d8e3ee]">{calculatorTrustCopy.save}</p>
      <div className="mt-3 grid gap-2">
        <button type="button" onClick={onSave} className="cm-button-primary min-h-11 w-full rounded-lg px-4 py-3 text-sm font-semibold">
          저장하고 공유 링크 복사
        </button>
        {onExportCsv ? (
          <button type="button" onClick={onExportCsv} className="cm-button-secondary min-h-11 w-full rounded-lg px-4 py-3 text-sm font-semibold">
            CSV 다운로드
          </button>
        ) : null}
      </div>
      {recentStates.length > 0 && onLoadState ? (
        <div className="mt-4 border-t border-[#d8e3ee] pt-3">
          <p className="text-xs font-bold text-[var(--cm-muted)]">최근 저장 계산</p>
          <div className="mt-2 space-y-2">
            {recentStates.map((state) => (
              <button
                key={state.id}
                type="button"
                onClick={() => onLoadState(state)}
                className="min-h-11 w-full rounded-xl bg-white px-3 py-2 text-left text-xs font-bold text-[#273951] ring-1 ring-[#d8e3ee] hover:bg-[#f8fbff]"
              >
                <span className="block truncate">{state.name}</span>
                <span className="mt-0.5 block text-[var(--cm-muted)]">{formatSavedAt(state.savedAt)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function MobileStickyResultBar({
  profit,
  marginRate,
  currentView,
  onChangeView,
  ctaLabel,
  ctaAriaLabel,
  onCtaClick,
  ctaDisabled = false,
}: {
  profit: number;
  marginRate: number;
  currentView: MobileCalculatorView;
  onChangeView?: (view: MobileCalculatorView) => void;
  ctaLabel?: string;
  ctaAriaLabel?: string;
  onCtaClick?: () => void;
  ctaDisabled?: boolean;
}) {
  const fallbackLabel = currentView === "adjust" ? "결과 보기" : "입력 조정";
  const handleClick = onCtaClick ?? (() => onChangeView?.(currentView === "adjust" ? "result" : "adjust"));

  return (
    <div className="cm-mobile-bottom-sheet sticky bottom-3 z-40 mx-3 mt-6 rounded-2xl border border-[#c8d6e6] bg-white p-3 shadow-[rgba(15,23,42,0.24)_0px_18px_44px_-18px] sm:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
        <div className="rounded-xl bg-[#eef5fb] px-3 py-2">
          <p className="text-[11px] font-semibold text-[var(--cm-muted)]">한 잔 이익</p>
          <p className="mt-0.5 whitespace-nowrap text-base font-bold text-[#0b2545]">{formatWon(profit)}</p>
        </div>
        <div className="rounded-xl bg-[#f8fafc] px-3 py-2">
          <p className="text-[11px] font-semibold text-[var(--cm-muted)]">마진율</p>
          <p className="mt-0.5 whitespace-nowrap text-base font-bold text-[#061b31]">{formatPercent(marginRate)}</p>
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={ctaDisabled}
          aria-label={ctaAriaLabel}
          className="cm-button-primary h-full min-h-11 rounded-lg px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {ctaLabel ?? fallbackLabel}
        </button>
      </div>
    </div>
  );
}

function formatSavedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "저장 시간 확인 불가";
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
