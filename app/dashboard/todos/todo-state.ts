export type CreateTodoState = {
  status: "idle" | "error" | "success";
  error?: "invalid" | "invalidPhoto" | "unauthorized" | "forbidden" | "unknown";
};

export const initialCreateTodoState: CreateTodoState = { status: "idle" };
