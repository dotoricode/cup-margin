import Image from "next/image";
import Link from "next/link";
import { calculatorTrustCopy, pricingPlans } from "../model/copy";
import { WaitlistMailtoForm } from "./WaitlistMailtoForm";

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

export function CupMarginHome() {
 return (
  <main className="cm-shell min-h-screen text-[#061b31]">
   <section className="relative overflow-hidden bg-white">
    <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
     <nav className="cm-nav mt-5 rounded-xl px-3 py-3 sm:px-4">
      <div className="flex min-w-0 items-center justify-between gap-3">
       <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="컵마진 홈">
        <BrandMark />
        <div className="min-w-0">
         <p className="truncate text-[15px] font-bold text-[#061b31]">컵마진</p>
         <p className="hidden text-xs text-[var(--cm-muted)] sm:block">카페 메뉴 손익 계산기</p>
        </div>
       </Link>
       <div className="hidden items-center gap-6 text-sm font-semibold text-[#273951] md:flex">
        <a href="#why">서비스 소개</a>
        <Link href="/calculator">바로 계산하기</Link>
        <a href="#pricing">요금 안내</a>
        <a href="#waitlist">베타 무료 사용</a>
       </div>
       <a href="#waitlist" className="cm-button-primary rounded-lg px-4 py-2.5 text-sm font-bold">베타 무료 사용</a>
      </div>
     </nav>

     <div id="top" className="grid items-center gap-12 pb-16 pt-12 lg:grid-cols-[1fr_0.95fr] lg:pb-24 lg:pt-20">
      <div className="max-w-3xl">
       <div className="inline-flex rounded-md border border-[#d8e3ee] bg-white px-3 py-1.5 text-sm font-semibold text-[#0b2545]">
        카페 사장님용 메뉴 손익 계산기
       </div>
       <h1 className="mt-6 text-[34px] font-bold leading-[1.24] text-[#111827] sm:text-[52px] sm:leading-[1.18] lg:text-[58px] lg:leading-[1.16] ">
        아메리카노 3,500원,
        <span className="block text-[#0b2545]">한 잔에 진짜 얼마 남나요?</span>
       </h1>
       <p className="mt-6 max-w-full text-lg font-normal leading-8 text-[var(--cm-muted)] sm:max-w-2xl">
        <span className="block">판매가·원가·월 판매량·월세를 넣으면</span>
        <span className="block">한 잔 순이익과 가격 인상 참고선을 바로 계산합니다.</span>
       </p>
       <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/calculator" className="cm-button-primary rounded-lg px-6 py-4 text-center text-base font-bold">
         내 메뉴로 30초 계산하기
        </Link>
        <a href="#demo" className="cm-button-secondary rounded-lg px-6 py-4 text-center text-base font-bold">
         샘플 결과 먼저 보기
        </a>
       </div>
       <p className="mt-4 text-sm font-semibold leading-6 text-[var(--cm-muted)]">
        ✓ {calculatorTrustCopy.short}
       </p>
      </div>
      <ProductPreview />
     </div>
    </div>
   </section>

   <section id="why" className="bg-[#f8fafc]">
    <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
    <SectionEyebrow>현실적인 카페 손익 구조</SectionEyebrow>
    <div className="mt-3 grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-end">
     <h2 className="max-w-4xl text-3xl font-bold leading-tight text-[#061b31] sm:text-5xl">
      <span className="block">한 메뉴가 아니라,</span>
      <span className="block">가게 전체 흐름으로 봅니다.</span>
     </h2>
     <p className="max-w-2xl text-lg leading-8 text-[var(--cm-muted)]">
      숫자는 단순하게, 한 가지 업무는 명확하게. 컵마진은 사장님이 가격·원가 판단에 쓰는 시간을 줄이는 데 집중합니다.
     </p>
    </div>
    <div className="mt-10 grid gap-4 md:grid-cols-3">
     {problemCards.map((card, index) => (
      <article key={card.title} className="cm-card rounded-2xl p-6">
       <span className="text-sm font-bold text-[#0b2545]">0{index + 1}</span>
       <h3 className="mt-5 text-2xl font-semibold leading-tight text-[#061b31]">{card.title}</h3>
       <p className="mt-4 text-[15px] leading-7 text-[var(--cm-muted)]">{card.body}</p>
      </article>
     ))}
    </div>
    </div>
   </section>

   <LandingTasteSimulation />

   <section id="pricing" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-8">
     <div className="grid gap-8 lg:grid-cols-[0.95fr_1fr] lg:items-end">
      <div>
       <p className="text-sm font-bold text-[#0b2545]">가격은 간단하게</p>
       <h2 className="mt-3 text-3xl font-bold leading-tight text-[#111827] sm:text-5xl">
        <span className="block">베타 1개월은 무료로 써보고,</span>
        <span className="block">저장·리포트가 필요할 때 선택하세요.</span>
       </h2>
      </div>
      <p className="max-w-2xl text-base leading-7 text-[var(--cm-muted)]">
       계산은 무료입니다. 베타 기간에는 저장·비교·리포트 후보 기능을 먼저 써보고, 실제로 도움이 된 기능에만 요금을 붙일 예정입니다.
      </p>
     </div>
     <div className="mt-10 grid gap-4 lg:grid-cols-3">
      {pricingPlans.map((plan) => (
       <div key={plan.name} className={`rounded-2xl border p-6 ${plan.highlighted ? "border-[#9fb3cc] bg-[#f8fafc] text-[#061b31]" : "border-[#e5e7eb] bg-white text-[#061b31]"}`}>
        <p className="text-sm font-bold text-[#0b2545]">{plan.name}</p>
        {"badge" in plan && plan.badge ? (
         <span className="mt-3 inline-flex rounded-md bg-[#0b2545] px-3 py-1 text-xs font-bold text-white shadow-[rgba(11,37,69,0.24)_0px_10px_22px_-14px]">
          {plan.badge}
         </span>
        ) : null}
        <p className="mt-3 text-4xl font-semibold ">{plan.price}</p>
        <p className="mt-2 text-sm text-[var(--cm-muted)]">{plan.caption}</p>
        <ul className="mt-6 space-y-3 text-sm font-semibold">
         {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2"><span className="text-[#008932]">✓</span>{feature}</li>
         ))}
        </ul>
        <a
         href={plan.name === "무료" ? "/calculator" : "#waitlist"}
         className="mt-7 block rounded-lg bg-[#0b2545] px-4 py-3 text-center text-sm font-bold !text-white shadow-[rgba(0,0,0,0.12)_0px_14px_28px_-18px] transition hover:bg-[#123a63]"
        >
         {plan.name === "무료" ? "바로 계산해보기" : `${plan.name} 베타 무료 사용 신청`}
        </a>
       </div>
      ))}
     </div>
    </div>
   </section>

   <section id="waitlist" className="mx-auto w-full max-w-7xl px-5 pb-10 sm:px-8 lg:px-10">
    <div className="grid gap-8 rounded-2xl border border-[#c7d3e3] bg-white p-6 shadow-[rgba(50,50,93,0.18)_0px_30px_60px_-38px] sm:p-8 lg:grid-cols-[0.82fr_1fr] lg:items-center">
     <div>
      <SectionEyebrow>베타 무료 사용 신청</SectionEyebrow>
      <h2 className="mt-3 text-3xl font-bold leading-tight text-[#061b31] sm:text-5xl">여러 메뉴 저장 기능을 베타 1개월 무료로 써보세요</h2>
      <p className="mt-4 leading-7 text-[var(--cm-muted)]">
       저장·비교·월간 리포트 후보 기능을 먼저 써보고, 다음 개선에 반영할 의견을 남겨주세요.
      </p>
     </div>
     <WaitlistMailtoForm />
    </div>
   </section>
  </main>
 );
}

function ProductPreview() {
 return (
  <div className="cm-card rounded-2xl p-4 sm:p-5" aria-label="컵마진 계산기 제품 화면 미리보기">
   <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
    <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] pb-3">
     <div>
      <p className="text-sm font-bold text-[#0b2545]">아메리카노</p>
      <p className="mt-1 text-xs text-[var(--cm-muted)]">판매가 3,500원 · 월 600잔</p>
     </div>
     <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">양호</span>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-3">
     <PreviewMetric label="한 잔 이익" value="1,880원" strong />
     <PreviewMetric label="월 예상 이익" value="112만원" strong />
     <PreviewMetric label="잔당 고정비" value="2,000원" />
     <PreviewMetric label="마진율" value="53.7%" />
    </div>
    <div className="mt-4 rounded-xl border border-[#d8e3ee] bg-white p-4">
     <div className="flex items-center justify-between gap-3 text-sm">
      <span className="font-semibold text-[#273951]">500원 올리면?</span>
      <span className="font-bold text-[#0b2545]">판매량 -5% 가정</span>
     </div>
     <div className="mt-3 h-2 rounded-sm bg-[#e5e7eb]">
      <div className="h-2 w-[68%] rounded-sm bg-[#1f4fbf]" />
     </div>
     <p className="mt-3 text-xs font-semibold leading-5 text-[var(--cm-muted)]">가격을 바꿨을 때 몇 잔까지 줄어도 괜찮은지 바로 봅니다.</p>
    </div>
   </div>
   <Link href="/calculator" className="cm-button-primary mt-4 inline-flex w-full justify-center rounded-lg px-5 py-3 text-sm font-bold">
    이 화면으로 바로 계산하기
   </Link>
  </div>
 );
}

function PreviewMetric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
 return (
  <div className="rounded-xl border border-[#e5e7eb] bg-white p-3">
   <p className="text-xs font-semibold text-[var(--cm-muted)]">{label}</p>
   <p className={`mt-1 text-xl font-bold text-[#111827] ${strong ? "text-[#0b2545]" : ""}`}>{value}</p>
  </div>
 );
}

function BrandMark() {
 return (
  <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#0b2545] shadow-[rgba(11,37,69,0.35)_0px_10px_24px_-12px]" aria-hidden="true">
   <Image src="/brand/cup-margin-logo.png" alt="" width={40} height={40} className="h-full w-full object-cover" />
  </span>
 );
}

function LandingTasteSimulation() {
 return (
  <section id="demo" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
   <div className="border-y border-[#e5e7eb] py-10">
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
     <div>
      <SectionEyebrow>확인 가능한 계산 결과</SectionEyebrow>
      <h2 className="mt-3 text-3xl font-bold leading-tight text-[#111827] sm:text-5xl">아메리카노 한 잔만 먼저 보면 이렇습니다.</h2>
      <p className="mt-4 text-base leading-7 text-[var(--cm-muted)]">허위 도입 숫자 대신 실제 계산 항목을 보여줍니다. 내 매장 값으로 바꾸면 같은 구조로 바로 다시 계산됩니다.</p>
      <Link href="/calculator" className="cm-button-primary mt-6 inline-flex rounded-lg px-5 py-3 text-sm font-bold">지금 내 카페로 계산하기 →</Link>
     </div>
     <div className="grid gap-3 sm:grid-cols-4">
      <Metric label="한 잔 이익" value="1,880원" emphasis />
      <Metric label="월 예상 이익" value="112만원" emphasis />
      <Metric label="잔당 고정비" value="2,000원" />
      <Metric label="500원 인상" value="-5% 가정" />
     </div>
    </div>
   </div>
  </section>
 );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
 return <p className="text-sm font-semibold text-[#0b2545]">{children}</p>;
}

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
 return (
  <div className={`rounded-xl p-4 ${emphasis ? "bg-[#f0f0ff]" : "bg-[#f8fbff]"}`}>
   <p className="text-xs font-bold text-[var(--cm-muted)]">{label}</p>
   <p className="mt-2 text-xl font-semibold text-[#061b31]">{value}</p>
  </div>
 );
}
