import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, Sparkles, XCircle, Circle, StopCircle, Eye, Trash2 } from 'lucide-react';
import { useNovelStore } from '../../stores/useNovelStore';
import { useChapterPlanStore } from '../../stores/useChapterPlanStore';
import { useBatchGenerationStore } from '../../stores/useBatchGenerationStore';
import type { GeneratedChapter } from '../../stores/useBatchGenerationStore';
import ChapterPreviewModal from './ChapterPreviewModal';

export default function BatchGenerationPanel() {
  const { t } = useTranslation();
  const selectedNovelId = useNovelStore((s) => s.selectedNovelId);
  const plans = useChapterPlanStore((s) => s.plans);

  const {
    isGenerating, totalChapters, completedChapters, currentChapterNumber,
    streamingContent, chapterStatuses, generatedChapters,
    startBatchGeneration, stopBatchGeneration, reset,
    confirmChapter, discardChapter,
  } = useBatchGenerationStore();

  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(3);
  const [previewChapter, setPreviewChapter] = useState<GeneratedChapter | null>(null);

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

  const handleConfirm = (chapterId: number) => {
    if (!selectedNovelId) return;
    confirmChapter(selectedNovelId, chapterId);
  };

  const handleDiscard = (chapterId: number) => {
    if (!selectedNovelId || !confirm(t('batchPanel.discardConfirm'))) return;
    discardChapter(selectedNovelId, chapterId);
  };

  const progressPct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
  const hasContent = isGenerating || generatedChapters.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
        <h2 className="text-lg font-semibold text-gray-100">{t('batchPanel.title')}</h2>
        <div className="flex items-center gap-2">
          {isGenerating && (
            <span className="text-xs text-blue-400">
              {completedChapters}/{totalChapters}
            </span>
          )}
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
      </div>

      {/* Body */}
      <div className={`flex-1 overflow-hidden ${hasContent ? 'flex' : ''}`}>
        {/* Idle mode: full-width single column */}
        {!hasContent && (
          <div className="overflow-y-auto p-4 space-y-6 w-full">
            <section>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('batchPanel.rangeTitle')}</h3>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('batchPanel.rangeStart')}</label>
                    <input
                      type="number" min={1} value={rangeStart}
                      onChange={(e) => setRangeStart(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <span className="text-gray-500 mt-5">~</span>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">{t('batchPanel.rangeEnd')}</label>
                    <input
                      type="number" min={rangeStart} max={rangeStart + 19} value={rangeEnd}
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

            <section>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">{t('batchPanel.existingPlans')}</h3>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                {existingPlans.length === 0 ? (
                  <p className="text-sm text-gray-500">{t('batchPanel.noPlans')}</p>
                ) : (
                  <div className="space-y-2">
                    {existingPlans.map((plan) => (
                      <div key={plan.id} className="text-sm text-gray-300 border-b border-gray-700 pb-2 last:border-0 last:pb-0">
                        <span className="text-blue-400 font-medium">Ch.{plan.chapterRangeStart}-{plan.chapterRangeEnd}</span>
                        {plan.outline && <p className="text-gray-400 text-xs mt-0.5 truncate">{plan.outline}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Active mode: 3-column layout (progress | streaming | generated) */}
        {hasContent && (
          <>
            {/* Column 1 — Progress + Status */}
            <div className="w-1/5 min-w-[180px] border-r border-gray-700 flex flex-col overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-700 shrink-0">
                <h3 className="text-sm font-semibold text-gray-300">{t('batchPanel.progress')}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {/* Progress bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center mb-3">
                  {completedChapters}/{totalChapters} ({progressPct}%)
                </p>

                {/* Chapter status list */}
                <div className="space-y-0.5">
                  {chapterStatuses.map((cs) => (
                    <div
                      key={cs.chapterNumber}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                        cs.status === 'generating' ? 'bg-blue-900/20 text-blue-300' :
                        cs.status === 'done' ? 'text-green-400' :
                        cs.status === 'error' ? 'text-red-400' :
                        'text-gray-500'
                      }`}
                    >
                      {cs.status === 'done' ? <CheckCircle className="w-3 h-3 shrink-0" /> :
                       cs.status === 'generating' ? <Loader2 className="w-3 h-3 animate-spin shrink-0" /> :
                       cs.status === 'error' ? <XCircle className="w-3 h-3 shrink-0" /> :
                       <Circle className="w-3 h-3 shrink-0" />}
                      <span>Ch.{cs.chapterNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2 — Streaming "生成中" */}
            <div className="flex-1 border-r border-gray-700 flex flex-col overflow-hidden min-w-[300px]">
              <div className="px-3 py-2.5 border-b border-gray-700 shrink-0 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-300">{t('batchPanel.generatingTitle')}</h3>
                {isGenerating && currentChapterNumber && (
                  <span className="text-xs text-blue-400">Ch.{currentChapterNumber}</span>
                )}
                {isGenerating && (
                  <span className="inline-block w-1.5 h-3 bg-blue-400 animate-pulse ml-auto" />
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {isGenerating && currentChapterNumber ? (
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {streamingContent || (
                      <span className="text-gray-500 italic">{t('batchPanel.waiting')}</span>
                    )}
                  </pre>
                ) : !isGenerating && generatedChapters.length > 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">{t('batchPanel.batchComplete')}</p>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">{t('batchPanel.noGenerated')}</p>
                )}
              </div>
            </div>

            {/* Column 3 — Generated Chapters */}
            <div className="w-1/4 min-w-[240px] flex flex-col overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-700 shrink-0">
                <h3 className="text-sm font-semibold text-gray-300">
                  {t('batchPanel.generatedTitle')} ({generatedChapters.length})
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {generatedChapters.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-8">{t('batchPanel.noGenerated')}</p>
                ) : (
                  generatedChapters.map((gc) => (
                    <div
                      key={gc.chapterId}
                      className={`bg-gray-800 border rounded-lg p-2 transition-colors ${
                        gc.confirmed ? 'border-green-700' : 'border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-medium truncate ${gc.confirmed ? 'text-green-400' : 'text-gray-200'}`}>
                          Ch.{gc.chapterNumber} {gc.title}
                        </span>
                        {gc.confirmed && <CheckCircle className="w-3 h-3 text-green-400 shrink-0 ml-1" />}
                      </div>
                      <p className="text-xs text-gray-500 mb-1.5">{t('editor.words', { count: gc.wordCount })}</p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewChapter(gc)}
                          className="flex items-center gap-0.5 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          {t('batchPanel.preview')}
                        </button>
                        {!gc.confirmed ? (
                          <>
                            <button
                              onClick={() => handleConfirm(gc.chapterId)}
                              className="flex items-center gap-0.5 px-2 py-1 text-xs bg-green-700 hover:bg-green-600 text-white rounded transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" />
                              {t('batchPanel.confirm')}
                            </button>
                            <button
                              onClick={() => handleDiscard(gc.chapterId)}
                              className="flex items-center gap-0.5 px-2 py-1 text-xs bg-red-700 hover:bg-red-600 text-white rounded transition-colors ml-auto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-green-500 ml-auto">{t('batchPanel.confirmed')}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {generatedChapters.length > 0 && generatedChapters.every((gc) => gc.confirmed) && (
                <div className="px-3 py-1.5 border-t border-gray-700 shrink-0">
                  <p className="text-xs text-green-400 text-center">{t('batchPanel.allConfirmed')}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ChapterPreviewModal
        open={previewChapter !== null}
        chapter={previewChapter}
        onClose={() => setPreviewChapter(null)}
      />
    </div>
  );
}
