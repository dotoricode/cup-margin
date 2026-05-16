"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  calculateMultiMenuMargin,
  calculatePriceChangeRisk,
  DEFAULT_MULTI_MENU_INPUT,
  type MenuMarginInput,
  type MultiMenuMarginInput,
  type MultiMenuMarginResult,
  type MenuMarginResult,
} from "../model/calculateMultiMenuMargin";
import { operatingPacks, pricingPlans } from "../model/copy";
import { formatNumber, formatPercent, formatWon } from "../model/formatters";
import {
  calculateProductCost,
  DEFAULT_RECIPE_PRICING_PRODUCTS,
  DEFAULT_TRADE_AREA,
  generatePriceSimulation,
  summarizeTradeArea,
  type ProductCostingResult,
  type PriceSimulationPoint,
  type TradeAreaSummary,
} from "../model/calculateRecipePricing";

const emptyMenu = (index: number): MenuMarginInput => ({
  id: `menu-${Date.now()}-${index}`,
  menuName: `새 메뉴 ${index}`,
  salePrice: 0,
  ingredientCost: 0,
  packagingCost: 0,
  platformFeeRate: 0,
  wasteRate: 0,
  laborCostPerCup: 0,
  extraCost: 0,
  expectedMonthlyCups: 0,
});

const emptyInput: MultiMenuMarginInput = {
  monthlyFixedCost: 0,
  menus: [emptyMenu(1)],
};

const menuFields: Array<{
  id: Exclude<keyof MenuMarginInput, "id" | "menuName">;
  label: string;
  suffix?: string;
  helper: string;
  compact?: boolean;
}> = [
  { id: "expectedMonthlyCups", label: "월 판매잔수", suffix: "잔", helper: "한 달 예상 판매량" },
  { id: "salePrice", label: "판매가", suffix: "원", helper: "고객 결제 가격" },
  { id: "ingredientCost", label: "원재료비", suffix: "원", helper: "원두·우유·시럽·토핑" },
  { id: "packagingCost", label: "컵/포장비", suffix: "원", helper: "컵·뚜껑·빨대·캐리어" },
  { id: "platformFeeRate", label: "배달앱 수수료", suffix: "%", helper: "매장 판매만 하면 0", compact: true },
  { id: "wasteRate", label: "버리는 양", suffix: "%", helper: "남거나 실패하는 양", compact: true },
  { id: "laborCostPerCup", label: "만드는 시간 비용", suffix: "원", helper: "대략값으로 시작" },
  { id: "extraCost", label: "기타 비용", suffix: "원", helper: "쿠폰·서비스 토핑" },
];

const proofItems = [
  { label: "계산 방식", value: "여러 메뉴", detail: "월세·인건비는 한 번만 입력" },
  { label: "월 비용 나누기", value: "판매량 기준", detail: "판매량에 맞춰 월 비용 반영" },
  { label: "무료 체험", value: "카드 없음", detail: "샘플값으로 바로 확인" },
];

const problemCards = [
  {
    title: "메뉴마다 남는 돈이 달라요",
    body: "아메리카노와 휘낭시에는 가격, 재료비, 판매량이 다릅니다. 같이 봐야 가게 전체 흐름이 보입니다.",
  },
  {
    title: "임대료·관리비는 메뉴마다 따로 내지 않아요",
    body: "월 운영비는 한 번만 입력하고, 전체 판매량으로 나눠 메뉴별로 반영합니다.",
  },
  {
    title: "잘 팔리는 메뉴가 꼭 많이 남지는 않아요",
    body: "총매출, 잔당 마진, 월 이익을 함께 보고, 가격을 바꿨을 때 판매량이 얼마나 줄어도 괜찮은지까지 확인합니다.",
  },
];

export function CupMarginLanding({ testPage = false }: { testPage?: boolean } = {}) {
  const [input, setInput] = useState<MultiMenuMarginInput>(() => cloneInput(DEFAULT_MULTI_MENU_INPUT));
  const [navOpen, setNavOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState(DEFAULT_MULTI_MENU_INPUT.menus[1]?.id ?? DEFAULT_MULTI_MENU_INPUT.menus[0].id);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [priceDelta, setPriceDelta] = useState(500);
  const [volumeChangeRate, setVolumeChangeRate] = useState(-5);
  const [recipeProductId, setRecipeProductId] = useState(DEFAULT_RECIPE_PRICING_PRODUCTS[0].id);
  const recipeProductInput = DEFAULT_RECIPE_PRICING_PRODUCTS.find((product) => product.id === recipeProductId) ?? DEFAULT_RECIPE_PRICING_PRODUCTS[0];
  const recipeProduct = useMemo(() => calculateProductCost(recipeProductInput), [recipeProductInput]);
  const [selectedRecipePrice, setSelectedRecipePrice] = useState(recipeProductInput.salePrice);
  const simulatedRecipeProduct = useMemo(
    () => calculateProductCost({ ...recipeProductInput, salePrice: selectedRecipePrice }),
    [recipeProductInput, selectedRecipePrice],
  );
  const simulationRange = useMemo(() => getSimulationRange(recipeProduct), [recipeProduct]);
  const simulationPoints = useMemo(
    () => generatePriceSimulation(recipeProduct, { ...simulationRange, step: 500 }),
    [recipeProduct, simulationRange],
  );
  const tradeArea = useMemo(() => summarizeTradeArea(DEFAULT_TRADE_AREA), []);
  const result = useMemo(() => calculateMultiMenuMargin(input), [input]);
  const selectedMenu = result.menus.find((menu) => menu.id === selectedMenuId) ?? result.menus[0];
  const priceRisk = selectedMenu
    ? calculatePriceChangeRisk(selectedMenu, { priceDelta, volumeChangeRate })
    : null;
  const verdict = getPortfolioVerdict(result);
  const topMenu = result.menus.slice().sort((a, b) => b.monthlyProfit - a.monthlyProfit)[0];

  function updateFixedCost(rawValue: string) {
    setInput((current) => ({ ...current, monthlyFixedCost: parseNumberInput(rawValue) }));
  }

  function updateMenuField(menuId: string, fieldId: keyof MenuMarginInput, rawValue: string) {
    setInput((current) => ({
      ...current,
      menus: current.menus.map((menu) =>
        menu.id === menuId
          ? { ...menu, [fieldId]: fieldId === "menuName" ? rawValue : parseNumberInput(rawValue) }
          : menu,
      ),
    }));
  }

  function addMenu() {
    setInput((current) => ({
      ...current,
      menus: [...current.menus, emptyMenu(current.menus.length + 1)],
    }));
  }

  function removeMenu(menuId: string) {
    setInput((current) => ({
      ...current,
      menus: current.menus.length <= 1 ? current.menus : current.menus.filter((menu) => menu.id !== menuId),
    }));
  }

  function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistSubmitted(true);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f5f7] text-[#061b31]">
      <section className="relative bg-white">
        <div className={`${testPage ? "hidden" : ""} absolute inset-x-0 top-0 h-[660px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,37,69,0.16),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(18,58,99,0.18),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f6f9fc_100%)]`} />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 lg:px-10">
          <nav className="rounded-2xl border border-[#e5edf5] bg-white/92 px-3 py-3 shadow-[rgba(50,50,93,0.12)_0px_16px_40px_-24px,rgba(0,0,0,0.08)_0px_8px_24px_-18px] backdrop-blur sm:px-4">
            <div className="flex items-center justify-between gap-3">
            <Link href={testPage ? "/" : "#top"} className="flex min-w-0 items-center gap-3" aria-label="컵마진 홈">
              <BrandMark />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-black tracking-[-0.02em] text-[#061b31]">컵마진</p>
                <p className="hidden text-xs text-[#64748d] sm:block">카페 메뉴 손익 계산기</p>
              </div>
            </Link>
            <div className="hidden items-center gap-6 text-sm font-semibold text-[#273951] md:flex">
              {testPage ? (
                <>
                  <a href="#recipe-pricing" className="hover:text-[#0b2545]">손익 판정</a>
                  <a href="#demo" className="hover:text-[#0b2545]">사용 시나리오</a>
                </>
              ) : (
                <>
                  <a href="#why" className="hover:text-[#0b2545]">왜 여러 메뉴를 보나요?</a>
                  <a href="/dashboard" className="hover:text-[#0b2545]">대시보드 보기</a>
                  <a href="#pricing" className="hover:text-[#0b2545]">가격</a>
                </>
              )}
            </div>
            <a href={testPage ? "/" : "#waitlist"} className="hidden shrink-0 rounded-lg bg-[#0b2545] px-3 py-2.5 text-sm font-bold text-white shadow-[rgba(11,37,69,0.35)_0px_14px_28px_-14px] transition hover:bg-[#123a63] sm:inline-flex sm:px-4">
              {testPage ? (
                <>
                  <span className="sm:hidden">랜딩</span>
                  <span className="hidden sm:inline">랜딩으로 돌아가기</span>
                </>
              ) : (
                "알림 받기"
              )}
            </a>
            <button
              type="button"
              onClick={() => setNavOpen((current) => !current)}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#d8e2ee] bg-white px-3 py-2 text-sm font-black text-[#0b2545] shadow-sm md:hidden"
              aria-expanded={navOpen}
              aria-controls="mobile-navigation"
            >
              메뉴 <span aria-hidden="true">{navOpen ? "닫기" : "열기"}</span>
            </button>
            </div>
            {navOpen ? (
              <div id="mobile-navigation" className="mt-3 grid gap-2 rounded-2xl bg-[#f5f8fb] p-2 text-sm font-bold text-[#273951] md:hidden">
                <Link href="/" className="rounded-xl bg-white px-4 py-3 shadow-sm" onClick={() => setNavOpen(false)}>랜딩으로 이동</Link>
                <Link href="/calculator" className="rounded-xl bg-white px-4 py-3 shadow-sm" onClick={() => setNavOpen(false)}>30초 계산기</Link>
                <Link href="/dashboard" className="rounded-xl bg-white px-4 py-3 shadow-sm" onClick={() => setNavOpen(false)}>계산 결과 예시</Link>
                <a href={testPage ? "#demo" : "#why"} className="rounded-xl bg-white px-4 py-3 shadow-sm" onClick={() => setNavOpen(false)}>{testPage ? "사용 시나리오" : "언제 쓰나요"}</a>
              </div>
            ) : null}
          </nav>

          {testPage ? (
            <div className="mt-4 w-full max-w-full overflow-hidden rounded-[26px] bg-[#1d1d1f] p-4 text-white shadow-[rgba(0,0,0,0.18)_0px_20px_60px_-32px] sm:hidden">
              <p className="text-sm font-semibold text-white/60">{simulatedRecipeProduct.name} · 현재 {formatWon(selectedRecipePrice)}</p>
              <p className="mt-2 text-[42px] font-semibold leading-none tracking-[-0.06em]">{formatWon(simulatedRecipeProduct.profit)}</p>
              <p className="mt-2 text-[17px] font-semibold text-white/72">한 잔에 남아요</p>
              <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-white/78">
                {simulatedRecipeProduct.warnings[0] ?? "지금 가격은 남습니다. 원재료값이 오르면 다시 확인해보세요."}
              </p>
            </div>
          ) : null}

          {!testPage ? (
            <div id="top" className="grid items-center gap-12 pb-20 pt-12 lg:grid-cols-[1fr_0.92fr] lg:pb-28 lg:pt-24">
              <div className="max-w-3xl">
              <div className="inline-flex rounded-md border border-[#c7d3e3] bg-white px-3 py-1.5 text-sm font-semibold text-[#0b2545] shadow-sm">
                오픈 전 메뉴 가격 미리 확인하기
              </div>
              <h1 className="mt-7 text-[40px] font-medium leading-[1.04] tracking-[-0.052em] text-[#061b31] sm:text-[60px] lg:text-[72px]">
                한 잔 팔면
                <span className="block text-[#0b2545]">진짜 얼마 남을까요?</span>
              </h1>
              <p className="mt-7 max-w-full text-lg font-normal leading-8 text-[#64748d] sm:max-w-2xl sm:text-xl">
                <span className="block">메뉴 가격만 입력하세요.</span>
                <span className="block">재료비·포장비·월세까지 함께 계산합니다.</span>
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={testPage ? "#calculator" : "/calculator"} className="rounded-lg bg-[#0b2545] px-6 py-4 text-center text-base font-bold text-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px] transition hover:-translate-y-0.5 hover:bg-[#123a63]">
                  무료로 얼마 남는지 계산하기
                </a>
                <a
                  href="/dashboard"
                  className="rounded-lg border border-[#9fb3cc] bg-white px-6 py-4 text-center text-base font-bold text-[#0b2545] transition hover:-translate-y-0.5 hover:bg-[#f3f7fb]"
                >
                  계산 결과 예시 보기
                </a>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {proofItems.map((item) => (
                  <div key={item.label} className="rounded-xl border border-[#e5edf5] bg-white p-4 shadow-[rgba(23,23,23,0.06)_0px_10px_24px_-16px]">
                    <p className="text-xs font-bold text-[#64748d]">{item.label}</p>
                    <p className="mt-1 text-xl font-light tracking-[-0.03em] text-[#061b31]">{item.value}</p>
                    <p className="mt-1 text-xs leading-5 text-[#64748d]">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

              <HeroDashboard result={result} verdict={verdict} topMenu={topMenu} />
            </div>
          ) : null}
        </div>
      </section>

      <section id="why" className={`${testPage ? "hidden" : ""} mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-10`}>
        <SectionEyebrow>현실적인 카페 손익 구조</SectionEyebrow>
        <div className="mt-3 grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-end">
          <h2 className="max-w-4xl text-3xl font-medium leading-tight tracking-[-0.04em] text-[#061b31] sm:text-5xl">
            <span className="block">한 메뉴가 아니라,</span>
            <span className="block">가게 전체 흐름으로 봅니다.</span>
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-[#64748d]">
            숫자는 단순하게, 한 가지 업무는 명확하게. 컵마진은 사장님이 가격·원가 판단에 쓰는 시간을 줄이는 데 집중합니다.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {problemCards.map((card, index) => (
            <article key={card.title} className="rounded-2xl border border-[#e5edf5] bg-white p-6 shadow-[rgba(50,50,93,0.18)_0px_30px_45px_-34px,rgba(0,0,0,0.08)_0px_18px_36px_-24px]">
              <span className="text-sm font-bold text-[#0b2545]">0{index + 1}</span>
              <h3 className="mt-5 text-2xl font-light leading-tight tracking-[-0.03em] text-[#061b31]">{card.title}</h3>
              <p className="mt-4 text-[15px] leading-7 text-[#64748d]">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <RecipePricingSection
          product={recipeProduct}
          simulatedProduct={simulatedRecipeProduct}
          selectedPrice={selectedRecipePrice}
          simulationRange={simulationRange}
          simulationPoints={simulationPoints}
          tradeArea={tradeArea}
          selectedProductId={recipeProductId}
          onSelectProduct={(productId) => {
            const nextProduct = DEFAULT_RECIPE_PRICING_PRODUCTS.find((product) => product.id === productId) ?? DEFAULT_RECIPE_PRICING_PRODUCTS[0];
            setRecipeProductId(productId);
            setSelectedRecipePrice(nextProduct.salePrice);
          }}
          onChangePrice={setSelectedRecipePrice}
          compact={testPage}
        />

      <section id="calculator" className="hidden">
        {testPage ? (
          <div className="mx-auto mb-3 w-full max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="rounded-2xl border border-[#c7d3e3] bg-white px-4 py-3 shadow-[rgba(11,37,69,0.08)_0px_12px_28px_-18px]">
              <p className="text-xs font-black text-[#0b2545]">테스트 페이지</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#061b31]">메뉴별 손익을 한 화면에서 확인하세요</h1>
              <p className="mt-1 text-sm leading-6 text-[#64748d]">입력은 접어두고 결과부터 보여줍니다. 필요할 때만 펼쳐서 수정하세요.</p>
            </div>
          </div>
        ) : null}
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-10">
          <div className="order-2 rounded-3xl border border-[#e5edf5] bg-white p-5 shadow-[rgba(50,50,93,0.2)_0px_38px_60px_-42px,rgba(0,0,0,0.1)_0px_18px_36px_-24px] sm:p-6 lg:order-1">
            <div className="flex flex-col gap-4 border-b border-[#e5edf5] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <SectionEyebrow>무료 계산기</SectionEyebrow>
                <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[#061b31] sm:text-4xl">메뉴별 판매량으로 계산하기</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[#64748d]">
                  고정 운영비는 한 번만 입력하고, 각 메뉴의 월 판매잔수·원가·수수료를 넣어보세요. 결과 패널은 오른쪽에 고정해 한눈에 비교합니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setIsCalculatorOpen((current) => !current)} className="w-fit rounded-lg bg-[#0b2545] px-4 py-2 text-sm font-bold text-white hover:bg-[#123a63]">
                  {isCalculatorOpen ? "입력 접기" : "입력 펼치기"}
                </button>
                <button type="button" onClick={() => setInput(cloneInput(emptyInput))} className="w-fit rounded-lg border border-[#c7d3e3] px-4 py-2 text-sm font-bold text-[#0b2545] hover:bg-[#f3f7fb]">
                  입력값 비우기
                </button>
                <button type="button" onClick={() => setInput(cloneInput(DEFAULT_MULTI_MENU_INPUT))} className="w-fit rounded-lg bg-[#0b2545] px-4 py-2 text-sm font-bold text-white hover:bg-[#123a63]">
                  샘플 채우기
                </button>
              </div>
            </div>

            {isCalculatorOpen ? (
              <div>
                <label className="mt-5 block rounded-2xl border border-[#d8e3ee] bg-[#f8fbff] p-4 transition focus-within:border-[#0b2545] focus-within:bg-white">
              <span className="flex items-center justify-between gap-3 text-sm font-bold text-[#273951]">
                월 고정 운영비
                <span className="text-xs text-[#64748d]">원</span>
              </span>
              <input
                value={formatInputValue(input.monthlyFixedCost)}
                onChange={(event) => updateFixedCost(event.target.value)}
                type="text"
                inputMode="numeric"
                placeholder="예: 1,200,000"
                className="mt-3 w-full bg-transparent text-3xl font-semibold tracking-[-0.04em] text-[#061b31] outline-none placeholder:text-[#aab7c4]"
              />
              <span className="mt-2 block text-sm leading-6 text-[#64748d]">
                임대료, 관리비, 고정 인건비처럼 매달 나가는 비용입니다. 전체 판매량 기준으로 잔당 {formatWon(result.fixedCostPerCup)}씩 반영됩니다.
              </span>
            </label>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {input.menus.map((menu, index) => (
                <article key={menu.id} className="rounded-2xl border border-[#e5edf5] bg-white p-4 shadow-[rgba(23,23,23,0.05)_0px_14px_30px_-20px]">
                  <div className="flex flex-col gap-3 border-b border-[#edf2f7] pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex-1">
                      <span className="text-xs font-bold text-[#64748d]">메뉴 {index + 1}</span>
                      <input
                        value={menu.menuName}
                        onChange={(event) => updateMenuField(menu.id, "menuName", event.target.value)}
                        type="text"
                        placeholder="예: 바닐라 라떼"
                        className="mt-1 w-full bg-transparent text-2xl font-semibold tracking-[-0.03em] text-[#061b31] outline-none placeholder:text-[#aab7c4]"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeMenu(menu.id)}
                      disabled={input.menus.length <= 1}
                      className="w-fit rounded-lg border border-[#ffd4d4] px-3 py-2 text-sm font-bold text-[#c23b3b] disabled:cursor-not-allowed disabled:border-[#e5edf5] disabled:text-[#aab7c4]"
                    >
                      삭제
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {menuFields.map((field) => (
                      <label key={field.id} className={`${field.compact ? "" : ""} rounded-xl border border-[#d8e3ee] bg-white p-4 transition focus-within:border-[#0b2545] focus-within:shadow-[rgba(11,37,69,0.16)_0px_14px_26px_-18px]`}>
                        <span className="flex items-center justify-between gap-3 text-sm font-bold text-[#273951]">
                          {field.label}
                          {field.suffix ? <span className="text-xs text-[#64748d]">{field.suffix}</span> : null}
                        </span>
                        <input
                          value={formatInputValue(menu[field.id])}
                          onChange={(event) => updateMenuField(menu.id, field.id, event.target.value)}
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          className="mt-3 w-full bg-transparent text-xl font-semibold tracking-[-0.02em] text-[#061b31] outline-none placeholder:text-[#aab7c4]"
                        />
                        <span className="mt-2 block text-xs leading-5 text-[#64748d]">{field.helper}</span>
                      </label>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <button type="button" onClick={addMenu} className="mt-5 w-full rounded-xl border border-dashed border-[#9fb3cc] bg-[#f3f7fb] px-4 py-4 text-sm font-black text-[#0b2545] transition hover:bg-[#e8f0f8]">
              + 메뉴 추가하기
            </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(true)}
                className="mt-5 w-full rounded-2xl border border-[#c7d3e3] bg-[#f8fbff] px-5 py-5 text-left transition hover:border-[#0b2545] hover:bg-white"
              >
                <span className="block text-sm font-black text-[#0b2545]">입력값은 접어두었습니다</span>
                <span className="mt-1 block text-sm leading-6 text-[#64748d]">오른쪽 결과를 먼저 보고, 필요할 때만 펼쳐서 메뉴별 판매량과 비용을 수정하세요.</span>
              </button>
            )}
          </div>

          <aside className="order-1 space-y-4 lg:sticky lg:top-4 lg:order-2 lg:self-start">
            <ResultPanel result={result} verdict={verdict} />
            <PriceRiskPanel
              menus={result.menus}
              selectedMenuId={selectedMenu?.id ?? ""}
              onSelectMenu={setSelectedMenuId}
              priceDelta={priceDelta}
              onChangePriceDelta={setPriceDelta}
              volumeChangeRate={volumeChangeRate}
              onChangeVolumeChangeRate={setVolumeChangeRate}
              risk={priceRisk}
            />
            <MenuBreakdownPanel menus={result.menus} onSelectMenu={setSelectedMenuId} />
          </aside>
        </div>
      </section>

      <section id="pricing" className={`${testPage ? "hidden" : ""} mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-10`}>
        <div className="rounded-[2rem] bg-[#061b31] p-6 text-white shadow-[rgba(3,3,39,0.24)_0px_40px_80px_-40px] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-bold text-[#9fb3cc]">가격은 간단하게</p>
              <h2 className="mt-3 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl">
                <span className="block">무료로 써보고,</span>
                <span className="block">필요할 때 월 9,900원부터.</span>
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-white/70">
              계산은 무료입니다. 메뉴 저장, 가격 바꿔보기 비교, 월간 리포트가 필요하면 출시 소식을 받아보세요. 결제는 사장님이 실제로 다시 쓰겠다고 느끼는 기능부터 연결합니다.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-6 ${plan.highlighted ? "border-[#9fb3cc] bg-white text-[#061b31]" : "border-white/10 bg-white/[0.07]"}`}>
                <p className={`text-sm font-bold ${plan.highlighted ? "text-[#0b2545]" : "text-white/60"}`}>{plan.name}</p>
                {"badge" in plan && plan.badge ? (
                  <span className="mt-3 inline-flex rounded-full bg-[#0b2545] px-3 py-1 text-xs font-black text-white shadow-[rgba(11,37,69,0.24)_0px_10px_22px_-14px]">
                    {plan.badge}
                  </span>
                ) : null}
                <p className="mt-3 text-4xl font-light tracking-[-0.04em]">{plan.price}</p>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-[#64748d]" : "text-white/55"}`}>{plan.caption}</p>
                <ul className="mt-6 space-y-3 text-sm font-semibold">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2"><span className="text-[#15be53]">✓</span>{feature}</li>
                  ))}
                </ul>
                <a
                  href={plan.name === "무료 체험" ? "/dashboard" : "#waitlist"}
                  className={`mt-7 block rounded-lg px-4 py-3 text-center text-sm font-bold shadow-[rgba(0,0,0,0.12)_0px_14px_28px_-18px] transition ${
                    plan.highlighted ? "bg-[#0b2545] !text-white hover:bg-[#123a63]" : "bg-[#0b2545] !text-white hover:bg-[#123a63]"
                  }`}
                >
                  {plan.name === "무료 체험" ? "무료로 계산해보기" : `${plan.name} 출시 알림 받기`}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className={`${testPage ? "hidden" : ""} mx-auto w-full max-w-7xl px-5 pb-10 sm:px-8 lg:px-10`}>
        <div className="grid gap-8 rounded-3xl border border-[#c7d3e3] bg-white p-6 shadow-[rgba(50,50,93,0.18)_0px_30px_60px_-38px] sm:p-8 lg:grid-cols-[0.82fr_1fr] lg:items-center">
          <div>
            <SectionEyebrow>출시 알림 받기</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-medium leading-tight tracking-[-0.04em] text-[#061b31] sm:text-5xl">여러 메뉴 저장 기능이 열리면 가장 먼저 알려드릴게요</h2>
            <p className="mt-4 leading-7 text-[#64748d]">
              지금 계산한 메뉴와 가격 변경 시나리오를 저장해두고 매달 다시 보고 싶다면 알림을 남겨주세요. 이메일은 현재 화면에서만 확인하는 임시 폼이며, 실제 저장·발송 기능은 다음 단계에서 연결합니다.
            </p>
          </div>
          <form onSubmit={submitWaitlist} className="rounded-2xl bg-[#f8fbff] p-4 sm:p-5">
            <label className="block text-sm font-bold text-[#273951]" htmlFor="waitlist-email">이메일</label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="waitlist-email"
                type="email"
                value={waitlistEmail}
                onChange={(event) => {
                  setWaitlistEmail(event.target.value);
                  setWaitlistSubmitted(false);
                }}
                placeholder="owner@example.com"
                className="min-h-12 flex-1 rounded-lg border border-[#d8e3ee] bg-white px-4 text-base font-medium text-[#061b31] outline-none transition focus:border-[#0b2545]"
                required
              />
              <button type="submit" className="rounded-lg bg-[#0b2545] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#123a63]">
                출시 알림 받기
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#64748d]">
              {waitlistSubmitted ? "알림 신청 의향을 확인했어요. 실제 저장/발송 기능은 다음 단계에서 연결합니다." : "스팸 없이 컵마진 베이직 오픈 소식만 받는 흐름으로 설계할 예정입니다."}
            </p>
          </form>
        </div>
      </section>

      <section className={`${testPage ? "hidden" : ""} mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8 lg:px-10`}>
        <div className="grid gap-8 rounded-3xl border border-[#e5edf5] bg-white p-6 shadow-[rgba(23,23,23,0.06)_0px_18px_44px_-28px] sm:p-8 lg:grid-cols-[0.78fr_1fr]">
          <div>
            <SectionEyebrow>앞으로 추가될 기능</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-medium leading-tight tracking-[-0.04em] text-[#061b31] sm:text-5xl">마진 계산부터 운영 체크까지 하나씩 넓혀갑니다</h2>
            <p className="mt-4 leading-7 text-[#64748d]">
              사장님이 실제로 자주 쓰는 기능만 검증해서 발주, 폐기, 리뷰, 알바 체크를 기능팩으로 추가합니다.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {operatingPacks.map((pack) => (
              <div key={pack} className="rounded-2xl border border-[#e5edf5] bg-[#f8fbff] p-5">
                <p className="text-lg font-light tracking-[-0.02em] text-[#061b31]">{pack}</p>
                <p className="mt-2 text-sm leading-6 text-[#64748d]">검증 후 기능팩으로 추가</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function BrandMark() {
  return (
    <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#0b2545] shadow-[rgba(11,37,69,0.35)_0px_10px_24px_-12px]" aria-hidden="true">
      <Image src="/brand/cup-margin-logo.png" alt="" width={40} height={40} className="h-full w-full object-cover" priority />
    </span>
  );
}

function CalculatorUseGuide() {
  const steps = [
    { title: "1. 메뉴를 고르세요", body: "아메리카노나 휘낭시에처럼 먼저 확인할 메뉴 하나를 선택합니다." },
    { title: "2. 지금 판매가를 보세요", body: "현재 가격에서 한 잔 원가와 남는 금액을 바로 확인합니다." },
    { title: "3. 가격을 움직여보세요", body: "슬라이더를 움직이면 마진율과 목표선이 어떻게 바뀌는지 보입니다." },
  ];

  return (
    <div className="rounded-[26px] border border-[#dce7f2] bg-white p-4 shadow-[rgba(11,37,69,0.10)_0px_18px_50px_-34px] sm:p-5">
      <p className="text-sm font-black text-[#0b2545]">30초 계산기 사용법</p>
      <h2 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#061b31]">가격표 쓰기 전에 딱 한 메뉴만 먼저 확인하세요.</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="rounded-2xl bg-[#f5f8fb] p-3">
            <p className="text-sm font-black text-[#061b31]">{step.title}</p>
            <p className="mt-1 text-[13px] leading-5 text-[#64748d]">{step.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 rounded-2xl bg-[#eef7ff] px-4 py-3 text-sm font-semibold leading-6 text-[#0b2545]">
        사용 시나리오: 오픈 전 가격표 작성, 원두값 인상 후 재검토, 신메뉴 소량 테스트 전에 씁니다. 추천가가 아니라 “지금 가격에 남는지”를 확인하는 도구입니다.
      </p>
    </div>
  );
}

function RecipePricingSection({
  product,
  simulatedProduct,
  selectedPrice,
  simulationRange,
  simulationPoints,
  tradeArea,
  selectedProductId,
  onSelectProduct,
  onChangePrice,
  compact = false,
}: {
  product: ProductCostingResult;
  simulatedProduct: ProductCostingResult;
  selectedPrice: number;
  simulationRange: { minPrice: number; maxPrice: number };
  simulationPoints: PriceSimulationPoint[];
  tradeArea: TradeAreaSummary;
  selectedProductId: string;
  onSelectProduct: (productId: string) => void;
  onChangePrice: (price: number) => void;
  compact?: boolean;
}) {
  const selectedPoint = {
    price: selectedPrice,
    profit: simulatedProduct.profit,
    marginRate: simulatedProduct.marginRate,
    costRate: simulatedProduct.costRate,
    meetsTarget: simulatedProduct.profit > 0 && simulatedProduct.costRate <= 45,
  };
  const ownerVerdict = getOwnerVerdict(simulatedProduct);
  const primaryWarning = simulatedProduct.warnings[0] ?? ownerVerdict.helper;

  return (
    <section id="recipe-pricing" className={`bg-[#f5f5f7] ${compact ? "py-7" : "py-20"}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 lg:px-10">
        {!compact ? (
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold tracking-[-0.01em] text-[#6e6e73]">카페 사장님용 30초 손익 판정</p>
            <h1 className="mt-3 text-[42px] font-semibold leading-[1.04] tracking-[-0.055em] text-[#1d1d1f] sm:text-[64px]">
              이 메뉴, 지금 가격에 팔아도 남나요?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-7 tracking-[-0.022em] text-[#6e6e73] sm:text-xl">
              메뉴와 판매가만 먼저 보세요. 복잡한 원가 계산은 컵마진이 뒤에서 처리합니다.
            </p>
          </div>
        ) : null}

        {compact ? <CalculatorUseGuide /> : null}

        <div className={`${compact ? "mt-4" : "mt-8"} grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start`}>
          <div className="w-full max-w-full rounded-[28px] bg-white p-4 shadow-[rgba(0,0,0,0.12)_0px_18px_55px_-32px] sm:rounded-[32px] sm:p-7">
            <label className="block text-sm font-semibold tracking-[-0.01em] text-[#6e6e73]" htmlFor="recipe-product">
              1. 메뉴 선택
            </label>
            <select
              id="recipe-product"
              value={selectedProductId}
              onChange={(event) => onSelectProduct(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-2xl border-0 bg-[#f5f5f7] px-4 text-[17px] font-semibold tracking-[-0.02em] text-[#1d1d1f] outline-none ring-1 ring-transparent transition focus:ring-[#0071e3]"
            >
              {DEFAULT_RECIPE_PRICING_PRODUCTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <div className={`${compact ? "hidden sm:block" : ""} mt-5 rounded-[28px] bg-[#1d1d1f] p-5 text-white sm:p-7`}>
              <p className="text-sm font-semibold text-white/60">2. 지금 가격으로 보면</p>
              <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-lg font-semibold tracking-[-0.02em] text-white/80">{simulatedProduct.name}</p>
                  <h2 className="mt-1 text-[44px] font-semibold leading-none tracking-[-0.055em] sm:text-[56px]">
                    {formatWon(simulatedProduct.profit)}
                  </h2>
                  <p className="mt-2 text-[17px] font-semibold text-white/70">한 잔에 남아요</p>
                </div>
                <div className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${ownerVerdict.badgeClassName}`}>
                  {ownerVerdict.label}
                </div>
              </div>
              <p className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-white/78">
                {primaryWarning}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <SimpleMetric label="현재 판매가" value={formatWon(selectedPrice)} />
              <SimpleMetric label="한 잔 원가" value={formatWon(simulatedProduct.totalCost)} />
              <SimpleMetric label="원가율" value={formatPercent(simulatedProduct.costRate)} />
            </div>

            <div className="mt-5 max-w-full overflow-hidden rounded-[24px] bg-[#f5f5f7] p-4 sm:rounded-[28px] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-[-0.01em] text-[#6e6e73]">3. 가격을 바꾸면</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#1d1d1f]">현재 {formatWon(selectedPrice)}</p>
                </div>
                <p className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[#1d1d1f] shadow-[rgba(0,0,0,0.08)_0px_8px_24px_-18px]">
                  가격 움직이기
                </p>
              </div>
              <input
                type="range"
                min={simulationRange.minPrice}
                max={simulationRange.maxPrice}
                step={100}
                value={selectedPrice}
                onChange={(event) => onChangePrice(Number(event.target.value))}
                className="mt-5 w-full accent-[#0071e3]"
                aria-label="판매가를 움직여 한 잔 손익 확인"
              />
              <div className="mt-2 flex justify-between text-xs font-semibold text-[#86868b]">
                <span>{formatWon(simulationRange.minPrice)}</span>
                <span>{formatWon(simulationRange.maxPrice)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <OwnerDemoCard productName={simulatedProduct.name} salePrice={selectedPrice} profit={simulatedProduct.profit} />
            <details className="w-full max-w-full rounded-[28px] bg-white p-5 shadow-[rgba(0,0,0,0.1)_0px_18px_50px_-34px]">
              <summary className="cursor-pointer list-none text-[17px] font-semibold tracking-[-0.02em] text-[#0066cc]">
                자세히 보기: 계산 근거와 참고값
              </summary>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-[#f5f5f7] p-4">
                  <p className="text-sm font-semibold text-[#6e6e73]">목표 원가율 기준 참고 가격</p>
                  <div className="mt-3 space-y-2">
                    {simulatedProduct.targetCostRatePrices.map((item) => (
                      <div key={item.costRate} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm font-semibold">
                        <span>원가율 {formatPercent(item.costRate)} 기준</span>
                        <span className="text-[#1d1d1f]">약 {formatWon(item.price)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#6e6e73]">
                    이 값은 추천가가 아닙니다. 실제 판매가는 주변 시세, 매장 포지션, 고객 반응을 함께 보고 사장님이 결정합니다.
                  </p>
                </div>
                <PriceSimulationChart points={simulationPoints} selectedPoint={selectedPoint} targetMarginRate={product.targetMarginRate} />
                <TradeAreaCard tradeArea={tradeArea} />
                <RecipeDetailCard product={product} />
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}

function SimpleMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[rgba(0,0,0,0.08)_0px_12px_30px_-24px] sm:bg-[#f5f5f7] sm:shadow-none">
      <p className="text-xs font-semibold tracking-[-0.01em] text-[#86868b]">{label}</p>
      <p className="mt-1 whitespace-nowrap text-2xl font-semibold tracking-[-0.045em] text-[#1d1d1f]">{value}</p>
    </div>
  );
}

function OwnerDemoCard({ productName, salePrice, profit }: { productName: string; salePrice: number; profit: number }) {
  return (
    <div id="demo" className="w-full max-w-full rounded-[28px] bg-white p-5 shadow-[rgba(0,0,0,0.1)_0px_18px_50px_-34px]">
      <p className="text-sm font-semibold text-[#6e6e73]">언제 쓰나요?</p>
      <h3 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#1d1d1f]">가격표 만들기 전 30초 확인</h3>
      <div className="mt-4 overflow-hidden rounded-3xl bg-[#111] p-4 text-white">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="mt-5 space-y-3 text-sm font-semibold">
          <p className="rounded-2xl bg-white/10 px-4 py-3">① {productName} 선택</p>
          <p className="rounded-2xl bg-white/10 px-4 py-3">② 판매가 {formatWon(salePrice)} 확인</p>
          <p className="rounded-2xl bg-[#0071e3] px-4 py-3">③ 한 잔에 {formatWon(profit)} 남는지 확인</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#6e6e73]">
        오픈 전 가격표 작성, 원재료값 인상 후 재검토, 신메뉴 테스트 때 사용하세요. 복잡한 계산식은 보이지 않게 처리합니다.
      </p>
    </div>
  );
}

function getOwnerVerdict(product: ProductCostingResult) {
  if (product.profit <= 0) {
    return {
      label: "손해",
      helper: "지금 가격은 한 잔 원가보다 낮습니다. 판매가나 재료 구성을 먼저 바꿔야 합니다.",
      badgeClassName: "bg-[#ff3b30] text-white",
    };
  }
  if (product.costRate >= 50) {
    return {
      label: "원가 주의",
      helper: "원가가 높은 편입니다. 원두·컵·포장비부터 확인하세요.",
      badgeClassName: "bg-[#ffd60a] text-[#1d1d1f]",
    };
  }
  if (product.costRate <= 42) {
    return {
      label: "무리 없음",
      helper: "지금 가격은 원가 기준으로 무리 없는 편입니다. 주변 가격과 고객 반응만 함께 확인하세요.",
      badgeClassName: "bg-[#30d158] text-[#1d1d1f]",
    };
  }
  return {
    label: "확인",
    helper: "지금 가격은 남습니다. 원재료값이 오르면 다시 한 번 확인해보세요.",
    badgeClassName: "bg-white/15 text-white ring-1 ring-white/20",
  };
}

function PriceSimulationChart({
  points,
  selectedPoint,
  targetMarginRate,
}: {
  points: PriceSimulationPoint[];
  selectedPoint: PriceSimulationPoint;
  targetMarginRate: number;
}) {
  const maxMargin = Math.max(targetMarginRate, ...points.map((point) => point.marginRate), selectedPoint.marginRate, 1);
  const visiblePoints = points.filter((_, index) => index % 2 === 0);
  const chartPoints = visiblePoints.some((point) => point.price === selectedPoint.price)
    ? visiblePoints
    : [...visiblePoints, selectedPoint].sort((a, b) => a.price - b.price);

  return (
    <div className="rounded-[28px] border border-[#c7d3e3] bg-white p-4 shadow-[rgba(11,37,69,0.16)_0px_28px_56px_-34px] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#0b2545]">실시간 가격 그래프</p>
          <h3 className="mt-2 text-[22px] font-light leading-tight tracking-[-0.03em] text-[#061b31] sm:text-2xl">가격을 움직이면 마진이 바뀝니다</h3>
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-bold ${selectedPoint.meetsTarget ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {selectedPoint.meetsTarget ? "목표 달성" : "목표 미달"}
        </span>
      </div>
      <div className="mt-5 space-y-2">
        {chartPoints.map((point) => {
          const isSelected = point.price === selectedPoint.price;
          const barColor = point.marginRate < 0 ? "bg-rose-500" : point.meetsTarget ? "bg-[#15be53]" : "bg-[#0b2545]";

          return (
            <div key={point.price} className={`grid grid-cols-[64px_1fr_56px] items-center gap-2 rounded-xl px-2 py-2 text-[13px] sm:grid-cols-[72px_1fr_64px] sm:gap-3 sm:text-sm ${isSelected ? "bg-[#eef5fb] ring-1 ring-[#c7d3e3]" : ""}`}>
              <span className="font-bold text-[#273951]">{formatWon(point.price)}</span>
              <div className="h-3 rounded-full bg-[#edf2f7]">
                <div
                  className={`h-3 rounded-full ${barColor}`}
                  style={{ width: `${Math.max(4, Math.min(100, (point.marginRate / maxMargin) * 100))}%` }}
                />
              </div>
              <span className={`text-right font-bold ${point.marginRate < 0 ? "text-rose-600" : point.meetsTarget ? "text-emerald-700" : "text-[#64748d]"}`}>{formatPercent(point.marginRate)}</span>
              {isSelected ? <span className="col-span-3 text-xs font-black text-[#0b2545]">현재 선택 · 목표선 {formatPercent(targetMarginRate)}</span> : null}
            </div>
          );
        })}
      </div>
      <div className="mt-5 rounded-2xl bg-[#f8fbff] p-4">
        <p className="text-sm font-black text-[#061b31]">현재 선택 {formatWon(selectedPoint.price)}</p>
        <p className="mt-1 text-sm leading-6 text-[#64748d]">
          이익 {formatWon(selectedPoint.profit)} · 마진율 {formatPercent(selectedPoint.marginRate)} · 목표선 {formatPercent(targetMarginRate)}
        </p>
      </div>
    </div>
  );
}

function TradeAreaCard({ tradeArea }: { tradeArea: TradeAreaSummary }) {
  return (
    <div className="rounded-[28px] border border-[#e5edf5] bg-white p-4 shadow-[rgba(23,23,23,0.06)_0px_18px_44px_-28px] sm:p-6">
      <p className="text-sm font-bold text-[#0b2545]">주변 상권 샘플</p>
      <h3 className="mt-2 text-[22px] font-light leading-tight tracking-[-0.03em] text-[#061b31] sm:text-2xl">{tradeArea.headline}</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="카페" value={`${tradeArea.cafeCount}곳`} />
        <Metric label="베이커리" value={`${tradeArea.bakeryCount}곳`} />
        <Metric label="저가 프차" value={`${tradeArea.lowPriceFranchiseCount}곳`} />
        <Metric label="정류장/역" value={`${tradeArea.transitStopCount}개`} />
      </div>
      <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">{tradeArea.warning}</p>
      <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-900">{tradeArea.opportunitySignal}</p>
    </div>
  );
}

function RecipeDetailCard({ product }: { product: ProductCostingResult }) {
  return (
    <div className="rounded-[28px] border border-[#e5edf5] bg-white p-4 shadow-[rgba(23,23,23,0.06)_0px_18px_44px_-28px] sm:p-6">
      <p className="text-sm font-bold text-[#0b2545]">접기/펼치기 원가 상세</p>
      <div className="mt-4 space-y-3">
        <details open className="rounded-2xl border border-[#e5edf5] bg-[#f8fbff] p-4">
          <summary className="cursor-pointer text-sm font-black text-[#061b31]">1. 원재료 환산</summary>
          <div className="mt-3 space-y-3">
            {product.ingredientLines.map((line) => (
              <div key={line.name} className="rounded-xl bg-white p-3 text-sm leading-6">
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-[#061b31]">{line.name}</strong>
                  <span className="font-bold text-[#0b2545]">{formatWon(line.cost)}</span>
                </div>
                <p className="text-[#64748d]">
                  {line.detail} · 손실 반영 {line.lossAdjustedQuantity}{line.baseUnit} · {line.baseUnit}당 {formatWon(line.baseUnitCost)}
                </p>
              </div>
            ))}
          </div>
        </details>
        <details className="rounded-2xl border border-[#e5edf5] bg-[#f8fbff] p-4">
          <summary className="cursor-pointer text-sm font-black text-[#061b31]">2. 포장재/인건비/고정비</summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric label="포장재" value={formatWon(product.packagingCost)} />
            <Metric label="인건비" value={formatWon(product.laborCost)} />
            <Metric label="월 비용 반영" value={formatWon(product.allocatedFixedCost)} />
          </div>
        </details>
        {product.productionType === "batch" ? (
          <details className="rounded-2xl border border-[#e5edf5] bg-[#f8fbff] p-4">
            <summary className="cursor-pointer text-sm font-black text-[#061b31]">3. 베이커리 배치 생산</summary>
            <p className="mt-3 text-sm leading-6 text-[#64748d]">
              이론 생산량 {product.batchYieldCount}개에서 굽기 손실 {product.batchLossRate}%와 폐기 {product.defectiveCount}개를 반영해 판매 가능 수량을 {product.sellableYieldCount}개로 봅니다.
            </p>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function getSimulationRange(product: ProductCostingResult) {
  return {
    minPrice: Math.max(1000, Math.floor(product.totalCost / 500) * 500),
    maxPrice: Math.ceil(Math.max(product.recommendedPrice * 1.35, product.salePrice * 1.25) / 500) * 500,
  };
}

function HeroDashboard({
  result,
  verdict,
  topMenu,
}: {
  result: MultiMenuMarginResult;
  verdict: PortfolioVerdict;
  topMenu?: MenuMarginResult;
}) {
  return (
    <div className="relative">
      <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-full bg-[#ffd7ef] blur-2xl lg:block" />
      <div className="relative rounded-[28px] border border-[#e5edf5] bg-white p-5 shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
        <div className="rounded-3xl bg-[#061b31] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#9fb3cc]">가게 손익 한눈에 보기</p>
              <h2 className="mt-3 text-3xl font-light tracking-[-0.04em]">월 {formatWon(result.totalProfit)}</h2>
            </div>
            <span className="rounded-md bg-[#15be53]/20 px-2 py-1 text-xs font-bold text-[#8bf0b1]">자동 반영</span>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Metric label="총 월매출" value={formatWon(result.totalRevenue)} dark />
            <Metric label="총 판매잔수" value={`${formatNumber(result.totalMonthlyCups)}잔`} dark />
            <Metric label="잔당 월 비용" value={formatWon(result.fixedCostPerCup)} dark />
            <Metric label="통합 마진율" value={formatPercent(result.blendedMarginRate)} dark />
          </div>
          <div className={`mt-5 rounded-xl border px-4 py-4 ${verdict.className}`}>
            <p className="text-sm font-black">{verdict.label} · {verdict.title}</p>
            <p className="mt-1 text-sm leading-6 opacity-80">{verdict.description}</p>
          </div>
          {topMenu ? (
            <div className="mt-5 rounded-2xl bg-white/10 p-4">
              <p className="text-xs font-bold text-white/60">가장 많이 남는 메뉴</p>
              <div className="mt-2 flex items-end justify-between gap-4">
                <p className="text-xl font-light tracking-[-0.03em]">{topMenu.menuName}</p>
                <p className="text-sm text-white/70">월 {formatWon(topMenu.monthlyProfit)}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ result, verdict }: { result: MultiMenuMarginResult; verdict: PortfolioVerdict }) {
  return (
    <div className="rounded-3xl border border-[#e5edf5] bg-white p-6 shadow-[rgba(50,50,93,0.18)_0px_30px_45px_-34px,rgba(0,0,0,0.08)_0px_18px_36px_-24px]">
      <p className="text-sm font-bold text-[#0b2545]">가게 전체 결과</p>
      <h2 className="mt-2 text-3xl font-light tracking-[-0.04em] text-[#061b31]">이번 달 예상 손익</h2>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Metric label="총 월매출" value={formatWon(result.totalRevenue)} />
        <Metric label="총 변동비" value={formatWon(result.totalVariableCost)} />
        <Metric label="월 운영비" value={formatWon(result.totalFixedCost)} />
        <Metric label="월 예상 이익" value={formatWon(result.totalProfit)} emphasis />
        <Metric label="잔당 월 비용" value={formatWon(result.fixedCostPerCup)} />
        <Metric label="통합 마진율" value={formatPercent(result.blendedMarginRate)} emphasis />
      </div>
      <div className={`mt-5 rounded-xl border px-4 py-4 ${verdict.className}`}>
        <p className="font-black">{verdict.title}</p>
        <p className="mt-1 text-sm leading-6 opacity-80">{verdict.description}</p>
      </div>
    </div>
  );
}

function PriceRiskPanel({
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
  risk: ReturnType<typeof calculatePriceChangeRisk> | null;
}) {
  const selectedMenu = menus.find((menu) => menu.id === selectedMenuId) ?? menus[0];
  const scenarioButtons = [-15, -5, 0, 5];

  if (!selectedMenu || !risk) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-[#c7d3e3] bg-[linear-gradient(180deg,#ffffff_0%,#f3f7fb_100%)] p-6 shadow-[rgba(11,37,69,0.18)_0px_28px_56px_-34px] transition-all duration-500 ease-out">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#0b2545]">가격 바꿔보기</p>
          <h3 className="mt-2 text-[22px] font-light leading-tight tracking-[-0.03em] text-[#061b31] sm:text-2xl">몇 잔까지 줄어도 괜찮을까요?</h3>
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-bold ${risk.verdict === "risk" ? "bg-rose-100 text-rose-700" : risk.verdict === "watch" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
          {risk.verdict === "risk" ? "위험" : risk.verdict === "watch" ? "원가율 주의" : "확인"}
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

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Metric label="새 판매가" value={formatWon(risk.newSalePrice)} />
        <Metric label="가정 판매량" value={`${formatNumber(risk.assumedMonthlyCups)}잔`} />
        <Metric label="예상 월 이익" value={formatWon(risk.projectedMonthlyProfit)} emphasis />
        <Metric label="기존 대비" value={`${risk.profitDelta >= 0 ? "+" : ""}${formatWon(risk.profitDelta)}`} emphasis={risk.profitDelta >= 0} />
      </div>

      <div className="mt-4 rounded-2xl border border-[#c7d3e3] bg-white p-4">
        <p className="text-sm font-black text-[#061b31]">
          {risk.allowedDropCups !== null && risk.allowedDropRate !== null
            ? `판매량이 ${formatNumber(Math.max(0, risk.allowedDropCups))}잔, 약 ${formatPercent(Math.max(0, risk.allowedDropRate))} 이상 줄면 인상 효과가 사라집니다.`
            : "새 가격에서도 잔당 이익이 남지 않아 가격보다 원가 구조를 먼저 봐야 합니다."}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#64748d]">{risk.summary}</p>
      </div>
      <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-900">
        {risk.warning}
      </p>
      <p className="mt-4 text-xs font-bold leading-5 text-[#64748d]">
        가격을 바꾼 뒤에는 다음 달 실제 판매량과 함께 다시 보세요.
      </p>
      <a href="#waitlist" className="mt-3 block rounded-xl bg-[#0b2545] px-4 py-3 text-center text-sm font-black text-white shadow-[rgba(11,37,69,0.3)_0px_16px_30px_-16px] transition duration-300 hover:-translate-y-0.5 hover:bg-[#123a63]">
        출시 알림 받고 계산 저장하기
      </a>
    </div>
  );
}

function MenuBreakdownPanel({ menus, onSelectMenu }: { menus: MenuMarginResult[]; onSelectMenu: (menuId: string) => void }) {
  return (
    <div className="rounded-[28px] border border-[#e5edf5] bg-white p-4 shadow-[rgba(23,23,23,0.06)_0px_18px_44px_-28px] sm:p-6">
      <h3 className="text-2xl font-light tracking-[-0.03em] text-[#061b31]">메뉴별 손익</h3>
      <div className="mt-4 space-y-3">
        {menus.map((menu) => (
          <div key={menu.id} className="rounded-2xl border border-[#e5edf5] bg-[#f8fbff] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-[#061b31]">{menu.menuName || "이름 없는 메뉴"}</p>
                <p className="mt-1 text-xs text-[#64748d]">{formatNumber(menu.expectedMonthlyCups)}개 · 월 비용 {formatWon(menu.fixedCostShare)} 반영</p>
              </div>
              <span className={`rounded-md px-2 py-1 text-xs font-bold ${menu.profitPerCup <= 0 ? "bg-rose-100 text-rose-700" : menu.marginRate < 20 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                {menu.profitPerCup <= 0 ? "손실" : menu.marginRate < 20 ? "원가율 주의" : "양호"}
              </span>
            </div>
            <p className="mt-3 text-2xl font-light tracking-[-0.03em] text-[#061b31]">{formatWon(menu.profitPerCup)} / 잔</p>
            <p className="text-sm leading-6 text-[#64748d]">월 {formatWon(menu.monthlyProfit)} · 남는 비율 {formatPercent(menu.marginRate)} · 가격을 바꾸면 판매량도 함께 보세요</p>
            <button
              type="button"
              onClick={() => onSelectMenu(menu.id)}
              className="mt-3 w-full rounded-xl border border-[#c7d3e3] bg-white px-3 py-2 text-sm font-black text-[#0b2545] transition hover:-translate-y-0.5 hover:bg-[#f3f7fb]"
            >
              이 메뉴 가격 바꿔보기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value, emphasis = false, dark = false }: { label: string; value: string; emphasis?: boolean; dark?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${dark ? "bg-white/10" : emphasis ? "bg-[#f0f0ff]" : "bg-[#f8fbff]"}`}>
      <p className={`text-xs font-bold ${dark ? "text-white/60" : "text-[#64748d]"}`}>{label}</p>
      <p className={`mt-2 text-xl font-light tracking-[-0.03em] ${dark ? "text-white" : "text-[#061b31]"}`}>{value}</p>
    </div>
  );
}

function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-bold text-[#0b2545]">{children}</p>;
}

type PortfolioVerdict = {
  label: string;
  title: string;
  description: string;
  className: string;
};

function getPortfolioVerdict(result: MultiMenuMarginResult): PortfolioVerdict {
  if (result.totalProfit <= 0 || result.blendedMarginRate < 8) {
    return {
      label: "위험",
      title: "가게 전체로 보면 남는 돈이 부족해요",
      description: "고정 운영비까지 나누어 보면 손실이거나 마진이 낮습니다. 판매가, 레시피, 폐기율, 판매량 가정을 먼저 점검하세요.",
      className: "border-rose-200 bg-rose-50 text-rose-900",
    };
  }

  if (result.blendedMarginRate < 20) {
    return {
      label: "원가율 주의",
      title: "팔리지만 여유가 얇은 구조예요",
      description: "가게 전체로 남는 돈이 얇은 편입니다. 많이 팔리는 메뉴부터 원가와 가격을 확인해보세요.",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }

  return {
    label: "양호",
    title: "현재 입력값 기준으로 운영 여유가 있어요",
    description: "메뉴별 월 이익을 비교해 많이 남는 메뉴는 더 밀고, 마진이 얇은 메뉴는 가격이나 레시피를 조정해볼 수 있습니다.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  };
}

function parseNumberInput(value: string) {
  const normalized = value.replace(/[^0-9]/g, "");
  return normalized ? Number(normalized) : 0;
}

function parseSignedNumberInput(value: string) {
  const normalized = value.replace(/[^0-9-]/g, "");
  if (!normalized || normalized === "-") return 0;
  return Number(normalized);
}

function formatInputValue(value: string | number) {
  if (typeof value === "string") return value;
  if (!Number.isFinite(value) || value === 0) return "";
  return formatNumber(value);
}

function cloneInput(input: MultiMenuMarginInput): MultiMenuMarginInput {
  return {
    monthlyFixedCost: input.monthlyFixedCost,
    menus: input.menus.map((menu) => ({ ...menu })),
  };
}
