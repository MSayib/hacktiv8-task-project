import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  settingsOpen: boolean;
  aboutOpen: boolean;
  modelSelectorOpen: boolean;

  toggleSidebar: () => void;
  setSidebarOpen: (value: boolean) => void;
  setSettingsOpen: (value: boolean) => void;
  setAboutOpen: (value: boolean) => void;
  setModelSelectorOpen: (value: boolean) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  settingsOpen: false,
  aboutOpen: false,
  modelSelectorOpen: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (value) => set({ sidebarOpen: value }),
  setSettingsOpen: (value) => set({ settingsOpen: value }),
  setAboutOpen: (value) => set({ aboutOpen: value }),
  setModelSelectorOpen: (value) => set({ modelSelectorOpen: value }),
}));
