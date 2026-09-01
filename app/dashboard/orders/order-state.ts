export type CreateOrderState = {
  status: "idle" | "error" | "success";
  error?: "invalid" | "articleRequired" | "unauthorized" | "unknown";
};

export const initialCreateOrderState: CreateOrderState = { status: "idle" };
