import { useSyncExternalStore } from 'react'

// Same breakpoint as Tailwind's "lg:" (1024 px)
const LARGE_QUERY = '(min-width: 1024px)'

function subscribe(onChange: () => void) {
  const media = window.matchMedia(LARGE_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getIsLarge() {
  return window.matchMedia(LARGE_QUERY).matches
}

// True on laptops and up; follows the window when it is resized
export function useIsLargeScreen(): boolean {
  return useSyncExternalStore(subscribe, getIsLarge)
}
