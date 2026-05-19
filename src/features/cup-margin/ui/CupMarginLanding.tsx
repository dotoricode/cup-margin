"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  calculateMultiMenuMargin,
  calculatePriceChangeRisk,
  DEFAULT_MULTI_MENU_INPUT,
  type MenuMarginInput,
  type MenuMarginResult,
  type MultiMenuMarginInput,
  type MultiMenuMarginResult,
} from "../model/calculateMultiMenuMargin";
import { calculatorTrustCopy, resultDecisionCopy } from "../model/copy";
import { SaveCalculatorCard, MobileStickyResultBar } from "./CalculatorSavePanels";
import { MenuBreakdownPanel, PriceRiskPanel } from "./CalculatorDetailPanels";
import { formatNumber, formatPercent, formatWon } from "../model/formatters";
import { formatInputValue, parseNumberInput } from "../model/calculatorInputFormatters";
import { getMenuHealth } from "../model/menuHealth";

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

const quickStartInput: MultiMenuMarginInput = {
  monthlyFixedCost: 0,
  menus: [DEFAULT_MULTI_MENU_INPUT.menus[0]],
};

const menuFields: Array<{
  id: Exclude<keyof MenuMarginInput, "id" | "menuName">;
  label: string;
  suffix?: string;
  helper: string;
  compact?: boolean;
}> = [
  { id: "expectedMonthlyCups", label: "한 달 예상 판매 잔수", suffix: "잔", helper: "한 달 예상 판매량" },
  { id: "salePrice", label: "손님에게 받는 판매가", suffix: "원", helper: "고객 결제 가격" },
  { id: "ingredientCost", label: "원재료비", suffix: "원", helper: "원두·우유·시럽·토핑" },
  { id: "packagingCost", label: "컵·뚜껑·빨대·포장비", suffix: "원", helper: "컵·뚜껑·빨대·캐리어" },
  { id: "platformFeeRate", label: "배달앱 수수료", suffix: "%", helper: "매장 판매만 하면 0", compact: true },
  { id: "wasteRate", label: "폐기·실패 예상 비율", suffix: "%", helper: "남거나 실패하는 양", compact: true },
  { id: "laborCostPerCup", label: "한 잔 만드는 인건비", suffix: "원", helper: "대략값으로 시작" },
  { id: "extraCost", label: "쿠폰·서비스 등 기타 비용", suffix: "원", helper: "쿠폰·서비스 토핑" },
];

type MobileCalculatorView = "result" | "adjust" | "details";

type SavedMultiMenuState = {
  id: string;
  name: string;
  input: MultiMenuMarginInput;
  savedAt: string;
};

const multiMenuStorageKey = "cup-margin:multi-menu:recent:v1";


export function CupMarginLanding() {
  const [input, setInput] = useState<MultiMenuMarginInput>(() => cloneInput(quickStartInput));
  const [navOpen, setNavOpen] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState(quickStartInput.menus[0].id);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(true);
  const [priceDelta, setPriceDelta] = useState(500);
  const [volumeChangeRate, setVolumeChangeRate] = useState(-5);
  const [mobileCalculatorView, setMobileCalculatorView] = useState<MobileCalculatorView>("result");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [saveMessage, setSaveMessage] = useState(calculatorTrustCopy.detail);
  const [recentSavedCalculations, setRecentSavedCalculations] = useState<SavedMultiMenuState[]>([]);
  const [, setIsSampleMode] = useState(true);
  const [showFirstVisitHint, setShowFirstVisitHint] = useState(true);
  const result = useMemo(() => calculateMultiMenuMargin(input), [input]);
  const hasCalculatorInput = input.monthlyFixedCost > 0 || input.menus.some(hasMeaningfulMenuInput);
  const selectedMenu = result.menus.find((menu) => menu.id === selectedMenuId) ?? result.menus[0];
  const priceRisk = selectedMenu && hasCalculatorInput
    ? calculatePriceChangeRisk(selectedMenu, { priceDelta, volumeChangeRate })
    : null;
  const verdict = getPortfolioVerdict(result);
  const menuResultById = useMemo(() => new Map(result.menus.map((menu) => [menu.id, menu])), [result.menus]);

  useEffect(() => {
    const recentStates = readRecentMultiMenuStates();
    window.setTimeout(() => setRecentSavedCalculations(recentStates), 0);
    const sharedMultiState = parseSharedMultiMenuState(window.location.search);

    if (sharedMultiState) {
      window.setTimeout(() => {
        setInput(cloneInput(sharedMultiState.input));
        setSelectedMenuId(sharedMultiState.input.menus[0]?.id ?? "");
        setIsCalculatorOpen(true);
        setIsSampleMode(false);
        setSaveMessage("공유 링크로 저장한 계산을 불러왔어요.");
      }, 0);
      return;
    }

  }, []);

  useEffect(() => {
    const onboardingKey = "cup-margin:calculator:onboarding-seen:v1";
    const hasSeenOnboarding = window.localStorage.getItem(onboardingKey);

    if (!hasSeenOnboarding) {
      window.setTimeout(() => {
        setIsCalculatorOpen(true);
        setShowFirstVisitHint(true);
        document.getElementById("monthly-fixed-cost")?.focus();
      }, 0);
      window.localStorage.setItem(onboardingKey, "true");
    }
  }, []);

  function startOwnInput() {
    setInput(cloneInput(emptyInput));
    setSelectedMenuId(emptyInput.menus[0].id);
    setIsCalculatorOpen(true);
    setIsSampleMode(false);
    setShowFirstVisitHint(true);
    window.setTimeout(() => document.getElementById("monthly-fixed-cost")?.focus(), 80);
  }

  async function saveCalculatorState() {
    const savedState = buildSavedMultiMenuState(input);
    const nextStates = [savedState, ...recentSavedCalculations.filter((state) => state.id !== savedState.id)].slice(0, 3);
    const sharePath = buildMultiMenuSharePath(input);
    const shareUrl = `${window.location.origin}${sharePath}`;
    let storedLocally = false;

    setRecentSavedCalculations(nextStates);
    window.history.replaceState(null, "", sharePath);

    try {
      window.localStorage.setItem(multiMenuStorageKey, JSON.stringify(nextStates));
      storedLocally = true;
    } catch {
      storedLocally = false;
    }

    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(shareUrl);
      setSaveMessage(storedLocally
        ? "저장했고 공유 링크도 복사했어요. 이 기기에는 최근 계산 3개까지 남깁니다."
        : "공유 링크를 복사했어요. 단, 이 브라우저에서는 최근 계산 저장이 제한되어 주소 링크로 다시 열어주세요.");
    } catch {
      setSaveMessage(storedLocally
        ? "저장했어요. 주소창의 공유 링크를 직접 복사해 다시 열 수 있습니다."
        : "주소창에 공유 링크를 만들었어요. 이 브라우저에서는 저장과 자동 복사가 제한되어 주소를 직접 복사해주세요.");
    }
  }

  function loadSavedCalculatorState(savedState: SavedMultiMenuState) {
    setInput(cloneInput(savedState.input));
    setSelectedMenuId(savedState.input.menus[0]?.id ?? "");
    setIsCalculatorOpen(true);
    setIsSampleMode(false);
    setSaveMessage(`${savedState.name} 계산을 불러왔어요.`);
  }

  function resetToSampleInput() {
    setInput(cloneInput(DEFAULT_MULTI_MENU_INPUT));
    setSelectedMenuId(DEFAULT_MULTI_MENU_INPUT.menus[0].id);
    setIsCalculatorOpen(true);
    setIsSampleMode(true);
    setShowFirstVisitHint(false);
    setSaveMessage("9개 메뉴 샘플을 열었어요. 필요한 메뉴만 남기고 내 매장 값으로 바꿔보세요.");
  }

  function resetCalculatorInput() {
    setInput(cloneInput(emptyInput));
    setSelectedMenuId(emptyInput.menus[0].id);
    setIsCalculatorOpen(true);
    setIsSampleMode(false);
    setSaveMessage("입력값을 비웠어요. 월 운영비와 메뉴 1개부터 다시 넣어보세요.");
  }

  function selectMenuForPriceRisk(menuId: string, nextPriceDelta?: number) {
    setSelectedMenuId(menuId);
    setIsAdvancedOpen(true);
    if (typeof nextPriceDelta === "number") {
      setPriceDelta(nextPriceDelta);
    }
    window.setTimeout(() => {
      document.getElementById("price-risk-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function downloadCalculatorCsv() {
    const rows = [
      ["메뉴명", "판매가", "월 판매량", "한 잔 원가", "한 잔 순이익", "마진율", "월 예상 이익"],
      ...result.menus.map((menu) => [
        menu.menuName || "이름 없는 메뉴",
        String(menu.salePrice),
        String(menu.expectedMonthlyCups),
        String(menu.totalCostPerCup),
        String(menu.profitPerCup),
        `${menu.marginRate}%`,
        String(menu.monthlyProfit),
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cup-margin-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSaveMessage("CSV 파일을 내려받았어요. 저장은 별도 버튼으로 남길 수 있습니다.");
  }

  function updateFixedCost(rawValue: string) {
    setIsSampleMode(false);
    setInput((current) => ({ ...current, monthlyFixedCost: parseNumberInput(rawValue) }));
  }

  function updateMenuField(menuId: string, fieldId: keyof MenuMarginInput, rawValue: string) {
    setIsSampleMode(false);
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
    setIsSampleMode(false);
    const nextMenu = emptyMenu(input.menus.length + 1);
    setInput((current) => ({
      ...current,
      menus: [...current.menus, nextMenu],
    }));
    setSelectedMenuId(nextMenu.id);
  }

  function removeMenu(menuId: string) {
    setIsSampleMode(false);
    setInput((current) => ({
      ...current,
      menus: current.menus.length <= 1 ? current.menus : current.menus.filter((menu) => menu.id !== menuId),
    }));
  }

  return (
    <main className="cm-shell min-h-screen overflow-x-hidden text-[#061b31]">
      <section className="relative cm-gradient-hero">
        <div className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-8 lg:px-10">
          <nav className="cm-nav rounded-2xl px-3 py-3 sm:px-4">
            <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="컵마진 홈">
              <BrandMark />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-black tracking-[-0.02em] text-[#061b31]">컵마진</p>
                <p className="hidden text-xs text-[var(--cm-muted)] sm:block">카페 메뉴 손익 계산기</p>
              </div>
            </Link>
            <div className="hidden items-center gap-6 text-sm font-semibold text-[#273951] md:flex">
              <Link href="/calculator" className="hover:text-[#0b2545]">계산기</Link>
              <Link href="/#pricing" className="hover:text-[#0b2545]">요금</Link>
              <Link href="/#waitlist" className="hover:text-[#0b2545]">베타 무료 사용</Link>
            </div>
            <button
              type="button"
              onClick={() => setNavOpen((current) => !current)}
              className="cm-button-secondary inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-black md:hidden"
              aria-expanded={navOpen}
              aria-controls="mobile-navigation"
            >
              메뉴 <span aria-hidden="true">{navOpen ? "닫기" : "열기"}</span>
            </button>
            </div>
            {navOpen ? (
              <div id="mobile-navigation" className="soft-slide-in mt-3 grid origin-top gap-2 rounded-2xl bg-[#f5f8fb] p-2 text-sm font-bold text-[#273951] shadow-inner transition-all duration-300 ease-out md:hidden">
                <Link href="/calculator" className="cm-menu-item rounded-xl px-4 py-3" onClick={() => setNavOpen(false)}>계산기</Link>
                <Link href="/#pricing" className="cm-menu-item rounded-xl px-4 py-3" onClick={() => setNavOpen(false)}>요금</Link>
                <Link href="/#waitlist" className="cm-menu-item rounded-xl px-4 py-3" onClick={() => setNavOpen(false)}>베타 무료 사용</Link>
              </div>
            ) : null}
          </nav>
        </div>
      </section>

      <section id="calculator" className="pb-8">
        <div className="mx-auto mb-3 w-full max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="rounded-2xl border border-[#c7d3e3] bg-white px-4 py-3 shadow-[rgba(11,37,69,0.08)_0px_12px_28px_-18px]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black text-[#0b2545]">언제 쓰나요</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#061b31]">아메리카노 가격만 바꿔도 한 잔에 얼마 남는지 바로 봅니다.</h1>
                  <p className="mt-1 text-sm leading-6 text-[var(--cm-muted)]">처음에는 메뉴 1개와 필수 숫자만 보입니다. 여러 메뉴, 저장, CSV는 필요할 때 열어보세요.</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-[#0b2545]">{calculatorTrustCopy.detail}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={startOwnInput} className="cm-button-primary rounded-lg px-4 py-2 text-sm font-bold">내 메뉴 하나로 시작하기</button>
                  <button type="button" onClick={resetToSampleInput} className="cm-button-secondary rounded-lg px-4 py-2 text-sm font-bold">9개 메뉴 샘플 보기</button>
                  <button type="button" onClick={resetCalculatorInput} className="rounded-lg px-3 py-2 text-sm font-bold text-[var(--cm-muted)] hover:bg-[#f3f7fb]">입력 비우기</button>
                </div>
              </div>
            </div>
          </div>
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-10">
          <div className="order-2 rounded-3xl border border-[#e5edf5] bg-white p-5 shadow-[rgba(50,50,93,0.2)_0px_38px_60px_-42px,rgba(0,0,0,0.1)_0px_18px_36px_-24px] sm:p-6 lg:order-1">
            <div className="flex flex-col gap-4 border-b border-[#e5edf5] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <SectionEyebrow>무료 계산기</SectionEyebrow>
                <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[#061b31] sm:text-4xl">한 메뉴부터 빠르게 계산하기</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--cm-muted)]">
                  판매가, 원재료비, 컵·포장비, 월 판매량만 바꿔도 한 잔 이익과 월 이익이 바로 보입니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {isCalculatorOpen ? (
                  <details className="group relative w-full sm:w-auto">
                    <summary className="cm-button-secondary flex w-fit cursor-pointer list-none items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold marker:hidden">
                      여러 메뉴·저장 옵션
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-[#e5edf5] bg-white p-3 shadow-[rgba(11,37,69,0.12)_0px_16px_32px_-24px] sm:absolute sm:right-0 sm:z-20 sm:w-72">
                      <button type="button" onClick={addMenu} className="cm-button-primary w-fit rounded-lg px-4 py-2 text-sm font-bold">
                        + 메뉴 추가
                      </button>
                      <button type="button" onClick={saveCalculatorState} className="cm-button-secondary w-fit rounded-lg px-4 py-2 text-sm font-bold">
                        나중에 비교하려면 저장
                      </button>
                      <button type="button" onClick={downloadCalculatorCsv} className="w-fit rounded-lg px-3 py-2 text-sm font-bold text-[var(--cm-muted)] hover:bg-[#f3f7fb]">
                        엑셀로 보려면 CSV
                      </button>
                    </div>
                  </details>
                ) : (
                  <button type="button" onClick={startOwnInput} className="cm-button-primary w-fit rounded-lg px-4 py-2 text-sm font-bold">
                    + 내 메뉴 입력 시작
                  </button>
                )}
              </div>
            </div>

            {isCalculatorOpen ? (
              <div>
                {showFirstVisitHint ? (
                  <div className="cm-onboarding-pulse mt-5 rounded-2xl border border-[#9fc3ff] bg-[#eef6ff] px-4 py-3 text-sm font-bold leading-6 text-[#0b2545]">
                    처음엔 아메리카노 하나만 보세요. 판매가와 원가만 바꿔도 “한 잔에 얼마 남는지” 바로 계산됩니다.
                  </div>
                ) : null}
                <div className={`${showFirstVisitHint ? "mt-3" : "mt-5"} rounded-2xl border border-[#d8e3ee] bg-[#f8fbff] p-4 transition focus-within:border-[#0b2545] focus-within:bg-white`}>
              <p className="mb-3 text-xs font-black text-[#0b2545]">1단계 · 매달 빠지는 돈</p>
              <label className="block">
              <span className="flex items-center justify-between gap-3 text-sm font-bold text-[#273951]">
                월 고정 운영비
                <span className="text-xs text-[var(--cm-muted)]">원</span>
              </span>
              <input
                id="monthly-fixed-cost"
                value={formatInputValue(input.monthlyFixedCost)}
                onChange={(event) => updateFixedCost(event.target.value)}
                type="text"
                inputMode="numeric"
                placeholder="예: 1,200,000"
                className="mt-3 w-full bg-transparent text-3xl font-semibold tracking-[-0.04em] text-[#061b31] outline-none placeholder:text-[var(--cm-muted)]"
              />
              <span className="mt-2 block text-sm leading-6 text-[var(--cm-muted)]">
                {result.menus.length > 0
                  ? `임대료, 관리비, 고정 인건비처럼 매달 나가는 비용입니다. 전체 판매량 기준으로 잔당 ${formatWon(result.fixedCostPerCup)}씩 반영됩니다.`
                  : "월 판매잔수를 입력하면 운영비가 잔당 비용으로 자동 배분됩니다."}
              </span>
              </label>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {input.menus.map((menu, index) => {
                const menuResult = menuResultById.get(menu.id);
                const menuHealth = menuResult ? getMenuHealth(menuResult.marginRate, menuResult.profitPerCup) : null;

                return (
                <article id={`menu-input-${menu.id}`} key={menu.id} className="scroll-mt-6 rounded-2xl border border-[#e5edf5] bg-white p-4 shadow-[rgba(23,23,23,0.05)_0px_14px_30px_-20px]">
                  <div className="flex flex-col gap-3 border-b border-[#edf2f7] pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex-1">
                      <span className="text-xs font-bold text-[#0b2545]">2단계 · 메뉴 {index + 1} 이름</span>
                      <input
                        value={menu.menuName}
                        onChange={(event) => updateMenuField(menu.id, "menuName", event.target.value)}
                        type="text"
                        placeholder="예: 바닐라 라떼"
                        className="mt-1 w-full bg-transparent text-2xl font-semibold tracking-[-0.03em] text-[#061b31] outline-none placeholder:text-[var(--cm-muted)]"
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

                  {menuResult && menuHealth ? (
                    <div className="mt-4 grid gap-2 rounded-2xl bg-[#f8fbff] p-3 ring-1 ring-[#d8e3ee] sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-black text-[var(--cm-muted)]">한 잔 이익</p>
                        <p className="mt-1 text-lg font-black tracking-[-0.03em] text-[#061b31]">{formatWon(menuResult.profitPerCup)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-[var(--cm-muted)]">월 이익</p>
                        <p className="mt-1 text-lg font-black tracking-[-0.03em] text-[#061b31]">{formatWon(menuResult.monthlyProfit)}</p>
                      </div>
                      <div className="flex items-center sm:justify-end">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-black ${menuHealth.className}`}>{menuHealth.label}</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-black text-[#0b2545]">3단계 · 가격과 월 판매량</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {menuFields.slice(0, 2).map((field) => (
                          <MenuNumberField key={field.id} field={field} menu={menu} onChange={updateMenuField} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-black text-[#0b2545]">4단계 · 기본 원가</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {menuFields.slice(2, 4).map((field) => (
                          <MenuNumberField key={field.id} field={field} menu={menu} onChange={updateMenuField} />
                        ))}
                      </div>
                      <details className="mt-3 rounded-2xl bg-[#f8fbff] p-3 ring-1 ring-[#e5edf5]">
                        <summary className="cursor-pointer text-sm font-black text-[#0b2545]">
                          배달 수수료·폐기·인건비까지 자세히 입력
                        </summary>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {menuFields.slice(4).map((field) => (
                            <MenuNumberField key={field.id} field={field} menu={menu} onChange={updateMenuField} />
                          ))}
                        </div>
                      </details>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>

            {input.menus.length > 1 ? (
              <button type="button" onClick={addMenu} className="mt-5 w-full rounded-xl border border-dashed border-[#9fb3cc] bg-[#f3f7fb] px-4 py-4 text-sm font-black text-[#0b2545] transition hover:bg-[#e8f0f8]">
                + 메뉴 추가하기
              </button>
            ) : null}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(true)}
                className="mt-5 w-full rounded-2xl border border-[#c7d3e3] bg-[#f8fbff] px-5 py-5 text-left transition hover:border-[#0b2545] hover:bg-white"
              >
                <span className="block text-sm font-black text-[#0b2545]">내 카페 값으로 바꿔볼 수 있어요</span>
                <span className="mt-1 block text-sm leading-6 text-[var(--cm-muted)]">월 운영비와 메뉴별 판매량을 입력하면 오른쪽 결과가 바로 바뀝니다.</span>
              </button>
            )}
          </div>

          <div className="order-1 space-y-4 lg:order-2 lg:self-start">
            <div className="lg:sticky lg:top-4 lg:z-10">
              <ResultPanel result={result} selectedMenu={selectedMenu ?? null} verdict={verdict} hasCalculatorInput={hasCalculatorInput} />
            </div>
            <details
              open={isAdvancedOpen}
              onToggle={(event) => setIsAdvancedOpen(event.currentTarget.open)}
              className="rounded-3xl border border-[#e5edf5] bg-white p-4 shadow-[rgba(11,37,69,0.08)_0px_16px_36px_-28px]"
            >
              <summary className="cursor-pointer text-sm font-black text-[#0b2545]">
                가격 인상·메뉴별 비교·저장 더 보기
              </summary>
              <div className="mt-4 space-y-4">
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
                <MenuBreakdownPanel menus={result.menus} onSelectMenu={(menuId) => selectMenuForPriceRisk(menuId, 500)} hasCalculatorInput={hasCalculatorInput} />
                <SaveCalculatorCard onSave={saveCalculatorState} onExportCsv={downloadCalculatorCsv} message={saveMessage} recentStates={recentSavedCalculations} onLoadState={loadSavedCalculatorState} />
              </div>
            </details>
          </div>
        </div>
      </section>
      <MobileStickyResultBar
        profit={selectedMenu?.profitPerCup ?? 0}
        marginRate={selectedMenu?.marginRate ?? 0}
        currentView={mobileCalculatorView}
        onChangeView={setMobileCalculatorView}
        ctaLabel={isAdvancedOpen ? "저장·복사" : "500원 올리면?"}
        ctaAriaLabel={isAdvancedOpen ? "계산 저장하고 공유 링크 복사" : "선택 메뉴 500원 인상 시나리오 열기"}
        ctaDisabled={!hasCalculatorInput}
        onCtaClick={isAdvancedOpen ? saveCalculatorState : () => selectMenuForPriceRisk(selectedMenu?.id ?? result.menus[0]?.id ?? "", 500)}
      />

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

function MenuNumberField({
  field,
  menu,
  onChange,
}: {
  field: (typeof menuFields)[number];
  menu: MenuMarginInput;
  onChange: (menuId: string, fieldId: keyof MenuMarginInput, rawValue: string) => void;
}) {
  return (
    <label className={`${field.compact ? "" : ""} rounded-xl border border-[#d8e3ee] bg-white p-4 transition focus-within:border-[#0b2545] focus-within:shadow-[rgba(11,37,69,0.16)_0px_14px_26px_-18px]`}>
      <span className="flex items-center justify-between gap-3 text-sm font-bold text-[#273951]">
        {field.label}
        {field.suffix ? <span className="text-xs text-[var(--cm-muted)]">{field.suffix}</span> : null}
      </span>
      <input
        value={formatInputValue(menu[field.id])}
        onChange={(event) => onChange(menu.id, field.id, event.target.value)}
        type="text"
        inputMode="numeric"
        placeholder="0"
        className="mt-3 w-full bg-transparent text-xl font-semibold tracking-[-0.02em] text-[#061b31] outline-none placeholder:text-[var(--cm-muted)]"
      />
      <span className="mt-2 block text-xs leading-5 text-[var(--cm-muted)]">{field.helper}</span>
    </label>
  );
}

function getResultDecision(menu: MenuMarginResult) {
  if (menu.profitPerCup <= 0 || menu.marginRate < 0.35) return resultDecisionCopy.reviewCost;
  if (menu.marginRate < 0.55 || menu.profitPerCup < 1000) return resultDecisionCopy.reviewPrice;
  return resultDecisionCopy.keep;
}

function ResultPanel({
  result,
  selectedMenu,
  verdict,
  hasCalculatorInput,
}: {
  result: MultiMenuMarginResult;
  selectedMenu: MenuMarginResult | null;
  verdict: PortfolioVerdict;
  hasCalculatorInput: boolean;
}) {
  const selectedFormula = selectedMenu
    ? `${formatWon(selectedMenu.salePrice)} - ${formatWon(selectedMenu.variableCostPerCup)} - ${formatWon(selectedMenu.fixedCostPerCup)} = ${formatWon(selectedMenu.profitPerCup)} / 잔`
    : null;
  const selectedMonthlyFormula = selectedMenu
    ? `${formatWon(selectedMenu.profitPerCup)} × ${formatNumber(selectedMenu.expectedMonthlyCups)}잔 = ${formatWon(selectedMenu.monthlyProfit)}`
    : null;
  const decision = selectedMenu ? getResultDecision(selectedMenu) : null;

  return (
    <div className="rounded-3xl border border-[#e5edf5] bg-white p-6 shadow-[rgba(50,50,93,0.18)_0px_30px_45px_-34px,rgba(0,0,0,0.08)_0px_18px_36px_-24px]">
      <p className="text-sm font-bold text-[#0b2545]">가게 전체 결과</p>
      <h2 className="mt-2 text-3xl font-light tracking-[-0.04em] text-[#061b31]">이번 달 예상 손익</h2>
      {selectedMenu && decision ? (
        <div className="mt-5 rounded-2xl border border-[#c7d3e3] bg-[#f8fbff] p-4">
          <p className="text-xs font-black text-[var(--cm-muted)]">선택 메뉴 한 줄 결론</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#0b2545] px-3 py-1.5 text-xs font-black text-white">{decision.label}</span>
            <p className="text-2xl font-light tracking-[-0.04em] text-[#061b31]">{decision.title}</p>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--cm-muted)]">
            {selectedMenu.menuName} 기준 한 잔에 {formatWon(selectedMenu.profitPerCup)} 남습니다. {decision.description}
          </p>
          <details className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-black leading-6 text-[#0b2545] ring-1 ring-[#d8e3ee]">
            <summary className="cursor-pointer text-sm font-black text-[#0b2545]">근거 수식 보기</summary>
            <p className="mt-3">판매가 - 변동비 - 잔당 고정비 배분 = 한 잔 이익</p>
            <p className="mt-1 text-lg tracking-[-0.03em] text-[#061b31]">{selectedFormula}</p>
            <p className="mt-1 text-xs font-bold text-[var(--cm-muted)]">월 예상 이익: {selectedMonthlyFormula}</p>
          </details>
        </div>
      ) : null}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Metric label="총 월매출" value={formatWon(result.totalRevenue)} />
        <Metric label="총 변동비" value={formatWon(result.totalVariableCost)} />
        <Metric label="월 운영비" value={formatWon(result.totalFixedCost)} />
        <Metric label="월 예상 이익" value={formatWon(result.totalProfit)} emphasis />
        <Metric label="잔당 고정비 배분" value={formatWon(result.fixedCostPerCup)} />
        <Metric label="가게 전체 마진율" value={formatPercent(result.blendedMarginRate)} emphasis />
      </div>
      <p className="mt-3 rounded-xl bg-[#f8fbff] px-4 py-3 text-xs font-bold leading-5 text-[var(--cm-muted)]">
        잔당 고정비 배분은 월 운영비를 전체 판매잔수로 나눈 값입니다. 가게 전체 마진율은 총 월매출에서 변동비와 월 운영비를 뺀 뒤 남는 비율입니다.
      </p>
      {hasCalculatorInput ? (
        <div className={`mt-5 rounded-xl border px-4 py-4 ${verdict.className}`}>
          <p className="font-black">{verdict.title}</p>
          <p className="mt-1 text-sm leading-6 opacity-80">{verdict.description}</p>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-[#c7d3e3] bg-[#f8fbff] px-4 py-4 text-[#273951]">
          <p className="font-black">아직 계산 전이에요</p>
          <p className="mt-1 text-sm leading-6 text-[var(--cm-muted)]">월 운영비, 판매잔수, 판매가와 원가를 입력하면 예상 손익이 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, emphasis = false, dark = false }: { label: ReactNode; value: string; emphasis?: boolean; dark?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${dark ? "bg-white/10" : emphasis ? "bg-[#f0f0ff]" : "bg-[#f8fbff]"}`}>
      <p className={`text-xs font-bold ${dark ? "text-white/60" : "text-[var(--cm-muted)]"}`}>{label}</p>
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

function buildSavedMultiMenuState(input: MultiMenuMarginInput): SavedMultiMenuState {
  const canonicalInput = canonicalizeMultiMenuInput(input);
  const primaryMenuName = canonicalInput.menus.find((menu) => menu.menuName.trim())?.menuName.trim() || "내 메뉴";
  const now = new Date().toISOString();
  const sharePath = buildMultiMenuSharePath(canonicalInput);

  return {
    id: sharePath,
    name: `${primaryMenuName} 외 ${Math.max(0, canonicalInput.menus.length - 1)}개`,
    input: canonicalInput,
    savedAt: now,
  };
}

function readRecentMultiMenuStates(): SavedMultiMenuState[] {
  const rawValue = window.localStorage.getItem(multiMenuStorageKey);
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue) as SavedMultiMenuState[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedMultiMenuState).slice(0, 3);
  } catch {
    return [];
  }
}

function isSavedMultiMenuState(value: SavedMultiMenuState | null | undefined): value is SavedMultiMenuState {
  return Boolean(value?.id && value.name && value.savedAt && value.input && Array.isArray(value.input.menus));
}

function buildMultiMenuSharePath(input: MultiMenuMarginInput) {
  const encoded = encodeState(canonicalizeMultiMenuInput(input));
  return `/calculator?state=${encoded}`;
}

function parseSharedMultiMenuState(search: string): SavedMultiMenuState | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const encoded = params.get("state");
  if (!encoded) return null;

  try {
    const parsed = JSON.parse(decodeState(encoded)) as MultiMenuMarginInput;
    if (!Array.isArray(parsed.menus)) return null;
    return {
      id: "shared",
      name: "공유 계산",
      input: {
        monthlyFixedCost: Number(parsed.monthlyFixedCost) || 0,
        menus: parsed.menus.map((menu, index) => ({ ...emptyMenu(index + 1), ...menu, id: String(menu.id || `shared-${index + 1}`) })),
      },
      savedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function canonicalizeMultiMenuInput(input: MultiMenuMarginInput): MultiMenuMarginInput {
  return {
    monthlyFixedCost: Number(input.monthlyFixedCost) || 0,
    menus: input.menus.map((menu, index) => ({
      id: `menu-${index + 1}`,
      menuName: menu.menuName.trim() || `메뉴 ${index + 1}`,
      salePrice: Number(menu.salePrice) || 0,
      ingredientCost: Number(menu.ingredientCost) || 0,
      packagingCost: Number(menu.packagingCost) || 0,
      platformFeeRate: Number(menu.platformFeeRate) || 0,
      wasteRate: Number(menu.wasteRate) || 0,
      laborCostPerCup: Number(menu.laborCostPerCup) || 0,
      extraCost: Number(menu.extraCost) || 0,
      expectedMonthlyCups: Number(menu.expectedMonthlyCups) || 0,
    })),
  };
}

function encodeState(input: MultiMenuMarginInput) {
  return btoa(encodeURIComponent(JSON.stringify(input))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeState(encoded: string) {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((encoded.length + 3) % 4);
  return decodeURIComponent(atob(padded));
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}


function hasMeaningfulMenuInput(menu: MenuMarginInput) {
  return (
    menu.salePrice > 0 ||
    menu.ingredientCost > 0 ||
    menu.packagingCost > 0 ||
    menu.platformFeeRate > 0 ||
    menu.wasteRate > 0 ||
    menu.laborCostPerCup > 0 ||
    menu.extraCost > 0 ||
    menu.expectedMonthlyCups > 0
  );
}

function cloneInput(input: MultiMenuMarginInput): MultiMenuMarginInput {
  return {
    monthlyFixedCost: input.monthlyFixedCost,
    menus: input.menus.map((menu) => ({ ...menu })),
  };
}
