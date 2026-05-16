"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { buildCalculatorSharePath, parseCalculatorSearch, parseStoredCalculatorState } from "../model/calculatorPersistence";
import { operatingPacks, pricingPlans } from "../model/copy";
import { formatNumber, formatPercent, formatWon } from "../model/formatters";
import {
  buildPriceDecision,
  calculateProductCost,
  DEFAULT_RECIPE_PRICING_PRODUCTS,
  DEFAULT_TRADE_AREA,
  estimateSalesIndex,
  generatePriceSimulation,
  summarizeTradeArea,
  type ChannelMixOptions,
  type PriceDecisionSummary,
  type ProductCostingResult,
  type PriceSimulationPoint,
  type SalesSensitivity,
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

type MobileCalculatorView = "result" | "adjust" | "details";

const calculatorStorageKey = "cup-margin:calculator:v1";

const DEFAULT_CHANNEL_MIX: ChannelMixOptions = {
  storeRate: 60,
  takeawayRate: 25,
  deliveryRate: 15,
  cardFeeRate: 2,
  deliveryFeeRate: 15,
  deliveryExtraPackagingCost: 250,
};

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

const heroBenefitCards = [
  {
    title: "무슨 서비스인가요?",
    body: "컵마진은 카페 메뉴 가격을 정하기 전에 한 잔 원가, 남는 돈, 월 비용 반영값을 한 화면에서 확인하는 손익 계산기입니다.",
  },
  {
    title: "언제 쓰나요?",
    body: "오픈 전 가격표를 만들 때, 원두·우유·포장재 가격이 올랐을 때, 신메뉴를 소량 테스트하기 전에 씁니다.",
  },
  {
    title: "쓰면 뭐가 좋나요?",
    body: "감으로 가격을 정하기 전에 손해 가능성을 먼저 보고, 사장님이 실제 가격 판단에 쓸 수 있는 기준만 남깁니다.",
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
  const [salesSensitivity, setSalesSensitivity] = useState<SalesSensitivity>("medium");
  const [includeChannelCosts, setIncludeChannelCosts] = useState(true);
  const [mobileCalculatorView, setMobileCalculatorView] = useState<MobileCalculatorView>("result");
  const [saveMessage, setSaveMessage] = useState("계산을 저장하면 이 기기와 공유 링크에서 다시 열 수 있어요.");
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
  const priceDecision = useMemo(
    () =>
      buildPriceDecision(recipeProduct, {
        selectedPrice: selectedRecipePrice,
        monthlyCups: 600,
        sensitivity: salesSensitivity,
        channelMix: includeChannelCosts ? DEFAULT_CHANNEL_MIX : undefined,
        simulationRange: { ...simulationRange, step: 500 },
      }),
    [includeChannelCosts, recipeProduct, selectedRecipePrice, salesSensitivity, simulationRange],
  );
  const result = useMemo(() => calculateMultiMenuMargin(input), [input]);
  const selectedMenu = result.menus.find((menu) => menu.id === selectedMenuId) ?? result.menus[0];
  const priceRisk = selectedMenu
    ? calculatePriceChangeRisk(selectedMenu, { priceDelta, volumeChangeRate })
    : null;
  const verdict = getPortfolioVerdict(result);

  useEffect(() => {
    const productIds = DEFAULT_RECIPE_PRICING_PRODUCTS.map((product) => product.id);
    const sharedState = parseCalculatorSearch(window.location.search, productIds);
    const storedState = parseStoredCalculatorState(window.localStorage.getItem(calculatorStorageKey), productIds);

    const applySavedState = (nextProductId: string, nextPrice: number, message: string) => {
      const nextProduct = DEFAULT_RECIPE_PRICING_PRODUCTS.find((product) => product.id === nextProductId) ?? DEFAULT_RECIPE_PRICING_PRODUCTS[0];
      window.setTimeout(() => {
        setRecipeProductId(nextProductId);
        setSelectedRecipePrice(nextPrice || nextProduct.salePrice);
        setSaveMessage(message);
      }, 0);
    };

    if (sharedState) {
      applySavedState(sharedState.productId, sharedState.selectedPrice, "공유 링크로 저장한 계산을 불러왔어요.");
      return;
    }

    if (storedState) {
      applySavedState(storedState.productId, storedState.selectedPrice, "이 기기에 저장된 마지막 계산을 불러왔어요.");
    }
  }, []);

  async function saveCalculatorState() {
    const sharePath = buildCalculatorSharePath({ productId: recipeProductId, selectedPrice: selectedRecipePrice });
    const shareUrl = `${window.location.origin}${sharePath}`;
    window.localStorage.setItem(
      calculatorStorageKey,
      JSON.stringify({ productId: recipeProductId, selectedPrice: selectedRecipePrice, savedAt: new Date().toISOString() }),
    );
    window.history.replaceState(null, "", sharePath);

    try {
      await navigator.clipboard?.writeText(shareUrl);
      setSaveMessage("저장했고 공유 링크도 복사했어요. 다시 열면 같은 계산으로 시작합니다.");
    } catch {
      setSaveMessage(`저장했어요. 공유 링크: ${shareUrl}`);
    }
  }

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
                  <a href="#recipe-pricing" className="hover:text-[#0b2545]">메뉴·가격 조정</a>
                  <a href="#demo" className="hover:text-[#0b2545]">가격 그래프</a>
                  <Link href="/dashboard" className="hover:text-[#0b2545]">계산 결과 예시</Link>
                </>
              ) : (
                <>
                  <a href="#top" className="hover:text-[#0b2545]">서비스 소개</a>
                  <a href="#why" className="hover:text-[#0b2545]">언제 쓰나요</a>
                  <Link href="/dashboard" className="hover:text-[#0b2545]">계산 결과 예시</Link>
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
                <Link href="/" className="rounded-xl bg-white px-4 py-3 shadow-sm" onClick={() => setNavOpen(false)}>서비스 소개</Link>
                <a href={testPage ? "#recipe-pricing" : "#why"} className="rounded-xl bg-white px-4 py-3 shadow-sm" onClick={() => setNavOpen(false)}>{testPage ? "메뉴·가격 조정" : "언제 쓰나요"}</a>
                {testPage ? (
                  <a href="#demo" className="rounded-xl bg-white px-4 py-3 shadow-sm" onClick={() => setNavOpen(false)}>가격 그래프</a>
                ) : (
                  <Link href="/calculator" className="rounded-xl bg-white px-4 py-3 shadow-sm" onClick={() => setNavOpen(false)}>메뉴·가격 조정</Link>
                )}
                <Link href="/dashboard" className="rounded-xl bg-white px-4 py-3 shadow-sm" onClick={() => setNavOpen(false)}>계산 결과 예시</Link>
              </div>
            ) : null}
          </nav>

          {!testPage ? (
            <div id="top" className="grid items-center gap-12 pb-20 pt-12 lg:grid-cols-[1fr_0.92fr] lg:pb-28 lg:pt-24">
              <div className="max-w-3xl">
                <div className="inline-flex rounded-md border border-[#c7d3e3] bg-white px-3 py-1.5 text-sm font-semibold text-[#0b2545] shadow-sm">
                  카페 사장님용 메뉴 손익 기준표
                </div>
                <h1 className="mt-7 text-[40px] font-medium leading-[1.04] tracking-[-0.052em] text-[#061b31] sm:text-[60px] lg:text-[72px]">
                  가격 정하기 전,
                  <span className="block text-[#0b2545]">이 메뉴가 남는지 먼저 봅니다.</span>
                </h1>
                <p className="mt-7 max-w-full text-lg font-normal leading-8 text-[#64748d] sm:max-w-2xl sm:text-xl">
                  <span className="block">컵마진은 메뉴 가격, 원가, 포장비, 월 비용을 함께 보고</span>
                  <span className="block">사장님이 가격표를 쓰기 전에 손해 가능성을 줄여주는 계산 서비스입니다.</span>
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href="#why" className="rounded-lg bg-[#0b2545] px-6 py-4 text-center text-base font-bold text-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px] transition hover:-translate-y-0.5 hover:bg-[#123a63]">
                    언제 쓰는지 보기
                  </a>
                  <a
                    href="/dashboard"
                    className="rounded-lg border border-[#9fb3cc] bg-white px-6 py-4 text-center text-base font-bold text-[#0b2545] transition hover:-translate-y-0.5 hover:bg-[#f3f7fb]"
                  >
                    무료로 이용해보기
                  </a>
                </div>
              </div>

              <HeroBenefitPanel />
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
          priceDecision={priceDecision}
          salesSensitivity={salesSensitivity}
          onChangeSalesSensitivity={setSalesSensitivity}
          includeChannelCosts={includeChannelCosts}
          onToggleChannelCosts={setIncludeChannelCosts}
          selectedProductId={recipeProductId}
          onSelectProduct={(productId) => {
            const nextProduct = DEFAULT_RECIPE_PRICING_PRODUCTS.find((product) => product.id === productId) ?? DEFAULT_RECIPE_PRICING_PRODUCTS[0];
            setRecipeProductId(productId);
            setSelectedRecipePrice(nextProduct.salePrice);
          }}
          onChangePrice={setSelectedRecipePrice}
          compact={testPage}
          mobileView={mobileCalculatorView}
          onChangeMobileView={setMobileCalculatorView}
          onSaveCalculator={saveCalculatorState}
          saveMessage={saveMessage}
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
                  {plan.name === "무료 체험" ? "무료로 이용해보기" : `${plan.name} 출시 알림 받기`}
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

function HeroBenefitPanel() {
  return (
    <div className="rounded-[28px] border border-[#e5edf5] bg-white p-5 shadow-[rgba(50,50,93,0.2)_0px_30px_55px_-36px,rgba(0,0,0,0.08)_0px_18px_36px_-24px] sm:p-6">
      <p className="text-sm font-black text-[#0b2545]">처음 화면에서 확인할 내용</p>
      <h2 className="mt-3 text-3xl font-medium leading-tight tracking-[-0.04em] text-[#061b31]">
        계산기는 뒤로 두고, 먼저 판단 기준을 보여줍니다.
      </h2>
      <div className="mt-6 space-y-3">
        {heroBenefitCards.map((card, index) => (
          <article key={card.title} className="rounded-2xl border border-[#e5edf5] bg-[#f8fbff] p-4">
            <p className="text-xs font-black text-[#0b2545]">{index + 1}</p>
            <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-[#061b31]">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748d]">{card.body}</p>
          </article>
        ))}
      </div>
    </div>
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
      <p className="text-sm font-black text-[#0b2545]">30초 계산기</p>
      <h2 className="mt-2 text-[22px] font-semibold leading-tight tracking-[-0.04em] text-[#061b31] sm:text-2xl">가격을 올려도 이익이 늘어나는지 30초 만에 확인하세요.</h2>
      <div className="mt-4 hidden gap-2 sm:grid sm:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="rounded-2xl bg-[#f5f8fb] p-3">
            <p className="text-sm font-black text-[#061b31]">{step.title}</p>
            <p className="mt-1 text-[13px] leading-5 text-[#64748d]">{step.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl bg-[#eef7ff] px-4 py-3 text-sm font-semibold leading-6 text-[#0b2545] sm:hidden">
        <p className="font-black">언제 쓰나요?</p>
        <p className="mt-1">가격표 작성 전, 원재료값 인상 후, 신메뉴 소량 테스트 전에 바로 확인하세요.</p>
      </div>
      <p className="mt-3 hidden rounded-2xl bg-[#eef7ff] px-4 py-3 text-sm font-semibold leading-6 text-[#0b2545] sm:block">
        사용 시점: 오픈 전 가격표 작성, 원두값 인상 후 재검토, 신메뉴 소량 테스트 전에 씁니다. 추천 검토가와 월 이익 변화를 함께 보고 가격을 결정하세요.
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
  priceDecision,
  salesSensitivity,
  onChangeSalesSensitivity,
  includeChannelCosts,
  onToggleChannelCosts,
  selectedProductId,
  onSelectProduct,
  onChangePrice,
  compact = false,
  mobileView = "result",
  onChangeMobileView,
  onSaveCalculator,
  saveMessage,
}: {
  product: ProductCostingResult;
  simulatedProduct: ProductCostingResult;
  selectedPrice: number;
  simulationRange: { minPrice: number; maxPrice: number };
  simulationPoints: PriceSimulationPoint[];
  tradeArea: TradeAreaSummary;
  priceDecision: PriceDecisionSummary;
  salesSensitivity: SalesSensitivity;
  onChangeSalesSensitivity: (sensitivity: SalesSensitivity) => void;
  includeChannelCosts: boolean;
  onToggleChannelCosts: (enabled: boolean) => void;
  selectedProductId: string;
  onSelectProduct: (productId: string) => void;
  onChangePrice: (price: number) => void;
  compact?: boolean;
  mobileView?: MobileCalculatorView;
  onChangeMobileView?: (view: MobileCalculatorView) => void;
  onSaveCalculator?: () => void;
  saveMessage?: string;
}) {
  const selectedPoint = {
    price: selectedPrice,
    profit: simulatedProduct.profit,
    marginRate: simulatedProduct.marginRate,
    costRate: simulatedProduct.costRate,
    expectedSalesIndex: estimateSalesIndex(product.salePrice, selectedPrice, salesSensitivity),
    meetsTarget: simulatedProduct.marginRate >= product.targetMarginRate,
  };
  const ownerVerdict = getOwnerVerdict(simulatedProduct);
  const primaryWarning = simulatedProduct.warnings[0] ?? ownerVerdict.helper;
  const showResultOnMobile = mobileView === "result";
  const showAdjustOnMobile = mobileView === "adjust";
  const showDetailsOnMobile = mobileView === "details";

  return (
    <section id="recipe-pricing" className={`bg-[#f5f5f7] ${compact ? "py-7" : "py-20"}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8 lg:px-10">
        {!compact ? (
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold tracking-[-0.01em] text-[#6e6e73]">카페 사장님용 메뉴 가격 확인</p>
            <h1 className="mt-3 text-[42px] font-semibold leading-[1.04] tracking-[-0.055em] text-[#1d1d1f] sm:text-[64px]">
              이 메뉴, 지금 가격에 팔아도 남나요?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-7 tracking-[-0.022em] text-[#6e6e73] sm:text-xl">
              메뉴와 판매가만 먼저 보세요. 복잡한 원가 계산은 컵마진이 뒤에서 처리합니다.
            </p>
          </div>
        ) : null}

        {compact && showResultOnMobile ? <CalculatorUseGuide /> : null}

        {compact ? (
          <MobileCalculatorTabs currentView={mobileView} onChangeView={onChangeMobileView} />
        ) : null}

        <div className={`${compact && showResultOnMobile ? "hidden sm:grid" : "grid"} ${compact ? "mt-4" : "mt-8"} gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start`}>
          <div className={`${compact && showDetailsOnMobile ? "hidden sm:block" : ""} w-full max-w-full rounded-[28px] bg-white p-4 shadow-[rgba(0,0,0,0.12)_0px_18px_55px_-32px] sm:rounded-[32px] sm:p-7`}>
            <div className={`${compact && !showAdjustOnMobile ? "hidden sm:block" : ""}`}>
              <label className="block text-sm font-semibold tracking-[-0.01em] text-[#6e6e73]" htmlFor="recipe-product">
                메뉴 선택
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
              {compact && showResultOnMobile ? (
                <button
                  type="button"
                  onClick={() => onChangeMobileView?.("result")}
                  className="mt-3 w-full rounded-2xl bg-[#1d1d1f] px-4 py-3 text-sm font-semibold text-white sm:hidden"
                >
                  선택한 메뉴 결과 보기
                </button>
              ) : null}
            </div>

            <CurrentPriceResultCard
              productName={simulatedProduct.name}
              profit={simulatedProduct.profit}
              warning={primaryWarning}
              verdictLabel={ownerVerdict.label}
              verdictClassName={ownerVerdict.badgeClassName}
              compact={compact}
            />

            <PriceDecisionCard decision={priceDecision} />

            <div className={`${compact && !showResultOnMobile ? "hidden sm:grid" : ""} mt-4 grid gap-3 sm:grid-cols-3`}>
              <SimpleMetric label="현재 판매가" value={formatWon(selectedPrice)} />
              <SimpleMetric label="한 잔 원가" value={formatWon(simulatedProduct.totalCost)} />
              <SimpleMetric label="마진율" value={formatPercent(simulatedProduct.marginRate)} />
            </div>

            {compact && showResultOnMobile ? (
              <SaveCalculatorCard onSave={onSaveCalculator} message={saveMessage} />
            ) : null}

            <div className={`${compact && !showAdjustOnMobile ? "hidden sm:block" : ""} mt-5`}>
              <PriceControlCard
                selectedPrice={selectedPrice}
                simulationRange={simulationRange}
                simulationPoints={simulationPoints}
                selectedPoint={selectedPoint}
                targetMarginRate={product.targetMarginRate}
                priceDecision={priceDecision}
                salesSensitivity={salesSensitivity}
                onChangeSalesSensitivity={onChangeSalesSensitivity}
                includeChannelCosts={includeChannelCosts}
                onToggleChannelCosts={onToggleChannelCosts}
                onChangePrice={onChangePrice}
                compact={compact}
                onShowResult={() => onChangeMobileView?.("result")}
              />
            </div>
          </div>

          <div className={`${compact && !showDetailsOnMobile ? "hidden sm:block" : ""} space-y-4`}>
            {compact && showDetailsOnMobile ? (
              <CurrentPriceResultCard
                productName={simulatedProduct.name}
                profit={simulatedProduct.profit}
                warning={primaryWarning}
                verdictLabel={ownerVerdict.label}
                verdictClassName={ownerVerdict.badgeClassName}
              />
            ) : (
              <OwnerDemoCard productName={simulatedProduct.name} salePrice={selectedPrice} profit={simulatedProduct.profit} decision={priceDecision} showEyebrow={false} />
            )}
            <details open={compact && showDetailsOnMobile ? true : undefined} className="w-full max-w-full rounded-[28px] bg-white p-5 shadow-[rgba(0,0,0,0.1)_0px_18px_50px_-34px]">
              <summary className="cursor-pointer list-none text-[17px] font-semibold tracking-[-0.02em] text-[#0066cc]">
                자세히 보기: 계산 근거와 참고값
              </summary>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-[#f5f5f7] p-4">
                  <p className="text-sm font-semibold text-[#6e6e73]">목표 마진율 기준 참고 가격</p>
                  <div className="mt-3 space-y-2">
                    {simulatedProduct.targetCostRatePrices.map((item) => (
                      <div key={item.costRate} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold">
                        <span>마진율 {formatPercent(100 - item.costRate)} 이상 기준</span>
                        <span className="shrink-0 text-[#1d1d1f]">약 {formatWon(item.price)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#6e6e73]">
                    이 값은 추천가가 아닙니다. 실제 판매가는 주변 시세, 매장 포지션, 고객 반응을 함께 보고 사장님이 결정합니다.
                  </p>
                </div>
                <TradeAreaCard tradeArea={tradeArea} />
                <ChannelCostCard includeChannelCosts={includeChannelCosts} decision={priceDecision} />
                <IngredientImpactCard product={product} />
                <RecipeDetailCard product={product} />
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>
  );
}

function MobileCalculatorTabs({
  currentView,
  onChangeView,
}: {
  currentView: MobileCalculatorView;
  onChangeView?: (view: MobileCalculatorView) => void;
}) {
  const tabs: Array<{ id: MobileCalculatorView; label: string; helper: string }> = [
    { id: "result", label: "결과", helper: "추천가·월이익" },
    { id: "adjust", label: "메뉴·가격", helper: "조정" },
    { id: "details", label: "근거", helper: "상세" },
  ];

  return (
    <div className="sticky top-2 z-20 mt-4 rounded-[24px] border border-black/5 bg-white/92 p-2 shadow-[rgba(0,0,0,0.12)_0px_14px_34px_-22px] backdrop-blur sm:hidden">
      <div className="grid grid-cols-3 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChangeView?.(tab.id)}
            className={`min-h-14 rounded-2xl px-2 py-2 text-center transition ${
              currentView === tab.id ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"
            }`}
            aria-pressed={currentView === tab.id}
          >
            <span className="block text-sm font-semibold">{tab.label}</span>
            <span className={`mt-0.5 block text-[11px] font-semibold ${currentView === tab.id ? "text-white/62" : "text-[#86868b]"}`}>
              {tab.helper}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CurrentPriceResultCard({
  productName,
  profit,
  warning,
  verdictLabel,
  verdictClassName,
  compact = false,
}: {
  productName: string;
  profit: number;
  warning: string;
  verdictLabel: string;
  verdictClassName: string;
  compact?: boolean;
}) {
  return (
    <div className={`${compact ? "mt-5" : ""} rounded-[28px] bg-[#1d1d1f] p-5 text-white sm:p-7`}>
      <p className="text-sm font-semibold text-white/60">지금 가격으로 보면</p>
      <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-lg font-semibold tracking-[-0.02em] text-white/80">{productName}</p>
          <h2 className="mt-1 text-[44px] font-semibold leading-none tracking-[-0.055em] sm:text-[56px]">
            {formatWon(profit)}
          </h2>
          <p className="mt-2 text-[17px] font-semibold text-white/70">한 잔에 남아요</p>
        </div>
        <div className={`w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${verdictClassName}`}>
          {verdictLabel}
        </div>
      </div>
      <p className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold leading-6 text-white/78">
        {warning}
      </p>
    </div>
  );
}

function PriceDecisionCard({ decision }: { decision: PriceDecisionSummary }) {
  const isPositive = decision.monthlyProfitDelta >= 0;

  return (
    <div className="mt-4 rounded-[28px] border border-[#c7d3e3] bg-[#f8fbff] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-[#0b2545]">추천 검토가</p>
          <p className="mt-1 text-[34px] font-black leading-none tracking-[-0.055em] text-[#061b31]">{formatWon(decision.recommendedReviewPrice)}</p>
        </div>
        <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-black ${isPositive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
          {decision.summary}
        </span>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <SimpleMetric label="현재 월 이익" value={formatWon(decision.currentMonthlyProfit)} />
        <SimpleMetric label="변경 후 월 이익" value={formatWon(decision.projectedMonthlyProfit)} />
        <SimpleMetric label="줄어도 버틸 판매량" value={decision.breakEvenSalesDropRate === null ? "계산 불가" : `${formatPercent(decision.breakEvenSalesDropRate)} 감소까지`} />
        <SimpleMetric label="최대 이익점" value={formatWon(decision.bestProfitPrice)} />
        <SimpleMetric label="손익분기 판매량" value={decision.breakEvenMonthlyCups === null ? "계산 불가" : `${formatNumber(decision.breakEvenMonthlyCups)}잔`} />
        <SimpleMetric label="채널 비용 반영 후 잔당" value={formatWon(decision.selectedNetProfitPerCup)} />
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-[#64748d]">
        선택 가격 {formatWon(decision.selectedPrice)} · 월 {formatNumber(decision.currentMonthlyCups)}잔 기준 · {decision.sensitivityLabel} 가정입니다.
      </p>
    </div>
  );
}

function SaveCalculatorCard({ onSave, message }: { onSave?: () => void; message?: string }) {
  return (
    <div className="mt-4 rounded-[24px] border border-[#dce7f2] bg-[#f5faff] p-4 sm:hidden">
      <p className="text-sm font-semibold text-[#0b2545]">다시 보기</p>
      <p className="mt-1 text-sm leading-6 text-[#64748d]">{message}</p>
      <button
        type="button"
        onClick={onSave}
        className="mt-3 w-full rounded-2xl bg-[#0b2545] px-4 py-3 text-sm font-semibold text-white"
      >
        저장하고 링크 복사
      </button>
    </div>
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

function OwnerDemoCard({
  productName,
  salePrice,
  profit,
  decision,
  compact = false,
  showEyebrow = true,
}: {
  productName: string;
  salePrice: number;
  profit: number;
  decision?: PriceDecisionSummary;
  compact?: boolean;
  showEyebrow?: boolean;
}) {
  return (
    <div id="demo" className={`${compact ? "mt-4" : ""} w-full max-w-full rounded-[28px] bg-white p-5 shadow-[rgba(0,0,0,0.1)_0px_18px_50px_-34px]`}>
      {showEyebrow ? <p className="text-sm font-semibold text-[#6e6e73]">언제 쓰나요?</p> : null}
      <h3 className={`${showEyebrow ? "mt-2" : ""} text-2xl font-semibold leading-tight tracking-[-0.04em] text-[#1d1d1f]`}>가격표 만들기 전 30초 확인</h3>
      {decision ? (
        <div className="mt-4 rounded-2xl bg-[#eef5fb] p-4">
          <p className="text-xs font-black text-[#0b2545]">먼저 볼 결론</p>
          <p className="mt-1 text-xl font-black tracking-[-0.04em] text-[#061b31]">추천 검토가 {formatWon(decision.recommendedReviewPrice)}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#64748d]">선택가 기준 {decision.summary} · 판매량 {formatNumber(decision.expectedSalesIndex)}% 가정</p>
        </div>
      ) : null}
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

function PriceControlCard({
  selectedPrice,
  simulationRange,
  simulationPoints,
  selectedPoint,
  targetMarginRate,
  priceDecision,
  salesSensitivity,
  onChangeSalesSensitivity,
  includeChannelCosts,
  onToggleChannelCosts,
  onChangePrice,
  compact = false,
  onShowResult,
}: {
  selectedPrice: number;
  simulationRange: { minPrice: number; maxPrice: number };
  simulationPoints: PriceSimulationPoint[];
  selectedPoint: PriceSimulationPoint;
  targetMarginRate: number;
  priceDecision: PriceDecisionSummary;
  salesSensitivity: SalesSensitivity;
  onChangeSalesSensitivity: (sensitivity: SalesSensitivity) => void;
  includeChannelCosts: boolean;
  onToggleChannelCosts: (enabled: boolean) => void;
  onChangePrice: (price: number) => void;
  compact?: boolean;
  onShowResult?: () => void;
}) {
  return (
    <div className="max-w-full overflow-hidden rounded-[24px] border border-[#dce7f2] bg-[#f5f8fb] p-3 sm:rounded-[28px] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-[-0.01em] text-[#64748d]">가격 조정</p>
          <p className={`${compact ? "text-xl" : "text-2xl"} mt-1 font-semibold tracking-[-0.04em] text-[#1d1d1f]`}>
            현재 {formatWon(selectedPrice)}
          </p>
        </div>
        <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-[rgba(0,0,0,0.08)_0px_8px_24px_-18px]">
          <p className="text-[11px] font-bold text-[#86868b]">마진율</p>
          <p className="text-sm font-black text-[#0b2545]">{formatPercent(selectedPoint.marginRate)}</p>
        </div>
      </div>

      <input
        type="range"
        min={simulationRange.minPrice}
        max={simulationRange.maxPrice}
        step={100}
        value={selectedPrice}
        onChange={(event) => onChangePrice(Number(event.target.value))}
        className="mt-4 w-full accent-[#0071e3]"
        aria-label="판매가를 움직여 마진율과 예상 판매량 확인"
      />
      <div className="mt-2 flex justify-between text-xs font-semibold text-[#86868b]">
        <span>{formatWon(simulationRange.minPrice)}</span>
        <span>{formatWon(simulationRange.maxPrice)}</span>
      </div>

      <SensitivityControl selected={salesSensitivity} onChange={onChangeSalesSensitivity} />
      <ChannelCostToggle enabled={includeChannelCosts} onChange={onToggleChannelCosts} decision={priceDecision} />

      <div className="mt-3 rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-[#64748d]">
        <span className="text-[#0b2545]">{priceDecision.sensitivityLabel}</span> 기준, 선택 가격은 월 {formatWon(priceDecision.projectedMonthlyProfit)} 예상입니다.
      </div>

      <PriceSimulationChart points={simulationPoints} selectedPoint={selectedPoint} targetMarginRate={targetMarginRate} decision={priceDecision} />

      {compact ? (
        <button
          type="button"
          onClick={onShowResult}
          className="mt-4 w-full rounded-2xl bg-[#0071e3] px-4 py-3 text-sm font-semibold text-white sm:hidden"
        >
          조정한 가격으로 결과 보기
        </button>
      ) : null}
    </div>
  );
}

function SensitivityControl({ selected, onChange }: { selected: SalesSensitivity; onChange: (sensitivity: SalesSensitivity) => void }) {
  const options: Array<{ id: SalesSensitivity; label: string; helper: string }> = [
    { id: "low", label: "보수적", helper: "덜 줄어듦" },
    { id: "medium", label: "보통", helper: "기본" },
    { id: "high", label: "민감", helper: "많이 줄어듦" },
  ];

  return (
    <div className="mt-4 rounded-2xl bg-white p-3">
      <p className="text-xs font-black text-[#64748d]">가격을 올리면 판매량이 얼마나 줄까요?</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-2xl px-2 py-2 text-center transition ${selected === option.id ? "bg-[#0b2545] text-white" : "bg-[#f5f8fb] text-[#0b2545] ring-1 ring-[#dce7f2]"}`}
          >
            <span className="block text-xs font-black">{option.label}</span>
            <span className={`mt-0.5 block text-[10px] font-bold ${selected === option.id ? "text-white/65" : "text-[#64748d]"}`}>{option.helper}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChannelCostToggle({ enabled, onChange, decision }: { enabled: boolean; onChange: (enabled: boolean) => void; decision: PriceDecisionSummary }) {
  return (
    <div className="mt-3 rounded-2xl bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-[#64748d]">매장·포장·배달 비용도 같이 볼까요?</p>
          <p className="mt-1 text-[11px] font-bold leading-5 text-[#64748d]">
            카드 2%, 배달 15%, 배달 포장비 250원을 샘플로 반영합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(!enabled)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${enabled ? "bg-[#0b2545] text-white" : "bg-[#eef2f7] text-[#64748d]"}`}
          aria-pressed={enabled}
        >
          {enabled ? "반영 중" : "제외"}
        </button>
      </div>
      {enabled ? (
        <p className="mt-2 rounded-xl bg-[#f8fbff] px-3 py-2 text-xs font-bold text-[#0b2545]">
          선택가 기준 잔당 채널 비용 약 {formatWon(decision.channelCostPerCup)} 반영
        </p>
      ) : null}
    </div>
  );
}

function PriceSimulationChart({
  points,
  selectedPoint,
  targetMarginRate,
  decision,
}: {
  points: PriceSimulationPoint[];
  selectedPoint: PriceSimulationPoint;
  targetMarginRate: number;
  decision: PriceDecisionSummary;
}) {
  const chartWidth = 320;
  const chartHeight = 122;
  const padding = 18;
  const minPrice = Math.min(...points.map((point) => point.price), selectedPoint.price);
  const maxPrice = Math.max(...points.map((point) => point.price), selectedPoint.price);
  const minMargin = Math.min(0, ...points.map((point) => point.marginRate), selectedPoint.marginRate);
  const maxMargin = Math.max(targetMarginRate, ...points.map((point) => point.marginRate), selectedPoint.marginRate, 1);
  const minSales = Math.min(...points.map((point) => point.expectedSalesIndex), selectedPoint.expectedSalesIndex);
  const maxSales = Math.max(...points.map((point) => point.expectedSalesIndex), selectedPoint.expectedSalesIndex, 1);

  const xFor = (price: number) => padding + ((price - minPrice) / Math.max(1, maxPrice - minPrice)) * (chartWidth - padding * 2);
  const marginYFor = (marginRate: number) => chartHeight - padding - ((marginRate - minMargin) / Math.max(1, maxMargin - minMargin)) * (chartHeight - padding * 2);
  const salesYFor = (salesIndex: number) => chartHeight - padding - ((salesIndex - minSales) / Math.max(1, maxSales - minSales)) * (chartHeight - padding * 2);

  const marginCoords = points.map((point) => ({ x: xFor(point.price), y: marginYFor(point.marginRate) }));
  const salesCoords = points.map((point) => ({ x: xFor(point.price), y: salesYFor(point.expectedSalesIndex) }));
  const selectedX = xFor(selectedPoint.price);
  const currentX = xFor(points[0]?.price ?? selectedPoint.price);
  const recommendedX = xFor(decision.recommendedReviewPrice);
  const bestX = xFor(decision.bestProfitPrice);
  const selectedMarginY = marginYFor(selectedPoint.marginRate);
  const selectedSalesY = salesYFor(selectedPoint.expectedSalesIndex);
  const targetY = marginYFor(targetMarginRate);
  const marginDelta = selectedPoint.marginRate - targetMarginRate;
  const salesDelta = selectedPoint.expectedSalesIndex - 100;
  const pathFrom = (coords: Array<{ x: number; y: number }>) => coords.map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`).join(" ");

  return (
    <div className="mt-4 rounded-[22px] bg-white p-3 shadow-[rgba(0,0,0,0.06)_0px_12px_30px_-24px] sm:p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#0b2545]">실시간 가격 그래프</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#64748d]">가격을 올리면 마진율은 오르고, 예상 판매량은 줄어드는 가정 그래프입니다.</p>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold ${selectedPoint.meetsTarget ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
          {selectedPoint.meetsTarget ? "목표 달성" : "목표 미달"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#eef5fb] px-2.5 py-1 text-[#0b2545]"><span className="h-2 w-2 rounded-full bg-[#0b2545]" />마진율 상승선</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-800"><span className="h-2 w-2 rounded-full bg-[#f59e0b]" />예상 판매량 하락선</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-slate-600"><span className="h-2 w-2 border-t border-dashed border-slate-400" />목표 마진율</span>
      </div>

      <svg className="mt-2 h-[122px] w-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="가격 대비 마진율은 상승하고 예상 판매량은 하락하는 곡선 그래프">
        <line x1={padding} x2={chartWidth - padding} y1={targetY} y2={targetY} stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1.5" />
        <path d={pathFrom(marginCoords)} fill="none" stroke="#0b2545" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" />
        <path d={pathFrom(salesCoords)} fill="none" stroke="#f59e0b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <line x1={currentX} x2={currentX} y1={padding - 4} y2={chartHeight - padding + 4} stroke="#94a3b8" strokeDasharray="3 4" strokeWidth="1.2" />
        <line x1={recommendedX} x2={recommendedX} y1={padding - 4} y2={chartHeight - padding + 4} stroke="#10b981" strokeDasharray="5 3" strokeWidth="1.4" />
        <line x1={bestX} x2={bestX} y1={padding - 4} y2={chartHeight - padding + 4} stroke="#7c3aed" strokeDasharray="2 3" strokeWidth="1.4" />
        <line x1={selectedX} x2={selectedX} y1={padding - 4} y2={chartHeight - padding + 4} stroke="#0071e3" strokeWidth="1.5" />
        <circle cx={selectedX} cy={selectedMarginY} r="5" fill="#0b2545" stroke="white" strokeWidth="2" />
        <circle cx={selectedX} cy={selectedSalesY} r="5" fill="#f59e0b" stroke="white" strokeWidth="2" />
        <text x={padding} y={padding - 7} fill="#0b2545" fontSize="10" fontWeight="800">마진율 ↑</text>
        <text x={chartWidth - padding - 66} y={padding - 7} fill="#92400e" fontSize="10" fontWeight="800">판매량 ↓</text>
        <text x={Math.min(chartWidth - 58, Math.max(padding, recommendedX - 18))} y={chartHeight - 18} fill="#047857" fontSize="9" fontWeight="800">추천</text>
        <text x={Math.min(chartWidth - 58, Math.max(padding, bestX - 24))} y={chartHeight - 30} fill="#6d28d9" fontSize="9" fontWeight="800">최대 이익</text>
        <text x={padding} y={chartHeight - 4} fill="#64748d" fontSize="10" fontWeight="700">{formatWon(minPrice)}</text>
        <text x={chartWidth - padding - 44} y={chartHeight - 4} fill="#64748d" fontSize="10" fontWeight="700">{formatWon(maxPrice)}</text>
      </svg>

      <div className="mt-2 grid gap-2 rounded-2xl bg-[#f8fafc] p-3 text-[11px] font-bold text-[#64748d] sm:grid-cols-2">
        <p><span className="text-[#0b2545]">남색</span>: 가격이 오를수록 올라가는 마진율입니다.</p>
        <p><span className="text-[#92400e]">주황색</span>: 가격이 오를수록 내려가는 예상 판매량입니다.</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <GraphMetric label="선택 가격" value={formatWon(selectedPoint.price)} />
        <GraphMetric label="마진율" value={formatPercent(selectedPoint.marginRate)} strong />
        <GraphMetric label="예상 판매량" value={`${formatNumber(selectedPoint.expectedSalesIndex)}%`} />
        <GraphMetric label="한 잔 이익" value={formatWon(selectedPoint.profit)} />
        <GraphMetric label="원가율" value={formatPercent(selectedPoint.costRate)} />
        <GraphMetric label="목표 마진" value={formatPercent(targetMarginRate)} />
        <GraphMetric label="목표 마진 차이" value={`${marginDelta >= 0 ? "+" : ""}${formatPercent(marginDelta)}`} strong={marginDelta >= 0} />
        <GraphMetric label="판매량 변화" value={`${salesDelta >= 0 ? "+" : ""}${formatNumber(salesDelta)}%p`} />
        <GraphMetric label="최대 이익점" value={formatWon(decision.bestProfitPrice)} strong />
        <GraphMetric label="손익분기 판매량" value={decision.breakEvenMonthlyCups === null ? "계산 불가" : `${formatNumber(decision.breakEvenMonthlyCups)}잔`} />
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-[#64748d]">
        예상 판매량은 현재 판매가를 100으로 둔 참고 지수입니다. 실제 판매량은 상권, 시즌, 고객 반응에 따라 달라집니다.
      </p>
    </div>
  );
}

function GraphMetric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`${strong ? "bg-[#eef5fb]" : "bg-[#f8fbff]"} rounded-2xl px-3 py-2`}>
      <p className="text-[11px] font-bold text-[#64748d]">{label}</p>
      <p className="mt-0.5 whitespace-nowrap text-sm font-black tracking-[-0.02em] text-[#061b31]">{value}</p>
    </div>
  );
}

function ChannelCostCard({ includeChannelCosts, decision }: { includeChannelCosts: boolean; decision: PriceDecisionSummary }) {
  return (
    <div className="rounded-[28px] border border-[#e5edf5] bg-white p-4 shadow-[rgba(23,23,23,0.06)_0px_18px_44px_-28px] sm:p-6">
      <p className="text-sm font-bold text-[#0b2545]">채널 비용 샘플</p>
      <h3 className="mt-2 text-[22px] font-light leading-tight tracking-[-0.03em] text-[#061b31] sm:text-2xl">
        {includeChannelCosts ? `잔당 ${formatWon(decision.channelCostPerCup)}을 추가 비용으로 봅니다` : "채널 비용은 현재 제외했습니다"}
      </h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="매장" value="60%" />
        <Metric label="포장" value="25%" />
        <Metric label="배달" value="15%" />
        <Metric label="배달 추가 포장" value="250원" />
      </div>
      <p className="mt-4 rounded-xl bg-[#f8fbff] px-4 py-3 text-sm font-semibold leading-6 text-[#64748d]">
        포장비, 카드 수수료, 배달앱 수수료, 쿠폰 부담액은 매장마다 달라서 샘플 가정으로 표시합니다. 실제 입력 기능은 다음 저장형 버전에서 확장하면 됩니다.
      </p>
    </div>
  );
}

function IngredientImpactCard({ product }: { product: ProductCostingResult }) {
  const topLines = [...product.ingredientLines].sort((a, b) => b.cost - a.cost).slice(0, 3);

  return (
    <div className="rounded-[28px] border border-[#e5edf5] bg-white p-4 shadow-[rgba(23,23,23,0.06)_0px_18px_44px_-28px] sm:p-6">
      <p className="text-sm font-bold text-[#0b2545]">재료 가격 영향</p>
      <h3 className="mt-2 text-[22px] font-light leading-tight tracking-[-0.03em] text-[#061b31] sm:text-2xl">먼저 확인할 재료 {topLines[0]?.name ?? "원재료"}</h3>
      <div className="mt-4 space-y-2">
        {topLines.map((line) => (
          <div key={line.name} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm font-semibold">
            <span className="text-[#061b31]">{line.name}</span>
            <span className="shrink-0 text-[#0b2545]">잔당 {formatWon(line.cost)}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
        이 재료 단가가 오르면 같은 재료를 쓰는 메뉴부터 다시 계산하세요.
      </p>
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
          {risk.verdict === "risk" ? "위험" : risk.verdict === "watch" ? "마진율 주의" : "확인"}
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
                {menu.profitPerCup <= 0 ? "손실" : menu.marginRate < 20 ? "마진율 주의" : "양호"}
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
      label: "마진율 주의",
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
