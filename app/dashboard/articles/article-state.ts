export type CreateArticleState = {
  status: "idle" | "error" | "success";
  error?: "invalid" | "invalidImages" | "invalidCategory" | "duplicate" | "unauthorized" | "unknown";
};

export const initialCreateArticleState: CreateArticleState = { status: "idle" };
