import idMessages from "./id.json";
import enMessages from "./en.json";

export type Locale = "id" | "en";

export const locales: Locale[] = ["id", "en"];
export const defaultLocale: Locale = "id";

export const messages = {
  id: idMessages,
  en: enMessages,
} as const;

export function getMessages(locale: Locale) {
  return messages[locale] ?? messages[defaultLocale];
}
