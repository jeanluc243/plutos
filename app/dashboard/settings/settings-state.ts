export type SaveSettingsError = "invalid" | "unauthorized" | "unknown";

export type SaveSettingsState = {
  status: "idle" | "success" | "error";
  error?: SaveSettingsError;
};

export const initialSaveSettingsState: SaveSettingsState = { status: "idle" };
