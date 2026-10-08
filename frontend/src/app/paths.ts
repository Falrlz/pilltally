// All page URLs in one place. Use these instead of writing "/count" by hand.
export const PATHS = {
  home: '/',
  count: '/count',
  about: '/about',
} as const

export type AppPath = (typeof PATHS)[keyof typeof PATHS]
