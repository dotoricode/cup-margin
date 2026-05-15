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
  group: "기본" | "비용" | "운영";
}> = [
  { id: "menuName", label: "메뉴명", placeholder: "예: 바닐라 라떼", helper: "계산할 메뉴 이름", group: "기본" },
  { id: "salePrice", label: "판매가", suffix: "원", helper: "고객이 실제로 내는 가격", group: "기본" },
  { id: "ingredientCost", label: "재료비", suffix: "원", helper: "원두, 우유, 시럽, 토핑 등", group: "비용" },
  { id: "packagingCost", label: "컵/포장비", suffix: "원", helper: "컵, 뚜껑, 빨대, 캐리어", group: "비용" },
  { id: "platformFeeRate", label: "배달·플랫폼 수수료", suffix: "%", helper: "매장 판매만 하면 0", group: "비용" },
  { id: "wasteRate", label: "폐기·로스 여유분", suffix: "%", helper: "재료 폐기나 제조 실패 여유", group: "비용" },
  { id: "laborCostPerCup", label: "한 잔당 인건비", suffix: "원", helper: "대략값으로 시작해도 괜찮아요", group: "운영" },
  { id: "extraCost", label: "기타 비용", suffix: "원", helper: "쿠폰, 서비스 토핑 등", group: "운영" },
  { id: "monthlyFixedCost", label: "월 고정비 배부", suffix: "원", helper: "임대료·관리비 중 이 메뉴에 나눠볼 금액", group: "운영" },
  { id: "expectedMonthlyCups", label: "월 예상 판매잔수", suffix: "잔", helper: "손익분기 계산에 사용", group: "운영" },
];

const proofItems = [
  { label: "무료 체험", value: "1개 메뉴", detail: "카드 등록 없이 바로 계산" },
  { label: "첫 유료안", value: "월 9,900원", detail: "소형 카페도 부담 적게" },
  { label: "계산 범위", value: "10개 항목", detail: "원가·수수료·폐기·고정비" },
];

const problemCards = [
  {
    title: "매출은 보이는데 남는 돈은 흐릿해요",
    body: "POS 매출만 보면 잘 팔리는 메뉴처럼 보여도, 컵·우유·폐기·수수료를 넣으면 이야기가 달라집니다.",
  },
  {
    title: "가격을 올려야 할지 감으로 결정해요",
    body: "500원만 올려도 월 이익이 얼마나 달라지는지 바로 보여주면 결정이 쉬워집니다.",
  },
  {
    title: "계산표는 만들었지만 계속 안 쓰게 돼요",
    body: "컵마진은 한 메뉴부터 작게 시작합니다. 복잡한 장부보다 ‘한 잔 남는 돈’을 먼저 보여줍니다.",
  },
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
    <main className="min-h-screen overflow-hidden bg-[#f7f9fc] text-[#061b31]">
      <section className="relative bg-white">
        <div className="absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_20%_10%,rgba(83,58,253,0.16),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(43,145,223,0.18),transparent_26%),linear-gradient(180deg,#ffffff_0%,#f6f9fc_100%)]" />
        <div className="relative mx-auto w-full max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
          <nav className="flex items-center justify-between rounded-2xl border border-[#e5edf5] bg-white/85 px-4 py-3 shadow-[rgba(50,50,93,0.12)_0px_16px_40px_-24px,rgba(0,0,0,0.08)_0px_8px_24px_-18px] backdrop-blur">
            <a href="#top" className="flex items-center gap-3" aria-label="컵마진 홈">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#533afd] text-sm font-black text-white shadow-[rgba(83,58,253,0.35)_0px_10px_24px_-12px]">컵</div>
              <div>
                <p className="text-[15px] font-black tracking-[-0.02em] text-[#061b31]">컵마진</p>
                <p className="text-xs text-[#64748d]">한 잔 단위 마진 노트</p>
              </div>
            </a>
            <div className="hidden items-center gap-6 text-sm font-semibold text-[#273951] md:flex">
              <a href="#why" className="hover:text-[#533afd]">왜 필요해요?</a>
              <a href="#calculator" className="hover:text-[#533afd]">무료 계산</a>
              <a href="#pricing" className="hover:text-[#533afd]">가격</a>
            </div>
            <a href="#calculator" className="rounded-lg bg-[#533afd] px-4 py-2.5 text-sm font-bold text-white shadow-[rgba(83,58,253,0.35)_0px_14px_28px_-14px] transition hover:bg-[#4434d4]">
              무료로 시작
            </a>
          </nav>

          <div id="top" className="grid items-center gap-12 pb-20 pt-16 lg:grid-cols-[1fr_0.86fr] lg:pb-28 lg:pt-24">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-md border border-[#d6d9fc] bg-white px-3 py-1.5 text-sm font-semibold text-[#533afd] shadow-sm">
                카드 등록 없이 1개 메뉴 무료 계산
              </div>
              <h1 className="mt-7 text-[42px] font-medium leading-[1.05] tracking-[-0.055em] text-[#061b31] sm:text-[62px] lg:text-[74px]">
                한 잔 팔면
                <span className="block">진짜 얼마 남는지</span>
                <span className="block text-[#533afd]">바로 보여드려요</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg font-normal leading-8 text-[#64748d] sm:text-xl">
                컵마진은 카페 사장님이 메뉴별 원가, 컵/포장비, 수수료, 폐기율을 넣고
                <strong className="font-semibold text-[#061b31]"> 한 잔당 남는 돈</strong>과 가격 인상 효과를 확인하는 쉬운 계산 노트입니다.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#calculator" className="rounded-lg bg-[#533afd] px-6 py-4 text-center text-base font-bold text-white shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px] transition hover:-translate-y-0.5 hover:bg-[#4434d4]">
                  내 메뉴 무료로 계산하기
                </a>
                <button
                  type="button"
                  onClick={() => setInput(DEFAULT_MARGIN_INPUT)}
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

            <HeroResultCard result={result} verdict={verdict} />
          </div>
        </div>
      </section>

      <section id="why" className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <SectionEyebrow>WeNote처럼 명확한 업무 하나부터</SectionEyebrow>
        <div className="mt-3 grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-end">
          <h2 className="max-w-4xl text-3xl font-medium leading-tight tracking-[-0.04em] text-[#061b31] sm:text-5xl">
            <span className="block">복잡한 카페 운영보다 먼저,</span>
            <span className="block">돈이 새는 메뉴를 찾습니다.</span>
          </h2>
          <p className="max-w-2xl text-lg leading-8 text-[#64748d]">
            상담 선생님이 위노트로 월말 기록 업무를 줄이듯, 컵마진은 카페 사장님이 가격·원가 판단에 쓰는 시간을 줄이는 쪽에 집중합니다.
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
                <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[#061b31] sm:text-4xl">내 메뉴 숫자 넣어보기</h2>
                <p className="mt-3 max-w-2xl text-base leading-7 text-[#64748d]">
                  정확한 회계값이 아니어도 괜찮아요. 대략값을 넣고 가격 판단의 출발점을 잡아보세요.
                </p>
              </div>
              <button type="button" onClick={() => setInput(emptyInput)} className="w-fit rounded-lg border border-[#d6d9fc] px-4 py-2 text-sm font-bold text-[#533afd] hover:bg-[#f7f7ff]">
                입력값 비우기
              </button>
            </div>

            {(["기본", "비용", "운영"] as const).map((group) => (
              <div key={group} className="border-b border-[#edf2f7] py-6 last:border-b-0 last:pb-0">
                <p className="mb-4 text-sm font-bold text-[#273951]">{group}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {fields
                    .filter((field) => field.group === group)
                    .map((field) => (
                      <label key={field.id} className="rounded-xl border border-[#d8e3ee] bg-white p-4 shadow-[rgba(23,23,23,0.04)_0px_8px_18px_-14px] transition focus-within:border-[#533afd] focus-within:bg-white focus-within:shadow-[rgba(83,58,253,0.18)_0px_14px_30px_-18px]">
                        <span className="flex items-center justify-between gap-3 text-sm font-bold text-[#273951]">
                          {field.label}
                          {field.suffix ? <span className="text-xs text-[#64748d]">{field.suffix}</span> : null}
                        </span>
                        <input
                          value={input[field.id]}
                          onChange={(event) => updateField(field.id, event.target.value)}
                          type={field.id === "menuName" ? "text" : "number"}
                          min={field.id === "menuName" ? undefined : 0}
                          placeholder={field.placeholder}
                          className="mt-3 w-full bg-transparent text-xl font-semibold tracking-[-0.02em] text-[#061b31] outline-none placeholder:text-[#aab7c4]"
                        />
                        <span className="mt-2 block text-xs leading-5 text-[#64748d]">{field.helper}</span>
                      </label>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <ResultPanel result={result} verdict={verdict} />
            <ScenarioPanel result={result} />
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
              MVP 단계에서는 결제보다 사용 의향 검증이 먼저입니다. 플랜 CTA는 관심 표현으로 두고, 실제 결제는 검증 후 연결합니다.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-6 ${plan.highlighted ? "border-[#b9b9f9] bg-white text-[#061b31]" : "border-white/10 bg-white/[0.07]"}`}>
                <p className={`text-sm font-bold ${plan.highlighted ? "text-[#533afd]" : "text-white/60"}`}>{plan.name}</p>
                <p className="mt-3 text-4xl font-light tracking-[-0.04em]">{plan.price}</p>
                <p className={`mt-2 text-sm ${plan.highlighted ? "text-[#64748d]" : "text-white/55"}`}>{plan.caption}</p>
                <ul className="mt-6 space-y-3 text-sm font-semibold">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2"><span className="text-[#15be53]">✓</span>{feature}</li>
                  ))}
                </ul>
                <a
                  href="#calculator"
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

function HeroResultCard({
  result,
  verdict,
}: {
  result: ReturnType<typeof calculateCupMargin>;
  verdict: (typeof verdictCopy)[keyof typeof verdictCopy];
}) {
  return (
    <div className="relative">
      <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-full bg-[#ffd7ef] blur-2xl lg:block" />
      <div className="relative rounded-[28px] border border-[#e5edf5] bg-white p-5 shadow-[rgba(50,50,93,0.25)_0px_30px_45px_-30px,rgba(0,0,0,0.1)_0px_18px_36px_-18px]">
        <div className="rounded-3xl bg-[#061b31] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#b9b9f9]">오늘의 샘플 결과</p>
              <h2 className="mt-3 text-3xl font-light tracking-[-0.04em]">{result.menuName}</h2>
            </div>
            <span className="rounded-md bg-[#15be53]/20 px-2 py-1 text-xs font-bold text-[#8bf0b1]">자동 계산</span>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Metric label="한 잔 남는 돈" value={formatWon(result.profitPerCup)} dark />
            <Metric label="마진율" value={formatPercent(result.marginRate)} dark />
            <Metric label="월 예상 이익" value={formatWon(result.monthlyProfit)} dark />
            <Metric label="고정비 회수" value={result.breakEvenCups ? `${formatNumber(result.breakEvenCups)}잔` : "계산 불가"} dark />
          </div>
          <div className={`mt-5 rounded-xl border px-4 py-4 ${verdict.className}`}>
            <p className="text-sm font-black">{verdict.label} · {verdict.title}</p>
            <p className="mt-1 text-sm leading-6 opacity-80">{verdict.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({
  result,
  verdict,
}: {
  result: ReturnType<typeof calculateCupMargin>;
  verdict: (typeof verdictCopy)[keyof typeof verdictCopy];
}) {
  return (
    <div className="rounded-3xl border border-[#e5edf5] bg-white p-6 shadow-[rgba(50,50,93,0.18)_0px_30px_45px_-34px,rgba(0,0,0,0.08)_0px_18px_36px_-24px]">
      <p className="text-sm font-bold text-[#533afd]">계산 결과</p>
      <h2 className="mt-2 text-3xl font-light tracking-[-0.04em] text-[#061b31]">{result.menuName} 컵마진</h2>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Metric label="판매가" value={formatWon(result.revenuePerCup)} />
        <Metric label="한 잔 총비용" value={formatWon(result.totalCostPerCup)} />
        <Metric label="한 잔 남는 돈" value={formatWon(result.profitPerCup)} emphasis />
        <Metric label="마진율" value={formatPercent(result.marginRate)} emphasis />
      </div>
      <div className={`mt-5 rounded-xl border px-4 py-4 ${verdict.className}`}>
        <p className="font-black">{verdict.title}</p>
        <p className="mt-1 text-sm leading-6 opacity-80">{verdict.description}</p>
      </div>
    </div>
  );
}

function ScenarioPanel({ result }: { result: ReturnType<typeof calculateCupMargin> }) {
  return (
    <div className="rounded-3xl border border-[#e5edf5] bg-white p-6 shadow-[rgba(23,23,23,0.06)_0px_18px_44px_-28px]">
      <h3 className="text-2xl font-light tracking-[-0.03em] text-[#061b31]">가격을 올리면?</h3>
      <div className="mt-4 space-y-3">
        {result.scenarios.map((scenario) => (
          <div key={scenario.label} className="rounded-2xl border border-[#e5edf5] bg-[#f8fbff] p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="font-bold text-[#533afd]">{scenario.label}</p>
              <p className="text-sm text-[#64748d]">판매가 {formatWon(scenario.salePrice)}</p>
            </div>
            <p className="mt-2 text-2xl font-light tracking-[-0.03em] text-[#061b31]">{formatWon(scenario.profitPerCup)} / 잔</p>
            <p className="text-sm text-[#64748d]">마진율 {formatPercent(scenario.marginRate)} · 월 {formatWon(scenario.monthlyProfit)}</p>
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

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-bold text-[#533afd]">{children}</p>;
}
