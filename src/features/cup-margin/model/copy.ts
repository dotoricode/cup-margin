import type { MarginVerdict } from "./types";

export const verdictCopy: Record<
  MarginVerdict,
  {
    label: string;
    title: string;
    description: string;
    className: string;
  }
> = {
  healthy: {
    label: "좋음",
    title: "이 메뉴는 여유가 있어요",
    description: "현재 입력값 기준으로 한 잔당 남는 돈이 안정적입니다. 판매량을 더 키우거나 세트 메뉴로 확장해볼 수 있어요.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  watch: {
    label: "주의",
    title: "가격이나 비용을 다시 봐야 해요",
    description: "마진이 얇은 편입니다. 원재료 단가, 컵/포장비, 폐기율 또는 500원 인상 시나리오를 확인해보세요.",
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
  danger: {
    label: "위험",
    title: "팔수록 남는 돈이 부족해요",
    description: "현재 입력값 기준으로 손해이거나 마진이 매우 낮습니다. 판매가, 레시피, 포장/배달 구조를 먼저 점검하세요.",
    className: "border-rose-200 bg-rose-50 text-rose-900",
  },
};

export const calculatorTrustCopy = {
  short: "계산값은 기본적으로 이 기기에만 저장되고 서버로 보내지 않습니다.",
  detail: "계산값은 기본적으로 이 기기에만 저장됩니다. 서버 전송은 없고, 공유 링크를 만들 때만 계산값이 URL에 포함됩니다.",
  save: "저장하면 이 기기에 남습니다. 공유 링크 복사를 누를 때만 계산값이 URL에 포함되어 직원·세무사에게 같은 계산을 보낼 수 있어요.",
};

export const resultDecisionCopy = {
  keep: {
    label: "지금 가격 유지",
    title: "지금 가격은 유지해도 괜찮아요",
    description: "한 잔 이익과 마진율이 안정적입니다. 당장은 판매량을 지키는 쪽이 더 중요해 보여요.",
  },
  reviewPrice: {
    label: "인상 검토",
    title: "가격 인상을 검토해보세요",
    description: "남는 돈이 얇습니다. 300원 또는 500원 인상 시나리오를 보고 판매량이 얼마나 줄어도 괜찮은지 확인하세요.",
  },
  reviewCost: {
    label: "원가 우선 점검",
    title: "가격보다 원가 구조를 먼저 봐야 해요",
    description: "팔아도 남는 돈이 부족합니다. 원재료비, 컵·포장비, 폐기율, 배달 수수료를 먼저 낮출 수 있는지 확인하세요.",
  },
};

export const pricingPlans = [
  {
    name: "무료",
    price: "0원",
    caption: "카드 등록 없이 계산부터",
    features: ["메뉴 제한 없이 계산", "샘플값으로 바로 확인", "가격 변경 시뮬레이션", "최근 계산 3개까지 이 기기에 저장"],
  },
  {
    name: "베이직",
    price: "월 9,900원",
    caption: "베타 1개월 무료 · 자주 파는 메뉴 저장과 다음 달 비교",
    highlighted: true,
    badge: "추천",
    features: [
      "자주 파는 메뉴 저장으로 매번 다시 입력하지 않기",
      "가격 변경 전후 월 이익 비교하기",
      "돈 새는 메뉴 TOP 3로 이번 달 점검 순서 정하기",
      "직원·세무사와 공유할 링크와 CSV 내보내기",
      "원두·우유값이 오를 때 영향을 받는 메뉴 찾기",
      "다음 달 비교로 예상 판매량과 실제 판매량 차이 확인하기",
    ],
  },
  {
    name: "스탠다드",
    price: "월 19,900원",
    caption: "1~3매장 비교와 원재료 관리",
    features: [
      "매장 2~3개 통합 비교",
      "원재료 단가 변동이 이익에 미치는 영향 확인",
      "채널별 수익성 분석",
      "폐기·발주 기록으로 진짜 원가 자동 산출",
      "직원·세무사 공유 링크",
      "월 1회 사장님 가게 진단 PDF",
    ],
  },
];

export const operatingPacks = ["메뉴 마진팩", "가격 인상팩", "폐기·발주팩", "리뷰 체크팩", "알바 체크팩"];
