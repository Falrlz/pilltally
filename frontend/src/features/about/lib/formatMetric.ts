// How metric values from model_info.json are shown on the About page.
// MAE is a number of pills (0.006); every other metric is a share shown as percent (99.4%).

export function formatMae(value: number | undefined, locale: string): string {
  if (value === undefined) {
    return '–'
  }
  return value.toLocaleString(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

export function formatPercent(value: number | undefined, locale: string): string {
  if (value === undefined) {
    return '–'
  }
  return value.toLocaleString(locale, { style: 'percent', maximumFractionDigits: 1 })
}

// A plain decimal such as a threshold: 0.65 → "0,65" in Indonesian
export function formatDecimal(value: number, locale: string): string {
  return value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
