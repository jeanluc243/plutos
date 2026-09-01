export type CreateArticleState = {
  status: "idle" | "error" | "success";
  error?: "invalid" | "invalidImages" | "duplicate" | "unauthorized" | "unknown";
};

export const initialCreateArticleState: CreateArticleState = { status: "idle" };
