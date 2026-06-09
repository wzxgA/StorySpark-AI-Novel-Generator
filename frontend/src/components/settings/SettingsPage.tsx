import { useTranslation } from 'react-i18next';
import { usePreferenceStore } from '../../stores/usePreferenceStore';
import AIConfigPage from './AIConfigPage';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { language, switchLanguage } = usePreferenceStore();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center px-4 py-3 border-b border-gray-700 shrink-0">
        <h2 className="text-lg font-semibold text-gray-100">{t('settings.title')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* General Settings */}
        <section>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
            {t('settings.general')}
          </h3>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-xl">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-200 font-medium">
                  {t('settings.language')}
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  {language === 'zh-CN' ? '当前：中文' : 'Current: English'}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => switchLanguage('zh-CN')}
                  className={`px-3 py-1.5 text-sm rounded-l-md border transition-colors ${
                    language === 'zh-CN'
                      ? 'border-blue-500 bg-blue-900/40 text-blue-300'
                      : 'border-gray-600 bg-gray-750 text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  }`}
                >
                  {t('settings.languageZh')}
                </button>
                <button
                  onClick={() => switchLanguage('en')}
                  className={`px-3 py-1.5 text-sm rounded-r-md border transition-colors ${
                    language === 'en'
                      ? 'border-blue-500 bg-blue-900/40 text-blue-300'
                      : 'border-gray-600 bg-gray-750 text-gray-400 hover:text-gray-200 hover:border-gray-500'
                  }`}
                >
                  {t('settings.languageEn')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* AI Configuration */}
        <section>
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
            {t('settings.aiConfig')}
          </h3>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-xl">
            <AIConfigPage embedded />
          </div>
        </section>
      </div>
    </div>
  );
}
