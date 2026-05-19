import type { MenuMarginResult, PriceChangeRiskResult } from "../model/calculateMultiMenuMargin";
import { formatInputValue, parseNumberInput, parseSignedNumberInput } from "../model/calculatorInputFormatters";
import { formatNumber, formatPercent, formatWon } from "../model/formatters";
import { getMenuHealth } from "../model/menuHealth";

export function PriceRiskPanel({
  menus,
  selectedMenuId,
  onSelectMenu,
  priceDelta,
  onChangePriceDelta,
  volumeChangeRate,
  onChangeVolumeChangeRate,
  risk,
}: {
  menus: MenuMarginResult[];
  selectedMenuId: string;
  onSelectMenu: (menuId: string) => void;
  priceDelta: number;
  onChangePriceDelta: (value: number) => void;
  volumeChangeRate: number;
  onChangeVolumeChangeRate: (value: number) => void;
  risk: PriceChangeRiskResult | null;
}) {
  const selectedMenu = menus.find((menu) => menu.id === selectedMenuId) ?? menus[0];
  const scenarioButtons = [-15, -5, 0, 5];

  if (!selectedMenu || !risk) {
    return null;
  }

  return (
    <div id="price-risk-panel" className="scroll-mt-4 rounded-3xl border border-[#c7d3e3] bg-[linear-gradient(180deg,#ffffff_0%,#f3f7fb_100%)] p-6 shadow-[rgba(11,37,69,0.18)_0px_28px_56px_-34px] transition-all duration-500 ease-out">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#0b2545]">가격 바꿔보기</p>
          <h3 className="mt-2 text-[22px] font-light leading-tight tracking-[-0.03em] text-[#061b31] sm:text-2xl">몇 잔까지 줄어도 괜찮을까요?</h3>
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-bold ${risk.verdict === "risk" ? "bg-rose-100 text-rose-700" : risk.verdict === "watch" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
          {risk.verdict === "risk" ? "먼저 점검" : risk.verdict === "watch" ? "마진율 주의" : "확인"}
        </span>
      </div>

      <label className="mt-5 block text-sm font-bold text-[#273951]" htmlFor="risk-menu">
        검토할 메뉴
      </label>
      <select
        id="risk-menu"
        value={selectedMenu.id}
        onChange={(event) => onSelectMenu(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-xl border border-[#d8e3ee] bg-white px-4 text-base font-semibold text-[#061b31] outline-none transition focus:border-[#0b2545]"
      >
        {menus.map((menu) => (
          <option key={menu.id} value={menu.id}>
            {menu.menuName || "이름 없는 메뉴"}
          </option>
        ))}
      </select>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="rounded-2xl border border-[#d8e3ee] bg-white p-4 transition focus-within:border-[#0b2545]">
          <span className="flex items-center justify-between text-sm font-bold text-[#273951]">
            가격을 얼마나 바꿀까요 <span className="text-xs text-[#64748d]">원</span>
          </span>
          <input
            value={formatInputValue(priceDelta)}
            onChange={(event) => onChangePriceDelta(parseNumberInput(event.target.value))}
            type="text"
            inputMode="numeric"
            className="mt-3 w-full bg-transparent text-xl font-semibold tracking-[-0.03em] text-[#061b31] outline-none"
          />
          <span className="mt-2 block text-xs leading-5 text-[#64748d]">예: 300, 500, 1000</span>
        </label>
        <label className="rounded-2xl border border-[#d8e3ee] bg-white p-4 transition focus-within:border-[#0b2545]">
          <span className="flex items-center justify-between text-sm font-bold text-[#273951]">
            판매량은 얼마나 변할까요 <span className="text-xs text-[#64748d]">%</span>
          </span>
          <input
            value={String(volumeChangeRate)}
            onChange={(event) => onChangeVolumeChangeRate(parseSignedNumberInput(event.target.value))}
            type="text"
            inputMode="numeric"
            className="mt-3 w-full bg-transparent text-xl font-semibold tracking-[-0.03em] text-[#061b31] outline-none"
          />
          <span className="mt-2 block text-xs leading-5 text-[#64748d]">줄어들면 -10처럼 입력</span>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {scenarioButtons.map((rate) => (
          <button
            key={rate}
            type="button"
            onClick={() => onChangeVolumeChangeRate(rate)}
            className={`rounded-full px-3 py-1.5 text-xs font-black transition hover:-translate-y-0.5 ${volumeChangeRate === rate ? "bg-[#0b2545] text-white shadow-[rgba(11,37,69,0.28)_0px_12px_22px_-14px]" : "bg-white text-[#0b2545] ring-1 ring-[#c7d3e3]"}`}
          >
            {rate > 0 ? `+${rate}%` : `${rate}%`}
          </button>
        ))}
      </div>

      {priceDelta === 0 ? (
        <div className="mt-5 rounded-2xl border border-[#c7d3e3] bg-white p-4 text-sm font-bold leading-6 text-[#0b2545]">
          가격 변경 없음. 가격을 조정하면 판매량 감소 허용치를 계산합니다.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <PanelMetric label="새 판매가" value={formatWon(risk.newSalePrice)} />
          <PanelMetric label="가정 판매량" value={`${formatNumber(risk.assumedMonthlyCups)}잔`} />
          <PanelMetric label="예상 월 이익" value={formatWon(risk.projectedMonthlyProfit)} emphasis />
          <PanelMetric label="기존 대비" value={`${risk.profitDelta >= 0 ? "+" : ""}${formatWon(risk.profitDelta)}`} emphasis={risk.profitDelta >= 0} />
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-[#c7d3e3] bg-white p-4">
        <p className="text-sm font-black text-[#061b31]">
          {priceDelta === 0
            ? "가격 변경 없음"
            : risk.allowedDropCups !== null && risk.allowedDropRate !== null
              ? `현재 가정에서는 ${formatWon(priceDelta)} 인상 검토 가능. 판매량이 ${formatNumber(Math.max(0, risk.allowedDropCups))}잔, 약 ${formatPercent(Math.max(0, risk.allowedDropRate))} 이상 줄면 인상 효과가 사라집니다.`
              : "새 가격에서도 잔당 이익이 남지 않아 가격보다 원가 구조를 먼저 봐야 합니다."}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#64748d]">{risk.summary}</p>
      </div>
      <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-900">
        {risk.warning}
      </p>
      <p className="mt-4 text-xs font-bold leading-5 text-[#64748d]">
        가격을 바꾼 뒤에는 다음 달 실제 판매량과 함께 다시 보세요. 저장·공유와 CSV는 계산기 상단 또는 하단 카드에서 사용할 수 있습니다.
      </p>
    </div>
  );
}

export function MenuBreakdownPanel({
  menus,
  onSelectMenu,
  hasCalculatorInput,
}: {
  menus: MenuMarginResult[];
  onSelectMenu: (menuId: string) => void;
  hasCalculatorInput: boolean;
}) {
  const priorityMenus = getPriorityMenus(menus);

  return (
    <div className="rounded-[28px] border border-[#e5edf5] bg-white p-4 shadow-[rgba(23,23,23,0.06)_0px_18px_44px_-28px] sm:p-6">
      <h3 className="text-2xl font-light tracking-[-0.03em] text-[#061b31]">메뉴별 손익</h3>
      {hasCalculatorInput ? (
        <div className="mt-4 rounded-2xl border border-[#c7d3e3] bg-[#f8fbff] p-4">
          <p className="text-sm font-black text-[#0b2545]">돈 새는 메뉴 TOP 3</p>
          <div className="mt-3 space-y-2">
            {priorityMenus.map((menu, index) => {
              const health = getMenuHealth(menu.marginRate, menu.profitPerCup);
              return (
                <button key={menu.id} type="button" onClick={() => onSelectMenu(menu.id)} className="w-full rounded-xl bg-white px-3 py-2 text-left text-sm font-bold text-[#273951] ring-1 ring-[#d8e3ee] hover:bg-[#eef5fb]">
                  <span className="block">{index + 1}위 {menu.menuName || "이름 없는 메뉴"} · {getPriorityReason(menu)}</span>
                  <span className="mt-0.5 block text-xs text-[#64748d]">남는 비율 {formatPercent(menu.marginRate)}, {health.action}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
      <p className="mt-3 text-xs font-bold leading-5 text-[#64748d]">태그 기준은 기본값입니다. 메뉴군과 매장 상황에 따라 조정할 수 있습니다.</p>
      <div className="mt-4 space-y-3">
        {!hasCalculatorInput ? (
          <div className="rounded-2xl border border-dashed border-[#c7d3e3] bg-[#f8fbff] p-4 text-sm font-semibold leading-6 text-[#64748d]">
            메뉴 정보를 입력하면 잔당 이익과 월 이익이 여기에 표시됩니다.
          </div>
        ) : null}
        {hasCalculatorInput ? menus.map((menu) => {
          const health = getMenuHealth(menu.marginRate, menu.profitPerCup);
          return (
            <div key={menu.id} className="cm-card-muted rounded-2xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-[#061b31]">{menu.menuName || "이름 없는 메뉴"}</p>
                  <p className="mt-1 text-xs text-[#64748d]">{formatNumber(menu.expectedMonthlyCups)}개 · 월 운영비 배분 {formatWon(menu.fixedCostShare)} 반영</p>
                </div>
                <span className={`rounded-md px-2 py-1 text-xs font-bold ${health.className}`}>
                  {health.label}
                </span>
              </div>
              <p className="mt-3 text-2xl font-light tracking-[-0.03em] text-[#061b31]">{formatWon(menu.profitPerCup)} / 잔</p>
              <p className="text-sm leading-6 text-[#64748d]">월 {formatWon(menu.monthlyProfit)} · 남는 비율 {formatPercent(menu.marginRate)} · {health.description}</p>
              <button
                type="button"
                onClick={() => onSelectMenu(menu.id)}
                className="mt-3 w-full rounded-xl border border-[#c7d3e3] bg-white px-3 py-2 text-sm font-black text-[#0b2545] transition hover:-translate-y-0.5 hover:bg-[#f3f7fb]"
              >
                이 메뉴 500원 올리면?
              </button>
            </div>
          );
        }) : null}
      </div>
    </div>
  );
}

function getPriorityReason(menu: MenuMarginResult) {
  if (menu.profitPerCup <= 0) return "팔수록 손실";
  if (menu.marginRate < 50 && menu.expectedMonthlyCups >= 300) return "많이 팔리는데 마진 얕음";
  if (menu.marginRate < 50) return "마진 낮음";
  if (menu.monthlyProfit < 20000) return "월 이익 낮음";
  return "먼저 점검 후보";
}

function getPriorityMenus(menus: MenuMarginResult[]) {
  return [...menus]
    .sort((a, b) => {
      const aScore = Math.max(0, 65 - a.marginRate) * Math.log10(Math.max(10, a.expectedMonthlyCups)) + Math.max(0, 20000 - a.monthlyProfit) / 10000;
      const bScore = Math.max(0, 65 - b.marginRate) * Math.log10(Math.max(10, b.expectedMonthlyCups)) + Math.max(0, 20000 - b.monthlyProfit) / 10000;
      return bScore - aScore;
    })
    .slice(0, 3);
}

function PanelMetric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${emphasis ? "bg-[#f0f0ff]" : "bg-[#f8fbff]"}`}>
      <p className="text-xs font-bold text-[var(--cm-muted)]">{label}</p>
      <p className="mt-2 text-xl font-light tracking-[-0.03em] text-[#061b31]">{value}</p>
    </div>
  );
}
