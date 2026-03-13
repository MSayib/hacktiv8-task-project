import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings, ModelParameters, ApiKeyOverride } from "@/types/settings";
import { DEFAULT_MODEL_ID } from "@/lib/constants";

const DEFAULT_PARAMETERS: ModelParameters = {
  temperature: 1.0,
  topK: 40,
  topP: 0.95,
  enabled: false,
};

const DEFAULT_API_KEY_OVERRIDE: ApiKeyOverride = {
  enabled: false,
  provider: "google",
  key: "",
};

interface SettingsState extends Settings {
  setModelId: (id: string) => void;
  setParameters: (params: Partial<ModelParameters>) => void;
  setApiKeyOverride: (override: Partial<ApiKeyOverride>) => void;
  setLocale: (locale: "id" | "en") => void;
  resetParameters: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      modelId: DEFAULT_MODEL_ID,
      parameters: DEFAULT_PARAMETERS,
      apiKeyOverride: DEFAULT_API_KEY_OVERRIDE,
      locale: "id",

      setModelId: (id) => set({ modelId: id }),

      setParameters: (params) =>
        set((state) => ({
          parameters: { ...state.parameters, ...params },
        })),

      setApiKeyOverride: (override) =>
        set((state) => ({
          apiKeyOverride: { ...state.apiKeyOverride, ...override },
        })),

      setLocale: (locale) => set({ locale }),

      resetParameters: () => set({ parameters: DEFAULT_PARAMETERS }),
    }),
    {
      name: "kodingbuddy-settings",
      partialize: (state) => ({
        modelId: state.modelId,
        parameters: state.parameters,
        locale: state.locale,
        // Note: apiKeyOverride NOT persisted for security (re-enter each session)
      }),
    }
  )
);
