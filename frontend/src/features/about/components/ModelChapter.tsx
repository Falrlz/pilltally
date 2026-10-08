import type { ReactNode } from 'react'
import { useLocale, useLocalized } from '@/app/providers/localeContext'
import { aboutContent } from '@/content/about.content'
import type { ModelInfoState } from '@/features/about/hooks/useModelInfo'
import { formatDecimal } from '@/features/about/lib/formatMetric'
import { Chapter, ChapterLede } from './Chapter'
import { ThresholdChart } from './ThresholdChart'

// One table row: label on the left, value on the right
function SpecRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <tr className="border-b border-border align-top">
      <th scope="row" className="w-2/5 py-4 pr-6 font-normal text-muted">
        {label}
      </th>
      <td className="py-4 font-medium break-words">{children}</td>
    </tr>
  )
}

// Chapter 4: training and runtime settings, plus the threshold calibration chart.
// Fixed settings come from content; threshold, run name and date come from the server.
export function ModelChapter({ modelInfo }: { modelInfo: ModelInfoState }) {
  const { locale } = useLocale()
  const { model } = useLocalized(aboutContent)

  return (
    <Chapter heading={model.heading} subline={model.subline}>
      <ChapterLede>{model.lede}</ChapterLede>

      <table className="mt-8 w-full border-t border-foreground/80 text-left">
        <caption className="sr-only">{model.heading}</caption>
        <tbody>
          {model.specs.map((spec) => (
            <SpecRow key={spec.id} label={spec.label}>
              {spec.value}
            </SpecRow>
          ))}

          {modelInfo.status === 'success' && (
            <>
              <SpecRow label={model.liveLabels.threshold}>
                {formatDecimal(modelInfo.data.conf_threshold, locale)}{' '}
                <span className="font-normal text-muted">({model.liveLabels.thresholdNote})</span>
              </SpecRow>
              <SpecRow label={model.liveLabels.runName}>{modelInfo.data.run_name}</SpecRow>
              <SpecRow label={model.liveLabels.promotedAt}>{modelInfo.data.promoted_at}</SpecRow>
            </>
          )}
        </tbody>
      </table>

      {modelInfo.status === 'loading' && <p className="mt-4 text-muted">{model.loading}</p>}
      {modelInfo.status === 'error' && <p className="mt-4 text-danger">{model.error}</p>}

      <ThresholdChart />
    </Chapter>
  )
}
