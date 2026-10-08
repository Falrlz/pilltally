import { useLocale, useLocalized } from '@/app/providers/localeContext'
import { aboutContent, type DetectionMetricKey } from '@/content/about.content'
import { formatPercent } from '@/features/about/lib/formatMetric'
import type { ModelInfo } from '@/services/types'

const METRIC_KEYS: DetectionMetricKey[] = ['precision', 'recall', 'mAP50', 'mAP50-95']

// Box detection metrics on validation and test data
export function DetectionMetricsTable({ info }: { info: ModelInfo }) {
  const { locale } = useLocale()
  const { evaluation } = useLocalized(aboutContent)

  return (
    <table className="w-full text-left tabular-nums">
      <caption className="sr-only">{evaluation.detectionHeading}</caption>
      <thead>
        <tr className="border-b border-foreground/80 text-sm text-muted">
          <th scope="col" className="py-3 pr-4 pl-3 font-normal">
            {evaluation.detectionColumns.metric}
          </th>
          <th scope="col" className="px-3 py-3 text-right font-normal">
            {evaluation.detectionColumns.val}
          </th>
          <th scope="col" className="px-3 py-3 text-right font-normal">
            {evaluation.detectionColumns.test}
          </th>
        </tr>
      </thead>
      <tbody>
        {METRIC_KEYS.map((key) => (
          <tr key={key} className="border-b border-border">
            <th scope="row" className="py-3 pr-4 pl-3 font-normal">
              {evaluation.detectionMetrics[key]}
            </th>
            <td className="px-3 py-3 text-right">{formatPercent(info.val[key], locale)}</td>
            <td className="px-3 py-3 text-right">{formatPercent(info.test[key], locale)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
