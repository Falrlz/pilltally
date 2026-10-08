import { useState } from 'react'
import { useLocale, useLocalized } from '@/app/providers/localeContext'
import { aboutContent, THRESHOLD_SEARCH } from '@/content/about.content'
import { formatDecimal, formatMae } from '@/features/about/lib/formatMetric'

// Top of the value axis and its grid lines
const Y_MAX = 0.09
const Y_TICKS = [0, 0.03, 0.06, 0.09]

// Height of a value as a percent of the plot height
function toPercent(value: number): string {
  return `${(value / Y_MAX) * 100}%`
}

// The threshold with the lowest validation MAE (the one the model uses)
function findBestIndex(): number {
  let bestIndex = 0
  for (let index = 1; index < THRESHOLD_SEARCH.length; index++) {
    if (THRESHOLD_SEARCH[index].mae < THRESHOLD_SEARCH[bestIndex].mae) {
      bestIndex = index
    }
  }
  return bestIndex
}

// Bar chart: validation MAE for each score threshold that was tried.
// The chosen threshold is highlighted; hovering a bar shows its value.
export function ThresholdChart() {
  const { locale } = useLocale()
  const { model } = useLocalized(aboutContent)
  const { chart } = model
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const bestIndex = findBestIndex()

  return (
    <figure className="mt-12">
      <figcaption>
        <p className="font-semibold">{chart.heading}</p>
        <p className="mt-1 max-w-[62ch] text-sm text-muted">{chart.description}</p>
      </figcaption>

      {/* The drawing; screen readers get the table below instead */}
      <div aria-hidden="true" className="mt-6">
        <p className="text-xs text-muted">{chart.yLabel}</p>

        <div className="mt-3 flex gap-2">
          {/* Value axis */}
          <div className="relative h-48 w-10 shrink-0 text-xs text-muted tabular-nums">
            {Y_TICKS.map((tick) => (
              <span key={tick} className="absolute right-0 translate-y-1/2" style={{ bottom: toPercent(tick) }}>
                {formatMae(tick, locale)}
              </span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative h-48">
              {/* Grid lines */}
              {Y_TICKS.map((tick) => (
                <div
                  key={tick}
                  className="absolute inset-x-0 border-t border-border"
                  style={{ bottom: toPercent(tick) }}
                />
              ))}

              {/* Bars */}
              <div className="relative flex h-full items-end gap-0.5 sm:gap-2">
                {THRESHOLD_SEARCH.map((point, index) => {
                  const isBest = index === bestIndex
                  const showValue = isBest || index === hoveredIndex
                  return (
                    <div
                      key={point.threshold}
                      className="relative flex h-full flex-1 items-end justify-center"
                      onPointerEnter={() => setHoveredIndex(index)}
                      onPointerLeave={() => setHoveredIndex(null)}
                    >
                      {showValue && (
                        <span
                          className="absolute whitespace-nowrap text-xs font-semibold tabular-nums"
                          style={{ bottom: `calc(${toPercent(point.mae)} + 4px)` }}
                        >
                          {formatMae(point.mae, locale)}
                        </span>
                      )}
                      <div
                        className={`w-full max-w-7 rounded-t ${isBest ? 'bg-primary' : 'bg-muted/40'}`}
                        style={{ height: toPercent(point.mae) }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Threshold axis */}
            <div className="mt-2 flex gap-0.5 text-xs tabular-nums sm:gap-2">
              {THRESHOLD_SEARCH.map((point, index) => (
                <span
                  key={point.threshold}
                  className={`flex-1 text-center ${index === bestIndex ? 'font-semibold' : 'text-muted'}`}
                >
                  {formatDecimal(point.threshold, locale)}
                </span>
              ))}
            </div>
            <p className="mt-2 text-center text-xs text-muted">{chart.xLabel}</p>
          </div>
        </div>
      </div>

      {/* Same numbers as a table for screen readers */}
      <table className="sr-only">
        <caption>{chart.heading}</caption>
        <thead>
          <tr>
            <th scope="col">{chart.xLabel}</th>
            <th scope="col">{chart.yLabel}</th>
          </tr>
        </thead>
        <tbody>
          {THRESHOLD_SEARCH.map((point, index) => (
            <tr key={point.threshold}>
              <th scope="row">{formatDecimal(point.threshold, locale)}</th>
              <td>
                {formatMae(point.mae, locale)}
                {index === bestIndex && ` (${chart.selected})`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
