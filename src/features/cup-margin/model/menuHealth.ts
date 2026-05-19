export function getMenuHealth(marginRate: number, profitPerCup: number) {
  if (profitPerCup <= 0 || marginRate < 40) {
    return {
      label: "운영비 회수 안 됨",
      action: "가격·원가 우선 점검",
      description: "월 운영비까지 반영하면 손실 위험이 큽니다. 판매가, 원가, 폐기율부터 다시 보세요.",
      className: "bg-rose-100 text-rose-700",
    };
  }
  if (marginRate < 50) {
    return {
      label: "마진 얕음",
      action: "가격 조정 후보",
      description: "많이 남는 편은 아니므로 원가나 판매가를 다시 보는 것이 좋습니다.",
      className: "bg-orange-100 text-orange-800",
    };
  }
  if (marginRate < 60) {
    return {
      label: "원가 점검",
      action: "원가 점검 필요",
      description: "원가와 포장비가 오른 메뉴인지 먼저 확인하세요.",
      className: "bg-amber-100 text-amber-800",
    };
  }
  return {
    label: "양호",
    action: "양호",
    description: "현재 입력값 기준으로 여유가 있는 편입니다.",
    className: "bg-emerald-100 text-emerald-800",
  };
}
