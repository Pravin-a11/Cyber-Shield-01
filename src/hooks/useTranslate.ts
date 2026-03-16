import { useCallback } from 'react';
import en from "../translations/en.json";
import hi from "../translations/hi.json";
import ta from "../translations/ta.json";
import te from "../translations/te.json";
import kn from "../translations/kn.json";
import ml from "../translations/ml.json";
import fr from "../translations/fr.json";
import es from "../translations/es.json";
import de from "../translations/de.json";
import ja from "../translations/ja.json";
import zh from "../translations/zh.json";
import sa from "../translations/sa.json";
import ar from "../translations/ar.json";
import ru from "../translations/ru.json";
import pt from "../translations/pt.json";
import { useUIStore } from "@/store/uiStore";

const languages: Record<string, Record<string, string>> = {
  en, hi, ta, te, kn, ml, fr, es, de, ja, zh, sa, ar, ru, pt
};

export function useTranslate() {
  const { language } = useUIStore();

  const t = useCallback((key: string): string => {
    // Fallback to English if the language or key doesn't exist
    const langDict = languages[language] || languages['en'];
    return langDict[key] || languages['en'][key] || key;
  }, [language]);

  return { t, language };
}
