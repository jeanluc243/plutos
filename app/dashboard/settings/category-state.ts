export type CategoryActionState = {
  status: "idle" | "success" | "error";
  error?: "invalid" | "duplicate" | "unauthorized" | "unknown";
};

export const initialCategoryActionState: CategoryActionState = { status: "idle" };
