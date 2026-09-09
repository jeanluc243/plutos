export type CompleteSaleState = {
  status: "idle" | "error" | "success";
  error?: "invalid" | "insufficient" | "unauthorized" | "unknown";
};

export const initialCompleteSaleState: CompleteSaleState = { status: "idle" };
