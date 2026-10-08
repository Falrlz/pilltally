import { useLocalized } from '@/app/providers/localeContext'
import { aboutContent } from '@/content/about.content'
import type { ModelInfoState } from '@/features/about/hooks/useModelInfo'
import { Chapter, ChapterLede } from './Chapter'
import { CountAccuracyTable } from './CountAccuracyTable'
import { DetectionMetricsTable } from './DetectionMetricsTable'

// Chapter 5: test results (from the server) and what they mean
export function EvaluationChapter({ modelInfo }: { modelInfo: ModelInfoState }) {
  const { evaluation } = useLocalized(aboutContent)

  return (
    <Chapter heading={evaluation.heading} subline={evaluation.subline}>
      <ChapterLede>{evaluation.lede}</ChapterLede>

      {modelInfo.status === 'loading' && <p className="mt-8 text-muted">{evaluation.loading}</p>}
      {modelInfo.status === 'error' && <p className="mt-8 text-danger">{evaluation.error}</p>}

      {modelInfo.status === 'success' && (
        <>
          <h3 className="mt-10 mb-3 font-semibold">{evaluation.countHeading}</h3>
          <CountAccuracyTable info={modelInfo.data} />

          <h3 className="mt-12 mb-3 font-semibold">{evaluation.detectionHeading}</h3>
          <DetectionMetricsTable info={modelInfo.data} />

          {/* What the numbers mean, including the weak spots */}
          <p className="mt-10 max-w-[62ch] border-l-4 border-primary pl-4 leading-relaxed text-muted">
            {evaluation.note}
          </p>
        </>
      )}
    </Chapter>
  )
}
