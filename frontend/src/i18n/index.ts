import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

const STORAGE_KEY = 'storyspark-language';

function detectLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'zh-CN' || stored === 'en') return stored;
  // Fall back to browser language, default zh-CN
  const browser = navigator.language;
  if (browser.startsWith('zh')) return 'zh-CN';
  if (browser.startsWith('en')) return 'en';
  return 'zh-CN';
}

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    en: { translation: en },
  },
  lng: detectLanguage(),
  fallbackLng: 'zh-CN',
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: 'zh-CN' | 'en') {
  localStorage.setItem(STORAGE_KEY, lang);
  i18n.changeLanguage(lang);
}

export function getLanguage(): 'zh-CN' | 'en' {
  return (localStorage.getItem(STORAGE_KEY) as 'zh-CN' | 'en') || 'zh-CN';
}

export default i18n;
