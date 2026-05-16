export type SavedCalculatorState = {
  productId: string;
  selectedPrice: number;
  savedAt?: string;
};

export function buildCalculatorSharePath(state: Pick<SavedCalculatorState, "productId" | "selectedPrice">) {
  const params = new URLSearchParams();
  params.set("product", state.productId);
  params.set("price", String(Math.max(0, Math.round(state.selectedPrice))));
  return `/calculator?${params.toString()}`;
}

export function parseCalculatorSearch(search: string, knownProductIds: string[]): Pick<SavedCalculatorState, "productId" | "selectedPrice"> | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const productId = params.get("product");
  const price = Number(params.get("price"));

  if (!productId || !knownProductIds.includes(productId)) {
    return null;
  }

  return {
    productId,
    selectedPrice: Number.isFinite(price) && price > 0 ? Math.round(price) : 0,
  };
}

export function parseStoredCalculatorState(rawValue: string | null, knownProductIds: string[]): SavedCalculatorState | null {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as Partial<SavedCalculatorState>;
    if (!parsed.productId || !knownProductIds.includes(parsed.productId)) {
      return null;
    }

    return {
      productId: parsed.productId,
      selectedPrice: Number.isFinite(parsed.selectedPrice) && Number(parsed.selectedPrice) > 0 ? Math.round(Number(parsed.selectedPrice)) : 0,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : undefined,
    };
  } catch {
    return null;
  }
}
