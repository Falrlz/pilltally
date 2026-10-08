import { useLocale, useLocalized } from '@/app/providers/localeContext'
import { aboutContent, TEST_IMAGES, type CountMetricKey, type DatasetPrefix } from '@/content/about.content'
import { formatMae, formatPercent } from '@/features/about/lib/formatMetric'
import type { ModelInfo } from '@/services/types'

const DATASETS: DatasetPrefix[] = ['cp', 'kr', 'ul']

// The two key columns are highlighted
const KEY_METRICS: CountMetricKey[] = ['exact_match', 'within_1']

function formatCountMetric(key: CountMetricKey, value: number | undefined, locale: string): string {
  if (key === 'mae') {
    return formatMae(value, locale)
  }
  return formatPercent(value, locale)
}

interface Row {
  id: string
  name: string
  images: number
  // Metric names in model_info.json, e.g. "cp_mae" for one dataset or "mae" for all
  metricPrefix: string
  isOverall: boolean
}

// Test-set count metrics: one row per dataset plus the overall row
export function CountAccuracyTable({ info }: { info: ModelInfo }) {
  const { locale } = useLocale()
  const { evaluation } = useLocalized(aboutContent)
  const metricKeys: CountMetricKey[] = ['mae', 'exact_match', 'within_1']

  const rows: Row[] = []
  let totalImages = 0
  for (const prefix of DATASETS) {
    rows.push({
      id: prefix,
      name: evaluation.datasetNames[prefix],
      images: TEST_IMAGES[prefix],
      metricPrefix: `${prefix}_`,
      isOverall: false,
    })
    totalImages += TEST_IMAGES[prefix]
  }
  rows.push({ id: 'all', name: evaluation.overall, images: totalImages, metricPrefix: '', isOverall: true })

  return (
    <div>
      <table className="w-full text-left text-sm tabular-nums sm:text-base">
        <caption className="sr-only">{evaluation.countHeading}</caption>
        <thead>
          <tr className="border-b border-foreground/80 text-sm text-muted">
            <th scope="col" className="py-3 pr-2 pl-2 sm:pr-4 sm:pl-3 font-normal">
              {evaluation.countColumns.dataset}
            </th>
            <th scope="col" className="px-2 py-3 text-right sm:px-3 font-normal">
              {evaluation.countColumns.images}
            </th>
            {metricKeys.map((key) => {
              const isKey = KEY_METRICS.includes(key)
              return (
                <th
                  key={key}
                  scope="col"
                  className={`px-2 py-3 text-right sm:px-3 ${isKey ? 'font-semibold text-primary' : 'font-normal'}`}
                >
                  {evaluation.countMetrics[key]}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={row.isOverall ? 'bg-primary/10 font-semibold' : 'border-b border-border'}
            >
              <th scope="row" className={`py-4 pr-2 pl-2 sm:pr-4 sm:pl-3 ${row.isOverall ? 'font-semibold' : 'font-normal'}`}>
                {row.name}
              </th>
              <td className="px-2 py-4 text-right sm:px-3">{row.images.toLocaleString(locale)}</td>
              {metricKeys.map((key) => {
                const isKey = KEY_METRICS.includes(key)
                const value = info.test[`${row.metricPrefix}${key}`]
                return (
                  <td key={key} className={`px-2 py-4 text-right sm:px-3 ${isKey ? 'font-semibold text-primary' : ''}`}>
                    {formatCountMetric(key, value, locale)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
