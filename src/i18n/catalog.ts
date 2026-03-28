import enUS from "../locales/en-US.json";
import ptBR from "../locales/pt-BR.json";
import type { SupportedLanguage } from "../types/languages";

export interface TranslationTree {
  [key: string]: string | TranslationTree;
}

export const catalog: Record<SupportedLanguage, TranslationTree> = {
  "en-US": enUS as TranslationTree,
  "pt-BR": ptBR as TranslationTree
};
