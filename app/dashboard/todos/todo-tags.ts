export const TODO_TAGS = [
  "general",
  "client",
  "supplier",
  "finance",
  "project",
  "administrative",
] as const;

export type TodoTag = (typeof TODO_TAGS)[number];

export function isTodoTag(value: string): value is TodoTag {
  return (TODO_TAGS as readonly string[]).includes(value);
}
