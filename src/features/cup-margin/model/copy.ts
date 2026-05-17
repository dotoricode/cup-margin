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

export const pricingPlans = [
  {
    name: "무료",
    price: "0원",
    caption: "카드 등록 없이 계산부터",
    features: ["메뉴 3개까지 계산", "샘플값으로 바로 확인", "가격 변경 시뮬레이션 1개", "최근 계산 1개만 이 기기에 저장"],
  },
  {
    name: "베이직",
    price: "월 9,900원",
    caption: "저장하고 다음 달과 비교",
    highlighted: true,
    badge: "추천",
    features: [
      "메뉴 30개 저장",
      "가격 변경 시나리오 저장",
      "월간 마진 리포트",
      "PDF/CSV 내보내기",
      "원가 변경 영향 메뉴 표시",
      "다음 달 실제 판매량과 비교",
    ],
  },
  {
    name: "스탠다드",
    price: "월 19,900원",
    caption: "운영 리포트와 원재료 관리",
    features: [
      "메뉴 100개 또는 무제한 저장",
      "원재료 단가 관리",
      "채널별 수익성 분석",
      "폐기·발주 기록",
      "직원·세무사 공유 링크",
      "이번 달 마진 개선 체크리스트",
    ],
  },
];

export const operatingPacks = ["메뉴 마진팩", "가격 인상팩", "폐기·발주팩", "리뷰 체크팩", "알바 체크팩"];
