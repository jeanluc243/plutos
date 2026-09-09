export type StockActionError =
  | "invalid"
  | "notFound"
  | "insufficient"
  | "unauthorized"
  | "unknown";

export type StockActionState =
  | { status: "idle"; error?: undefined }
  | { status: "success"; error?: undefined }
  | { status: "error"; error: StockActionError };

export const initialStockActionState: StockActionState = { status: "idle" };
