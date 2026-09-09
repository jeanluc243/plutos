export type CreateClientState = {
  status: "idle" | "error" | "success";
  error?: "invalid" | "duplicate" | "unauthorized" | "unknown";
  client?: { id: string; name: string; phone: string };
};

export const initialCreateClientState: CreateClientState = { status: "idle" };
