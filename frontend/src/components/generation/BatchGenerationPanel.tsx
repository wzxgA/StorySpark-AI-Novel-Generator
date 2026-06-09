import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, Sparkles, XCircle, Circle, StopCircle } from 'lucide-react';
import { useNovelStore } from '../../stores/useNovelStore';
import { useChapterPlanStore } from '../../stores/useChapterPlanStore';
import { useBatchGenerationStore } from '../../stores/useBatchGenerationStore';

export default function BatchGenerationPanel() {
  const { t } = useTranslation();
  const selectedNovelId = useNovelStore((s) => s.selectedNovelId);
  const plans = useChapterPlanStore((s) => s.plans);

  const {
    isGenerating, startChapter: storeStart, endChapter: storeEnd,
    totalChapters, completedChapters, currentChapterNumber,
    streamingContent, chapterStatuses,
    startBatchGeneration, stopBatchGeneration, reset,
  } = useBatchGenerationStore();

  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(3);

  // Load plans if needed
  const existingPlans = plans.filter(
    (p) => p.chapterRangeEnd >= rangeStart && p.chapterRangeStart <= rangeEnd,
  );

  const handleStart = () => {
    if (!selectedNovelId) return;
    if (rangeStart < 1 || rangeEnd < rangeStart || rangeEnd - rangeStart + 1 > 20) return;
    reset();
    startBatchGeneration(selectedNovelId, rangeStart, rangeEnd);
  };

  const handleStop = () => {
    stopBatchGeneration();
  };

  const progressPct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
        <h2 className="text-lg font-semibold text-gray-100">{t('batchPanel.title')}</h2>
        {isGenerating ? (
          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
          >
            <StopCircle className="w-4 h-4" />
            {t('batchPanel.stop')}
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={!selectedNovelId}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {t('batchPanel.start')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Range selector */}
        {!isGenerating && (
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              {t('batchPanel.rangeTitle')}
            </h3>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-xl">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t('batchPanel.rangeStart')}</label>
                  <input
                    type="number"
                    min={1}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <span className="text-gray-500 mt-5">~</span>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t('batchPanel.rangeEnd')}</label>
                  <input
                    type="number"
                    min={rangeStart}
                    max={rangeStart + 19}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(Math.min(rangeStart + 19, Math.max(rangeStart, parseInt(e.target.value) || rangeStart)))}
                    className="w-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <span className="text-xs text-gray-500 mt-5">
                  {rangeEnd - rangeStart + 1} {t('batchPanel.chapters')}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Existing plans */}
        {!isGenerating && (
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              {t('batchPanel.existingPlans')}
            </h3>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-xl">
              {existingPlans.length === 0 ? (
                <p className="text-sm text-gray-500">{t('batchPanel.noPlans')}</p>
              ) : (
                <div className="space-y-2">
                  {existingPlans.map((plan) => (
                    <div key={plan.id} className="text-sm text-gray-300 border-b border-gray-700 pb-2 last:border-0 last:pb-0">
                      <span className="text-blue-400 font-medium">
                        Ch.{plan.chapterRangeStart}-{plan.chapterRangeEnd}
                      </span>
                      {plan.outline && (
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{plan.outline}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Progress */}
        {isGenerating && (
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              {t('batchPanel.progress')}
            </h3>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-xl">
              {/* Progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-sm text-gray-300 text-center mb-4">
                {completedChapters} / {totalChapters} {t('batchPanel.chapters')} ({progressPct}%)
              </p>

              {/* Chapter status list */}
              <div className="space-y-1">
                {chapterStatuses.map((cs) => (
                  <div
                    key={cs.chapterNumber}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
                      cs.status === 'generating' ? 'bg-blue-900/20 text-blue-300' :
                      cs.status === 'done' ? 'text-green-400' :
                      cs.status === 'error' ? 'text-red-400' :
                      'text-gray-500'
                    }`}
                  >
                    {cs.status === 'done' ? <CheckCircle className="w-3.5 h-3.5" /> :
                     cs.status === 'generating' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                     cs.status === 'error' ? <XCircle className="w-3.5 h-3.5" /> :
                     <Circle className="w-3.5 h-3.5" />}
                    <span>Ch.{cs.chapterNumber}</span>
                    {cs.status === 'done' && (
                      <span className="text-xs text-gray-400 ml-auto">{cs.wordCount} {t('editor.words', { count: cs.wordCount }).replace(/\d+/, '').trim()}</span>
                    )}
                    {cs.status === 'generating' && (
                      <span className="text-xs text-blue-400 ml-auto">{t('batchPanel.generating')}</span>
                    )}
                    {cs.status === 'error' && (
                      <span className="text-xs text-red-400 ml-auto truncate max-w-40">{cs.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Streaming content preview */}
        {isGenerating && currentChapterNumber && (
          <section>
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              {t('batchPanel.currentChapter', { num: currentChapterNumber })}
            </h3>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-3xl max-h-80 overflow-y-auto">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {streamingContent || (
                  <span className="text-gray-500 italic">{t('batchPanel.waiting')}</span>
                )}
              </pre>
              {isGenerating && currentChapterNumber && (
                <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-0.5 align-middle" />
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
