import { describe, expect, it } from "vitest";
import { calculateCupMargin, DEFAULT_MARGIN_INPUT } from "./calculateCupMargin";

const baseInput = {
  ...DEFAULT_MARGIN_INPUT,
  menuName: "아메리카노",
  salePrice: 4500,
  ingredientCost: 900,
  packagingCost: 200,
  platformFeeRate: 0,
  wasteRate: 0,
  laborCostPerCup: 300,
  extraCost: 100,
  monthlyFixedCost: 900000,
  expectedMonthlyCups: 900,
};

describe("calculateCupMargin", () => {
  it("한 잔당 변동비, 고정비 배부, 마진을 계산한다", () => {
    const result = calculateCupMargin(baseInput);

    expect(result.variableCostPerCup).toBe(1500);
    expect(result.allocatedFixedCostPerCup).toBe(1000);
    expect(result.totalCostPerCup).toBe(2500);
    expect(result.profitPerCup).toBe(2000);
    expect(result.marginRate).toBe(44.4);
    expect(result.monthlyProfit).toBe(1800000);
    expect(result.verdict).toBe("healthy");
  });

  it("플랫폼 수수료와 폐기율을 비용에 반영한다", () => {
    const result = calculateCupMargin({
      ...baseInput,
      salePrice: 5000,
      ingredientCost: 1500,
      packagingCost: 300,
      platformFeeRate: 10,
      wasteRate: 5,
      laborCostPerCup: 200,
      extraCost: 0,
      monthlyFixedCost: 0,
      expectedMonthlyCups: 100,
    });

    expect(result.variableCostPerCup).toBe(2600);
    expect(result.profitPerCup).toBe(2400);
    expect(result.marginRate).toBe(48);
  });

  it("가격 인상 시나리오를 만든다", () => {
    const result = calculateCupMargin(baseInput);

    expect(result.scenarios).toHaveLength(2);
    expect(result.scenarios[0]).toMatchObject({
      label: "+500원",
      salePrice: 5000,
      profitPerCup: 2500,
      marginRate: 50,
    });
  });

  it("마진이 낮거나 손해이면 위험으로 표시한다", () => {
    const result = calculateCupMargin({
      ...baseInput,
      salePrice: 2500,
      ingredientCost: 2200,
      monthlyFixedCost: 900000,
    });

    expect(result.profitPerCup).toBeLessThan(0);
    expect(result.verdict).toBe("danger");
  });
});
