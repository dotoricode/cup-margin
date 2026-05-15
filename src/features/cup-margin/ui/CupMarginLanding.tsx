"use client";

import { useMemo, useState } from "react";
import { calculateCupMargin, DEFAULT_MARGIN_INPUT } from "../model/calculateCupMargin";
import { operatingPacks, pricingPlans, verdictCopy } from "../model/copy";
import { formatNumber, formatPercent, formatWon } from "../model/formatters";
import type { CupMarginInput } from "../model/types";

const emptyInput: CupMarginInput = {
  menuName: "",
  salePrice: 0,
  ingredientCost: 0,
  packagingCost: 0,
  platformFeeRate: 0,
  wasteRate: 0,
  laborCostPerCup: 0,
  extraCost: 0,
  monthlyFixedCost: 0,
  expectedMonthlyCups: 300,
};

const fields: Array<{
  id: keyof CupMarginInput;
  label: string;
  suffix?: string;
  placeholder?: string;
  helper: string;
}> = [
  { id: "menuName", label: "메뉴명", placeholder: "예: 바닐라 라떼", helper: "계산할 메뉴 이름" },
  { id: "salePrice", label: "판매가", suffix: "원", helper: "고객이 실제로 내는 가격" },
  { id: "ingredientCost", label: "재료비", suffix: "원", helper: "원두, 우유, 시럽, 토핑 등" },
  { id: "packagingCost", label: "컵/포장비", suffix: "원", helper: "컵, 뚜껑, 빨대, 캐리어" },
  { id: "platformFeeRate", label: "배달·플랫폼 수수료", suffix: "%", helper: "매장 판매만 하면 0" },
  { id: "wasteRate", label: "폐기·로스 여유분", suffix: "%", helper: "재료 폐기나 제조 실패 여유" },
  { id: "laborCostPerCup", label: "한 잔당 인건비", suffix: "원", helper: "대략값으로 시작해도 괜찮아요" },
  { id: "extraCost", label: "기타 비용", suffix: "원", helper: "쿠폰, 서비스 토핑 등" },
  { id: "monthlyFixedCost", label: "월 고정비 배부", suffix: "원", helper: "임대료·관리비 중 이 메뉴에 나눠볼 금액" },
  { id: "expectedMonthlyCups", label: "월 예상 판매잔수", suffix: "잔", helper: "손익분기 계산에 사용" },
];

export function CupMarginLanding() {
  const [input, setInput] = useState<CupMarginInput>(DEFAULT_MARGIN_INPUT);
  const result = useMemo(() => calculateCupMargin(input), [input]);
  const verdict = verdictCopy[result.verdict];

  function updateField(id: keyof CupMarginInput, rawValue: string) {
    setInput((current) => ({
      ...current,
      [id]: id === "menuName" ? rawValue : Number(rawValue),
    }));
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff8ef] text-stone-950">
      <section className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8 lg:px-10">
        <div className="absolute inset-x-0 top-0 -z-0 h-72 bg-[radial-gradient(circle_at_top_left,#f7c873_0,transparent_34%),radial-gradient(circle_at_top_right,#f2994a_0,transparent_26%)] opacity-60" />
        <nav className="relative z-10 flex items-center justify-between rounded-full border border-white/70 bg-white/75 px-5 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6f3f1f] text-lg font-black text-white">컵</div>
            <div>
              <p className="text-sm font-black tracking-tight">컵마진</p>
              <p className="text-xs text-stone-500">CupMargin MVP</p>
            </div>
          </div>
          <a href="#calculator" className="rounded-full bg-stone-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-800">
            무료 계산하기
          </a>
        </nav>

        <div className="relative z-10 grid items-center gap-10 py-8 lg:grid-cols-[1fr_0.9fr] lg:py-14">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-amber-200 bg-white/80 px-4 py-2 text-sm font-bold text-amber-900 shadow-sm">
              카페 사장님을 위한 메뉴 마진 노트
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-black leading-[1.08] tracking-[-0.05em] text-stone-950 sm:text-6xl lg:text-7xl">
                <span className="block">한 잔 팔면,</span>
                <span className="block sm:whitespace-nowrap">진짜 얼마 남을까요?</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-stone-700 sm:text-xl">
                원두값, 우유값, 컵/뚜껑, 배달 수수료, 폐기율까지 넣으면 메뉴별 컵마진이 바로 보입니다.
                많이 팔리는 메뉴보다 <strong className="text-stone-950">진짜 남는 메뉴</strong>를 먼저 확인하세요.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#calculator" className="rounded-full bg-[#6f3f1f] px-6 py-4 text-center text-base font-black text-white shadow-lg shadow-amber-950/10 transition hover:-translate-y-0.5 hover:bg-[#583018]">
                무료로 1개 메뉴 계산하기
              </a>
              <button
                type="button"
                onClick={() => setInput(DEFAULT_MARGIN_INPUT)}
                className="rounded-full border border-stone-300 bg-white px-6 py-4 text-base font-black text-stone-900 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-500"
              >
                샘플값 채워보기
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["카드 등록 없음", "월 9,900원부터", "Vertical Slice MVP"].map((badge) => (
                <div key={badge} className="rounded-2xl border border-white bg-white/70 px-4 py-3 text-sm font-bold text-stone-700 shadow-sm">
                  {badge}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white bg-white/85 p-5 shadow-2xl shadow-amber-950/10 backdrop-blur">
            <div className="rounded-[1.5rem] bg-stone-950 p-6 text-white">
              <p className="text-sm font-bold text-amber-200">오늘의 샘플 결과</p>
              <h2 className="mt-3 text-3xl font-black">{result.menuName}</h2>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Metric label="한 잔 남는 돈" value={formatWon(result.profitPerCup)} dark />
                <Metric label="마진율" value={formatPercent(result.marginRate)} dark />
                <Metric label="월 예상 이익" value={formatWon(result.monthlyProfit)} dark />
                <Metric label="손익분기" value={result.breakEvenCups ? `${formatNumber(result.breakEvenCups)}잔` : "계산 불가"} dark />
              </div>
              <div className={`mt-5 rounded-2xl border px-4 py-4 ${verdict.className}`}>
                <p className="text-sm font-black">{verdict.label} · {verdict.title}</p>
                <p className="mt-1 text-sm leading-6 opacity-80">{verdict.description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="calculator" className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:px-10">
        <div className="rounded-[2rem] border border-amber-100 bg-white p-5 shadow-xl shadow-amber-950/5 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-amber-700">무료 계산기</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">내 메뉴 숫자 넣어보기</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">정확한 회계값이 아니어도 괜찮습니다. 대략값만 넣어도 가격 판단의 출발점이 생깁니다.</p>
            </div>
            <button type="button" onClick={() => setInput(emptyInput)} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-bold text-stone-600 hover:border-stone-400">
              입력값 비우기
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label key={field.id} className="group rounded-2xl border border-stone-200 bg-stone-50/70 p-4 transition focus-within:border-amber-400 focus-within:bg-white">
                <span className="flex items-center justify-between gap-3 text-sm font-black text-stone-900">
                  {field.label}
                  {field.suffix ? <span className="text-xs text-stone-400">{field.suffix}</span> : null}
                </span>
                <input
                  value={input[field.id]}
                  onChange={(event) => updateField(field.id, event.target.value)}
                  type={field.id === "menuName" ? "text" : "number"}
                  min={field.id === "menuName" ? undefined : 0}
                  placeholder={field.placeholder}
                  className="mt-3 w-full bg-transparent text-lg font-black outline-none placeholder:text-stone-300"
                />
                <span className="mt-2 block text-xs leading-5 text-stone-500">{field.helper}</span>
              </label>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-xl shadow-amber-950/5">
            <p className="text-sm font-black text-amber-700">계산 결과</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{result.menuName} 컵마진</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Metric label="판매가" value={formatWon(result.revenuePerCup)} />
              <Metric label="한 잔 총비용" value={formatWon(result.totalCostPerCup)} />
              <Metric label="한 잔 남는 돈" value={formatWon(result.profitPerCup)} emphasis />
              <Metric label="마진율" value={formatPercent(result.marginRate)} emphasis />
            </div>
            <div className={`mt-5 rounded-2xl border px-4 py-4 ${verdict.className}`}>
              <p className="font-black">{verdict.title}</p>
              <p className="mt-1 text-sm leading-6 opacity-80">{verdict.description}</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-xl shadow-amber-950/5">
            <h3 className="text-xl font-black">가격을 올리면?</h3>
            <div className="mt-4 space-y-3">
              {result.scenarios.map((scenario) => (
                <div key={scenario.label} className="rounded-2xl bg-amber-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-black">{scenario.label}</p>
                    <p className="text-sm text-stone-600">판매가 {formatWon(scenario.salePrice)}</p>
                  </div>
                  <p className="mt-2 text-2xl font-black text-stone-950">{formatWon(scenario.profitPerCup)} / 잔</p>
                  <p className="text-sm text-stone-600">마진율 {formatPercent(scenario.marginRate)} · 월 {formatWon(scenario.monthlyProfit)}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="rounded-[2rem] bg-stone-950 p-6 text-white sm:p-8">
          <p className="text-sm font-black text-amber-200">가격은 위노트식 저마찰 SaaS로</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">무료로 계산하고, 필요할 때 월 9,900원부터</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`rounded-3xl border p-5 ${plan.highlighted ? "border-amber-300 bg-amber-200 text-stone-950" : "border-white/10 bg-white/10"}`}>
                <p className="text-sm font-black opacity-70">{plan.name}</p>
                <p className="mt-2 text-3xl font-black">{plan.price}</p>
                <p className="mt-1 text-sm opacity-70">{plan.caption}</p>
                <ul className="mt-5 space-y-2 text-sm font-bold">
                  {plan.features.map((feature) => (
                    <li key={feature}>✓ {feature}</li>
                  ))}
                </ul>
                <a
                  href="#calculator"
                  className={`mt-5 block rounded-full px-4 py-3 text-center text-sm font-black transition ${
                    plan.highlighted ? "bg-stone-950 text-white hover:bg-stone-800" : "bg-white text-stone-950 hover:bg-amber-100"
                  }`}
                >
                  {plan.name === "무료 체험" ? "무료 계산 시작" : `${plan.name} 관심 있어요`}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1fr]">
          <div>
            <p className="text-sm font-black text-amber-700">앞으로 추가될 기능</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">마진 계산부터, 카페 운영 체크까지 하나씩 넓혀갑니다</h2>
            <p className="mt-4 leading-7 text-stone-600">
              컵마진은 먼저 메뉴 마진 계산으로 시작합니다. 사장님이 실제로 자주 쓰는 기능만 검증해서 발주, 폐기, 리뷰, 알바 체크를 운영팩으로 추가합니다.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {operatingPacks.map((pack) => (
              <div key={pack} className="rounded-3xl border border-amber-100 bg-white p-5 shadow-sm">
                <p className="text-lg font-black">{pack}</p>
                <p className="mt-2 text-sm leading-6 text-stone-500">검증 후 기능팩으로 추가</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, emphasis = false, dark = false }: { label: string; value: string; emphasis?: boolean; dark?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 ${dark ? "bg-white/10" : emphasis ? "bg-amber-100" : "bg-stone-50"}`}>
      <p className={`text-xs font-bold ${dark ? "text-white/60" : "text-stone-500"}`}>{label}</p>
      <p className={`mt-2 text-xl font-black ${dark ? "text-white" : "text-stone-950"}`}>{value}</p>
    </div>
  );
}
