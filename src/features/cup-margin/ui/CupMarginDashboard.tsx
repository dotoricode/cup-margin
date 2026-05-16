"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  calculateMultiMenuMargin,
  DEFAULT_MULTI_MENU_INPUT,
  type MenuMarginInput,
  type MultiMenuMarginInput,
} from "../model/calculateMultiMenuMargin";
import { formatNumber, formatPercent, formatWon } from "../model/formatters";

const baseInput = DEFAULT_MULTI_MENU_INPUT;

export function CupMarginDashboard() {
  const [navOpen, setNavOpen] = useState(false);
  const [input, setInput] = useState<MultiMenuMarginInput>(() => ({
    monthlyFixedCost: baseInput.monthlyFixedCost,
    menus: baseInput.menus.map((menu) => ({ ...menu })),
  }));
  const result = useMemo(() => calculateMultiMenuMargin(input), [input]);
  const topMenu = result.menus.slice().sort((a, b) => b.monthlyProfit - a.monthlyProfit)[0];

  function updateMenu(menuId: string, field: "salePrice" | "expectedMonthlyCups", value: number) {
    setInput((current) => ({
      ...current,
      menus: current.menus.map((menu) => (menu.id === menuId ? { ...menu, [field]: value } : menu)),
    }));
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#061b31]">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 lg:px-10">
        <nav className="rounded-2xl border border-[#e5edf5] bg-white/90 px-3 py-3 shadow-[rgba(50,50,93,0.12)_0px_16px_40px_-24px] backdrop-blur sm:px-4">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="컵마진 홈">
              <PictureLogo />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-black tracking-[-0.02em]">컵마진</p>
                <p className="hidden text-xs text-[#64748d] sm:block">가게 손익 보기</p>
              </div>
            </Link>
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/" className="rounded-lg border border-[#d8e2ee] bg-white px-3 py-2.5 text-sm font-bold text-[#0b2545]">랜딩</Link>
              <Link href="/calculator" className="rounded-lg bg-[#0b2545] px-3 py-2.5 text-sm font-bold text-white sm:px-4 shadow-[rgba(11,37,69,0.35)_0px_14px_28px_-14px]">계산</Link>
            </div>
            <button
              type="button"
              onClick={() => setNavOpen((current) => !current)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#d8e2ee] bg-white px-3 py-2 text-sm font-black text-[#0b2545] shadow-sm sm:hidden"
              aria-expanded={navOpen}
              aria-controls="dashboard-mobile-navigation"
            >
              메뉴 <span aria-hidden="true">{navOpen ? "닫기" : "열기"}</span>
            </button>
          </div>
          {navOpen ? (
            <div id="dashboard-mobile-navigation" className="mt-3 grid gap-2 rounded-2xl bg-[#f5f8fb] p-2 text-sm font-bold text-[#273951] sm:hidden">
              <Link href="/" className="rounded-xl bg-white px-4 py-3 shadow-sm" onClick={() => setNavOpen(false)}>랜딩으로 이동</Link>
              <Link href="/calculator" className="rounded-xl bg-white px-4 py-3 shadow-sm" onClick={() => setNavOpen(false)}>30초 계산기</Link>
              <a href="#scenario" className="rounded-xl bg-white px-4 py-3 shadow-sm" onClick={() => setNavOpen(false)}>언제 쓰나요</a>
            </div>
          ) : null}
        </nav>

        <section className="grid gap-5 py-5 sm:py-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <div className="space-y-5">
            <div className="rounded-[28px] bg-[#061b31] p-5 text-white sm:rounded-[32px] shadow-[rgba(3,3,39,0.22)_0px_36px_80px_-44px] sm:p-8">
              <p className="text-sm font-semibold text-white/60">계산 결과 예시</p>
              <h1 className="mt-3 text-[32px] font-semibold leading-tight tracking-[-0.055em] sm:text-6xl">
                이번 달<br />얼마 남을까요?
              </h1>
              <div className="mt-5 grid gap-2 sm:mt-8 sm:grid-cols-3">
                <DarkMetric label="월 예상 매출" value={formatWon(result.totalRevenue)} />
                <DarkMetric label="월 예상 이익" value={formatWon(result.totalProfit)} highlight />
                <DarkMetric label="매출 대비 이익률" value={formatPercent(result.blendedMarginRate)} />
              </div>
              <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-white/78">
                {topMenu ? `${topMenu.menuName}가 월 ${formatWon(topMenu.monthlyProfit)}으로 가장 많이 남습니다.` : "메뉴 판매량을 입력하면 결과가 표시됩니다."}
              </p>
            </div>

            <DashboardScenarioCard />
            <ProfitCurve menus={result.menus} />
            <MenuComparison menus={result.menus} />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-5">
            <div className="rounded-[28px] bg-white p-5 shadow-[rgba(0,0,0,0.12)_0px_18px_55px_-32px]">
              <p className="text-sm font-bold text-[#0b2545]">가격과 판매량을 조정해보세요</p>
              <p className="mt-2 text-sm leading-6 text-[#64748d]">음료·디저트·푸드 메뉴를 같이 봅니다. 움직이면 결과와 그래프가 바로 바뀝니다.</p>
              <div className="mt-5 space-y-5">
                {input.menus.map((menu) => (
                  <MenuSliderCard key={menu.id} menu={menu} onChange={updateMenu} />
                ))}
              </div>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-[rgba(0,0,0,0.1)_0px_18px_50px_-34px]">
              <p className="text-sm font-bold text-[#0b2545]">월 운영비</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.045em]">{formatWon(input.monthlyFixedCost)}</p>
              <input
                type="range"
                min={300000}
                max={2000000}
                step={50000}
                value={input.monthlyFixedCost}
                onChange={(event) => setInput((current) => ({ ...current, monthlyFixedCost: Number(event.target.value) }))}
                className="mt-5 w-full accent-[#0071e3]"
                aria-label="월 운영비 조정"
              />
              <div className="mt-2 flex justify-between text-xs font-semibold text-[#86868b]">
                <span>30만원</span>
                <span>200만원</span>
              </div>
              <p className="mt-4 rounded-2xl bg-[#f5f5f7] px-4 py-3 text-sm leading-6 text-[#64748d]">
                임대료·관리비처럼 매달 나가는 비용입니다. 지금 입력값 기준 메뉴 1개당 평균 {formatWon(result.fixedCostPerCup)}씩 반영됩니다.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function PictureLogo() {
  return (
    <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#0b2545] shadow-[rgba(11,37,69,0.35)_0px_10px_24px_-12px]" aria-hidden="true">
      <Image src="/brand/cup-margin-logo.png" alt="" width={40} height={40} className="h-full w-full object-cover" priority />
    </span>
  );
}

function DashboardScenarioCard() {
  return (
    <section id="scenario" className="rounded-[28px] bg-white p-5 shadow-[rgba(0,0,0,0.09)_0px_18px_50px_-34px]">
      <p className="text-sm font-bold text-[#0b2545]">언제 쓰나요?</p>
      <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#1d1d1f]">하루 장사 끝나고 다음 달 가격을 점검할 때</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#f5f5f7] p-3">
          <p className="text-sm font-black text-[#061b31]">가격 바꾸기 전</p>
          <p className="mt-1 text-[13px] leading-5 text-[#64748d]">아메리카노 가격을 100원씩 움직여 월 이익 변화를 봅니다.</p>
        </div>
        <div className="rounded-2xl bg-[#f5f5f7] p-3">
          <p className="text-sm font-black text-[#061b31]">판매량 바뀔 때</p>
          <p className="mt-1 text-[13px] leading-5 text-[#64748d]">행사, 날씨, 시즌 때문에 판매량이 달라질 때 다시 봅니다.</p>
        </div>
        <div className="rounded-2xl bg-[#f5f5f7] p-3">
          <p className="text-sm font-black text-[#061b31]">월세·인건비 오를 때</p>
          <p className="mt-1 text-[13px] leading-5 text-[#64748d]">월 운영비를 움직여 메뉴별 부담이 얼마나 늘어나는지 확인합니다.</p>
        </div>
      </div>
    </section>
  );
}

function MenuSliderCard({
  menu,
  onChange,
}: {
  menu: MenuMarginInput;
  onChange: (menuId: string, field: "salePrice" | "expectedMonthlyCups", value: number) => void;
}) {
  const priceMin = Math.max(1500, Math.floor(menu.salePrice * 0.65 / 100) * 100);
  const priceMax = Math.max(priceMin + 1000, Math.ceil(menu.salePrice * 1.45 / 100) * 100);
  const volumeMin = Math.max(40, Math.floor(menu.expectedMonthlyCups * 0.35 / 10) * 10);
  const volumeMax = Math.max(volumeMin + 100, Math.ceil(menu.expectedMonthlyCups * 1.65 / 10) * 10);

  return (
    <div className="rounded-3xl border border-[#e5edf5] bg-[#fbfcff] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold tracking-[-0.03em] text-[#1d1d1f]">{menu.menuName}</p>
          <p className="mt-1 text-xs font-semibold text-[#64748d]">판매가와 월 판매량만 먼저 조정</p>
        </div>
        <p className="rounded-full bg-white px-3 py-1 text-sm font-bold text-[#0b2545] shadow-sm">{formatWon(menu.salePrice)}</p>
      </div>
      <label className="mt-4 block text-sm font-bold text-[#273951]">
        판매가
        <input
          type="range"
          min={priceMin}
          max={priceMax}
          step={100}
          value={menu.salePrice}
          onChange={(event) => onChange(menu.id, "salePrice", Number(event.target.value))}
          className="mt-3 w-full accent-[#0071e3]"
        />
      </label>
      <div className="mt-1 flex justify-between text-xs font-semibold text-[#86868b]">
        <span>{formatWon(priceMin)}</span>
        <span>{formatWon(priceMax)}</span>
      </div>
      <label className="mt-4 block text-sm font-bold text-[#273951]">
        월 판매량: {formatNumber(menu.expectedMonthlyCups)}개
        <input
          type="range"
          min={volumeMin}
          max={volumeMax}
          step={10}
          value={menu.expectedMonthlyCups}
          onChange={(event) => onChange(menu.id, "expectedMonthlyCups", Number(event.target.value))}
          className="mt-3 w-full accent-[#0071e3]"
        />
      </label>
      <div className="mt-1 flex justify-between text-xs font-semibold text-[#86868b]">
        <span>{formatNumber(volumeMin)}개</span>
        <span>{formatNumber(volumeMax)}개</span>
      </div>
    </div>
  );
}

function ProfitCurve({ menus }: { menus: ReturnType<typeof calculateMultiMenuMargin>["menus"] }) {
  const width = 720;
  const height = 270;
  const padding = 34;
  const maxProfit = Math.max(1, ...menus.map((menu) => menu.monthlyProfit));
  const points = menus.map((menu, index) => {
    const x = padding + (index / Math.max(1, menus.length - 1)) * (width - padding * 2);
    const y = height - padding - (menu.monthlyProfit / maxProfit) * (height - padding * 2);
    return { x, y, menu };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const fillPath = `${path} L ${points.at(-1)?.x ?? padding} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div className="rounded-[32px] bg-white p-5 shadow-[rgba(0,0,0,0.1)_0px_18px_55px_-34px] sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#0b2545]">이익 그래프</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.045em] text-[#1d1d1f] sm:text-3xl">어떤 메뉴가 더 남는지 확인해보세요</h2>
        </div>
        <p className="text-sm font-semibold text-[#64748d]">곡선이 높을수록 월 이익이 큽니다</p>
      </div>
      <div className="mt-6 overflow-hidden rounded-3xl bg-[#f5f5f7] p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label="메뉴별 월 이익 곡선 그래프">
          <defs>
            <linearGradient id="profitFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0071e3" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#0071e3" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={fillPath} fill="url(#profitFill)" />
          <path d={path} fill="none" stroke="#0071e3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
          {points.map((point) => (
            <g key={point.menu.id}>
              <circle cx={point.x} cy={point.y} r="10" fill="#0b2545" />
              <text x={point.x} y={height - 10} textAnchor="middle" className="fill-[#64748d] text-[18px] font-bold">
                {point.menu.menuName}
              </text>
              <text x={point.x} y={Math.max(24, point.y - 18)} textAnchor="middle" className="fill-[#061b31] text-[20px] font-black">
                {formatWon(point.menu.monthlyProfit)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

function MenuComparison({ menus }: { menus: ReturnType<typeof calculateMultiMenuMargin>["menus"] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {menus.map((menu) => (
        <article key={menu.id} className="rounded-[28px] bg-white p-5 shadow-[rgba(0,0,0,0.09)_0px_18px_50px_-34px]">
          <p className="text-sm font-bold text-[#64748d]">{menu.menuName}</p>
          <p className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.045em] text-[#1d1d1f] sm:text-3xl">{formatWon(menu.profitPerCup)}</p>
          <p className="mt-1 text-sm font-semibold text-[#64748d]">하나 팔 때 남는 돈</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <LightMetric label="판매가" value={formatWon(menu.salePrice)} />
            <LightMetric label="하나당 원가" value={formatWon(menu.totalCostPerCup)} />
            <LightMetric label="월 판매량" value={`${formatNumber(menu.expectedMonthlyCups)}개`} />
            <LightMetric label="월 이익" value={formatWon(menu.monthlyProfit)} />
          </div>
        </article>
      ))}
    </div>
  );
}

function DarkMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 sm:p-4 ${highlight ? "bg-white text-[#061b31]" : "bg-white/10 text-white"}`}>
      <p className={`text-xs font-bold ${highlight ? "text-[#64748d]" : "text-white/60"}`}>{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-[-0.045em] sm:text-2xl">{value}</p>
    </div>
  );
}

function LightMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f5f5f7] p-4">
      <p className="text-xs font-bold text-[#86868b]">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-[-0.035em] text-[#1d1d1f]">{value}</p>
    </div>
  );
}
