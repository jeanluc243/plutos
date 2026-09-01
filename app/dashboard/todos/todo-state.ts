export type CreateTodoState = {
  status: "idle" | "error" | "success";
  error?: "invalid" | "unauthorized" | "unknown";
};

export const initialCreateTodoState: CreateTodoState = { status: "idle" };
