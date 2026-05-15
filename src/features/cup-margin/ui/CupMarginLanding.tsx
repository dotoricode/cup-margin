"use client";

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
  { id: "platformFeeRate", label: "플랫폼 수수료", suffix: "%", helper: "매장 판매만 하면 0", compact: true },
  { id: "wasteRate", label: "폐기율", suffix: "%", helper: "폐기·제조 실패 여유", compact: true },
  { id: "laborCostPerCup", label: "잔당 인건비", suffix: "원", helper: "대략값으로 시작" },
  { id: "extraCost", label: "기타 비용", suffix: "원", helper: "쿠폰·서비스 토핑" },
];

const proofItems = [
  { label: "계산 방식", value: "다중 메뉴", detail: "고정비는 한 번만 입력" },
  { label: "고정비 배부", value: "잔수 기준", detail: "많이 팔린 메뉴가 더 부담" },
  { label: "무료 체험", value: "카드 없음", detail: "샘플값으로 바로 확인" },
];

const problemCards = [
  {
    title: "하나의 메뉴만 보면 현실과 멀어져요",
    body: "아메리카노와 라떼는 판매량, 원가, 폐기율이 다릅니다. 메뉴별 판매잔수를 넣어야 전체 손익이 보입니다.",
  },
  {
    title: "임대료·관리비는 메뉴마다 따로 내지 않아요",
    body: "월 고정 운영비는 한 번만 입력하고, 전체 판매잔수로 나눠 메뉴별로 자동 배부합니다.",
  },
  {
    title: "잘 팔리는 메뉴가 꼭 많이 남지는 않아요",
    body: "총매출, 잔당 마진, 월 이익을 함께 보고, 가격을 바꿨을 때 판매량이 얼마나 줄어도 괜찮은지까지 확인합니다.",
  },
];

export function CupMarginLanding() {
  const [input, setInput] = useState<MultiMenuMarginInput>(() => cloneInput(DEFAULT_MULTI_MENU_INPUT));
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState(DEFAULT_MULTI_MENU_INPUT.menus[1]?.id ?? DEFAULT_MULTI_MENU_INPUT.menus[0].id);
  const [priceDelta, setPriceDelta] = useState(500);
  const [volumeChangeRate, setVolumeChangeRate] = useState(-5);
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
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-[#061b31]">
      <section className="relative bg-white">
        <div className="absolute inset-x-0 top-0 h-[660px] bg-[radial-gradient(circle_at_18%_8%,rgba(83,58,253,0.16),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(43,145,223,0.18),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f6f9fc_100%)]" />
        <div className="relative mx-auto w-full max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
          <nav className="flex items-center justify-between rounded-2xl border border-[#e5edf5] bg-white/88 px-4 py-3 shadow-[rgba(50,50,93,0.12)_0px_16px_40px_-24px,rgba(0,0,0,0.08)_0px_8px_24px_-18px] backdrop-blur">
            <a href="#top" className="flex items-center gap-3" aria-label="컵마진 홈">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#533afd] text-sm font-black text-white shadow-[rgba(83,58,253,0.35)_0px_10px_24px_-12px]">컵</div>
              <div>
                <p className="text-[15px] font-black tracking-[-0.02em] text-[#061b31]">컵마진</p>
                <p className="hidden text-xs text-[#64748d] sm:block">카페 메뉴 손익 계산기</p>
              </div>
            </a>
            <div className="hidden items-center gap-6 text-sm font-semibold text-[#273951] md:flex">
              <a href="#why" className="hover:text-[#533afd]">왜 다중 메뉴인가요?</a>
              <a href="#calculator" className="hover:text-[#533afd]">무료 계산</a>
              <a href="#pricing" className="hover:text-[#533afd]">가격</a>
            </div>
            <a href="#waitlist" className="rounded-lg bg-[#533afd] px-4 py-2.5 text-sm font-bold text-white shadow-[rgba(83,58,253,0.35)_0px_14px_28px_-14px] transition hover:bg-[#4434d4]">
              출시 알림 받기
            </a>
          </nav>

          <div id="top" className="grid items-center gap-12 pb-20 pt-16 lg:grid-cols-[1fr_0.92fr] lg:pb-28 lg:pt-24">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-md border border-[#d6d9fc] bg-white px-3 py-1.5 text-sm font-semibold text-[#533afd] shadow-sm">
                여러 메뉴를 한 번에 보는 무료 마진 계산기
              </div>
              <h1 className="mt-7 text-[40px] font-medium leading-[1.04] tracking-[-0.052em] text-[#061b31] sm:text-[60px] lg:text-[72px]">
                메뉴별 판매량까지
                <span className="block text-[#533afd]">진짜 남는 돈에</span>
                <span className="block">반영해드려요</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg font-normal leading-8 text-[#64748d] sm:text-xl">
                임대료·관리비·인건비는 한 번만 입력하세요. 컵마진이 판매량에 맞춰 고정비를 나누고, 가격을 바꿨을 때 몇 잔까지 줄어도 괜찮은지 보여드립니다.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#calculator" className="rounded-lg bg-[#533afd] px-6 py-4 text-center text-base font-bold text-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px] transition hover:-translate-y-0.5 hover:bg-[#4434d4]">
                  내 메뉴 무료로 계산하기
                </a>
                <button
                  type="button"
                  onClick={() => setInput(cloneInput(DEFAULT_MULTI_MENU_INPUT))}
                  className="rounded-lg border border-[#b9b9f9] bg-white px-6 py-4 text-base font-bold text-[#533afd] transition hover:-translate-y-0.5 hover:bg-[#f7f7ff]"
                >
                  샘플 결과 보기
                </button>
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
        </div>
      </section>

      <section id="why" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
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
              <span className="text-sm font-bold text-[#533afd]">0{index + 1}</span>
              <h3 className="mt-5 text-2xl font-light leading-tight tracking-[-0.03em] text-[#061b31]">{card.title}</h3>
              <p className="mt-4 text-[15px] leading-7 text-[#64748d]">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="calculator" className="bg-white py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_0.78fr] lg:px-10">
          <div className="rounded-3xl border border-[#e5edf5] bg-white p-5 shadow-[rgba(50,50,93,0.2)_0px_38px_60px_-42px,rgba(0,0,0,0.1)_0px_18px_36px_-24px] sm:p-8">
            <div className="flex flex-col gap-4 border-b border-[#e5edf5] pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <SectionEyebrow>무료 계산기</SectionEyebrow>
                <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[#061b31] sm:text-4xl">메뉴별 판매량으로 계산하기</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[#64748d]">
                  고정 운영비는 한 번만 입력하고, 각 메뉴의 월 판매잔수·원가·수수료를 넣어보세요.
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setInput(cloneInput(emptyInput))} className="w-fit rounded-lg border border-[#d6d9fc] px-4 py-2 text-sm font-bold text-[#533afd] hover:bg-[#f7f7ff]">
                  입력값 비우기
                </button>
                <button type="button" onClick={() => setInput(cloneInput(DEFAULT_MULTI_MENU_INPUT))} className="w-fit rounded-lg bg-[#533afd] px-4 py-2 text-sm font-bold text-white hover:bg-[#4434d4]">
                  샘플 채우기
                </button>
              </div>
            </div>

            <label className="mt-6 block rounded-2xl border border-[#d8e3ee] bg-[#f8fbff] p-5 transition focus-within:border-[#533afd] focus-within:bg-white">
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
                임대료, 관리비, 고정 인건비처럼 메뉴 하나에 직접 귀속하기 어려운 비용입니다. 전체 판매잔수 기준으로 잔당 {formatWon(result.fixedCostPerCup)}씩 배부됩니다.
              </span>
            </label>

            <div className="mt-6 space-y-4">
              {input.menus.map((menu, index) => (
                <article key={menu.id} className="rounded-2xl border border-[#e5edf5] bg-white p-4 shadow-[rgba(23,23,23,0.05)_0px_14px_30px_-20px] sm:p-5">
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

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {menuFields.map((field) => (
                      <label key={field.id} className={`${field.compact ? "" : ""} rounded-xl border border-[#d8e3ee] bg-white p-4 transition focus-within:border-[#533afd] focus-within:shadow-[rgba(83,58,253,0.16)_0px_14px_26px_-18px]`}>
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

            <button type="button" onClick={addMenu} className="mt-5 w-full rounded-xl border border-dashed border-[#b9b9f9] bg-[#f7f7ff] px-4 py-4 text-sm font-black text-[#533afd] transition hover:bg-[#eeeeff]">
              + 메뉴 추가하기
            </button>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
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

      <section id="pricing" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="rounded-[2rem] bg-[#1c1e54] p-6 text-white shadow-[rgba(3,3,39,0.24)_0px_40px_80px_-40px] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-bold text-[#b9b9f9]">가격은 Toss처럼 단순하게</p>
              <h2 className="mt-3 text-3xl font-medium leading-tight tracking-[-0.04em] sm:text-5xl">
                <span className="block">무료로 써보고,</span>
                <span className="block">필요할 때 월 9,900원부터.</span>
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-white/70">
              계산은 무료입니다. 메뉴 저장, 가격 변경 리스크 비교, 월간 리포트가 필요하면 출시 소식을 받아보세요. 결제는 사장님이 실제로 다시 쓰겠다고 느끼는 기능부터 연결합니다.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-6 ${plan.highlighted ? "border-[#b9b9f9] bg-white text-[#061b31]" : "border-white/10 bg-white/[0.07]"}`}>
                <p className={`text-sm font-bold ${plan.highlighted ? "text-[#533afd]" : "text-white/60"}`}>{plan.name}</p>
                {"badge" in plan && plan.badge ? (
                  <span className="mt-3 inline-flex rounded-full bg-[#533afd] px-3 py-1 text-xs font-black text-white shadow-[rgba(83,58,253,0.24)_0px_10px_22px_-14px]">
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
                  href={plan.name === "무료 체험" ? "#calculator" : "#waitlist"}
                  className={`mt-7 block rounded-lg px-4 py-3 text-center text-sm font-bold shadow-[rgba(0,0,0,0.12)_0px_14px_28px_-18px] transition ${
                    plan.highlighted ? "bg-[#533afd] !text-white hover:bg-[#4434d4]" : "bg-[#533afd] !text-white hover:bg-[#4434d4]"
                  }`}
                >
                  {plan.name === "무료 체험" ? "무료 계산 시작" : `${plan.name} 출시 알림 받기`}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="waitlist" className="mx-auto w-full max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
        <div className="grid gap-8 rounded-3xl border border-[#d6d9fc] bg-white p-6 shadow-[rgba(50,50,93,0.18)_0px_30px_60px_-38px] sm:p-8 lg:grid-cols-[0.82fr_1fr] lg:items-center">
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
                className="min-h-12 flex-1 rounded-lg border border-[#d8e3ee] bg-white px-4 text-base font-medium text-[#061b31] outline-none transition focus:border-[#533afd]"
                required
              />
              <button type="submit" className="rounded-lg bg-[#533afd] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4434d4]">
                출시 알림 받기
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#64748d]">
              {waitlistSubmitted ? "알림 신청 의향을 확인했어요. 실제 저장/발송 기능은 다음 단계에서 연결합니다." : "스팸 없이 컵마진 베이직 오픈 소식만 받는 흐름으로 설계할 예정입니다."}
            </p>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-24 sm:px-8 lg:px-10">
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
              <p className="text-sm font-bold text-[#b9b9f9]">다중 메뉴 손익 대시보드</p>
              <h2 className="mt-3 text-3xl font-light tracking-[-0.04em]">월 {formatWon(result.totalProfit)}</h2>
            </div>
            <span className="rounded-md bg-[#15be53]/20 px-2 py-1 text-xs font-bold text-[#8bf0b1]">자동 배부</span>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Metric label="총 월매출" value={formatWon(result.totalRevenue)} dark />
            <Metric label="총 판매잔수" value={`${formatNumber(result.totalMonthlyCups)}잔`} dark />
            <Metric label="잔당 고정비" value={formatWon(result.fixedCostPerCup)} dark />
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
      <p className="text-sm font-bold text-[#533afd]">전체 계산 결과</p>
      <h2 className="mt-2 text-3xl font-light tracking-[-0.04em] text-[#061b31]">이번 달 예상 손익</h2>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Metric label="총 월매출" value={formatWon(result.totalRevenue)} />
        <Metric label="총 변동비" value={formatWon(result.totalVariableCost)} />
        <Metric label="월 고정비" value={formatWon(result.totalFixedCost)} />
        <Metric label="월 예상 이익" value={formatWon(result.totalProfit)} emphasis />
        <Metric label="잔당 고정비" value={formatWon(result.fixedCostPerCup)} />
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
    <div className="rounded-3xl border border-[#d6d9fc] bg-[linear-gradient(180deg,#ffffff_0%,#f7f7ff_100%)] p-6 shadow-[rgba(83,58,253,0.18)_0px_28px_56px_-34px] transition-all duration-500 ease-out">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#533afd]">가격 변경 리스크</p>
          <h3 className="mt-2 text-2xl font-light tracking-[-0.03em] text-[#061b31]">몇 잔까지 줄어도 괜찮을까요?</h3>
        </div>
        <span className={`rounded-md px-2 py-1 text-xs font-bold ${risk.verdict === "risk" ? "bg-rose-100 text-rose-700" : risk.verdict === "watch" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
          {risk.verdict === "risk" ? "위험" : risk.verdict === "watch" ? "주의" : "확인"}
        </span>
      </div>

      <label className="mt-5 block text-sm font-bold text-[#273951]" htmlFor="risk-menu">
        검토할 메뉴
      </label>
      <select
        id="risk-menu"
        value={selectedMenu.id}
        onChange={(event) => onSelectMenu(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-xl border border-[#d8e3ee] bg-white px-4 text-base font-semibold text-[#061b31] outline-none transition focus:border-[#533afd]"
      >
        {menus.map((menu) => (
          <option key={menu.id} value={menu.id}>
            {menu.menuName || "이름 없는 메뉴"}
          </option>
        ))}
      </select>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="rounded-2xl border border-[#d8e3ee] bg-white p-4 transition focus-within:border-[#533afd]">
          <span className="flex items-center justify-between text-sm font-bold text-[#273951]">
            가격 변화 <span className="text-xs text-[#64748d]">원</span>
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
        <label className="rounded-2xl border border-[#d8e3ee] bg-white p-4 transition focus-within:border-[#533afd]">
          <span className="flex items-center justify-between text-sm font-bold text-[#273951]">
            판매량 변화 <span className="text-xs text-[#64748d]">%</span>
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
            className={`rounded-full px-3 py-1.5 text-xs font-black transition hover:-translate-y-0.5 ${volumeChangeRate === rate ? "bg-[#533afd] text-white shadow-[rgba(83,58,253,0.28)_0px_12px_22px_-14px]" : "bg-white text-[#533afd] ring-1 ring-[#d6d9fc]"}`}
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

      <div className="mt-4 rounded-2xl border border-[#d6d9fc] bg-white p-4">
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
        가격 변경은 한 번 보고 끝나는 계산이 아니라, 다음 달 실제 판매량과 비교해야 의미가 있습니다.
      </p>
      <a href="#waitlist" className="mt-3 block rounded-xl bg-[#533afd] px-4 py-3 text-center text-sm font-black text-white shadow-[rgba(83,58,253,0.3)_0px_16px_30px_-16px] transition duration-300 hover:-translate-y-0.5 hover:bg-[#4434d4]">
        베이직 출시 알림 받고 시나리오 저장하기
      </a>
    </div>
  );
}

function MenuBreakdownPanel({ menus, onSelectMenu }: { menus: MenuMarginResult[]; onSelectMenu: (menuId: string) => void }) {
  return (
    <div className="rounded-3xl border border-[#e5edf5] bg-white p-6 shadow-[rgba(23,23,23,0.06)_0px_18px_44px_-28px]">
      <h3 className="text-2xl font-light tracking-[-0.03em] text-[#061b31]">메뉴별 손익</h3>
      <div className="mt-4 space-y-3">
        {menus.map((menu) => (
          <div key={menu.id} className="rounded-2xl border border-[#e5edf5] bg-[#f8fbff] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-[#061b31]">{menu.menuName || "이름 없는 메뉴"}</p>
                <p className="mt-1 text-xs text-[#64748d]">{formatNumber(menu.expectedMonthlyCups)}잔 · 고정비 {formatWon(menu.fixedCostShare)} 배부</p>
              </div>
              <span className={`rounded-md px-2 py-1 text-xs font-bold ${menu.profitPerCup <= 0 ? "bg-rose-100 text-rose-700" : menu.marginRate < 20 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                {menu.profitPerCup <= 0 ? "손실" : menu.marginRate < 20 ? "주의" : "양호"}
              </span>
            </div>
            <p className="mt-3 text-2xl font-light tracking-[-0.03em] text-[#061b31]">{formatWon(menu.profitPerCup)} / 잔</p>
            <p className="text-sm leading-6 text-[#64748d]">월 {formatWon(menu.monthlyProfit)} · 마진율 {formatPercent(menu.marginRate)} · 가격 변경 전 판매량 리스크를 먼저 확인하세요</p>
            <button
              type="button"
              onClick={() => onSelectMenu(menu.id)}
              className="mt-3 w-full rounded-xl border border-[#d6d9fc] bg-white px-3 py-2 text-sm font-black text-[#533afd] transition hover:-translate-y-0.5 hover:bg-[#f7f7ff]"
            >
              이 메뉴 가격 리스크 보기
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
  return <p className="text-sm font-bold text-[#533afd]">{children}</p>;
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
      label: "주의",
      title: "팔리지만 여유가 얇은 구조예요",
      description: "전체 마진이 얇은 편입니다. 월 판매잔수가 큰 메뉴부터 원가와 가격 인상 시나리오를 확인해보세요.",
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
