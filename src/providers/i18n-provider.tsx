"use client";

import { useSyncExternalStore } from "react";
import { IntlProvider } from "next-intl";
import { useSettingsStore } from "@/stores/settings-store";
import { getMessages } from "@/i18n/config";

function subscribe(callback: () => void) {
  // no-op: we only need this to distinguish server vs client
  void callback;
  return () => {};
}

function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSettingsStore((s) => s.locale);
  const mounted = useMounted();

  const activeLocale = mounted ? locale : "id";

  return (
    <IntlProvider
      locale={activeLocale}
      messages={getMessages(activeLocale)}
      timeZone="Asia/Jakarta"
    >
      {children}
    </IntlProvider>
  );
}
