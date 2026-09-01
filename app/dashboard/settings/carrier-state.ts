export type CarrierActionState = {
  status: "idle" | "success" | "error";
  error?: "invalid" | "duplicate" | "unauthorized" | "unknown";
};

export const initialCarrierActionState: CarrierActionState = { status: "idle" };
