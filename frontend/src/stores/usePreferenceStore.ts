import { create } from 'zustand';
import { getLanguage, setLanguage } from '../i18n';

interface PreferenceState {
  language: 'zh-CN' | 'en';
  switchLanguage: (lang: 'zh-CN' | 'en') => void;
}

export const usePreferenceStore = create<PreferenceState>((set) => ({
  language: getLanguage(),
  switchLanguage: (lang) => {
    setLanguage(lang);
    set({ language: lang });
  },
}));
