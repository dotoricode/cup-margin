import { describe, expect, it } from "vitest";
import { buildCalculatorSharePath, parseCalculatorSearch, parseStoredCalculatorState } from "./calculatorPersistence";

const knownProductIds = ["americano", "financier"];

describe("calculator persistence helpers", () => {
  it("builds a shareable calculator path with compact query values", () => {
    expect(buildCalculatorSharePath({ productId: "americano", selectedPrice: 4300.4 })).toBe("/calculator?product=americano&price=4300");
  });

  it("parses a valid share link state", () => {
    expect(parseCalculatorSearch("?product=financier&price=3200", knownProductIds)).toEqual({
      productId: "financier",
      selectedPrice: 3200,
    });
  });

  it("rejects unknown products from query and storage", () => {
    expect(parseCalculatorSearch("?product=unknown&price=3200", knownProductIds)).toBeNull();
    expect(parseStoredCalculatorState('{"productId":"unknown","selectedPrice":3200}', knownProductIds)).toBeNull();
  });

  it("recovers stored state without throwing on bad JSON", () => {
    expect(parseStoredCalculatorState("not-json", knownProductIds)).toBeNull();
    expect(parseStoredCalculatorState('{"productId":"americano","selectedPrice":4500}', knownProductIds)).toEqual({
      productId: "americano",
      selectedPrice: 4500,
      savedAt: undefined,
    });
  });
});
