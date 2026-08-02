import { ar, type Dictionary } from "@/dictionaries/ar";
import { en } from "@/dictionaries/en";
import type { Locale } from "./i18n";

const dictionaries: Record<Locale, Dictionary> = { ar, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? ar;
}

export type { Dictionary };
