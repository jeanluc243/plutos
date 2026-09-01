export type CreateClientState = {
  status: "idle" | "error" | "success";
  error?: "invalid" | "duplicate" | "unauthorized" | "unknown";
};

export const initialCreateClientState: CreateClientState = { status: "idle" };
