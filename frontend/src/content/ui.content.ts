import type { Localized } from '@/app/providers/localeContext'

export interface UiContent {
  settings: {
    title: string
    language: string
    theme: string
    themeOptions: { light: string; dark: string; system: string }
  }
  nav: {
    mainLabel: string
    openMenu: string
    closeMenu: string
    skipToContent: string
  }
  loading: string
  notFound: {
    title: string
    backHome: string
  }
}

// Interface texts: settings, menu buttons, loading, 404
export const uiContent: Localized<UiContent> = {
  id: {
    settings: {
      title: 'Pengaturan',
      language: 'Bahasa',
      theme: 'Tema',
      themeOptions: { light: 'Terang', dark: 'Gelap', system: 'Sistem' },
    },
    nav: {
      mainLabel: 'Navigasi utama',
      openMenu: 'Buka menu',
      closeMenu: 'Tutup menu',
      skipToContent: 'Lewati ke konten utama',
    },
    loading: 'Memuat…',
    notFound: {
      title: 'Halaman tidak ditemukan',
      backHome: 'Kembali ke Beranda',
    },
  },
  en: {
    settings: {
      title: 'Settings',
      language: 'Language',
      theme: 'Theme',
      themeOptions: { light: 'Light', dark: 'Dark', system: 'System' },
    },
    nav: {
      mainLabel: 'Main navigation',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      skipToContent: 'Skip to main content',
    },
    loading: 'Loading…',
    notFound: {
      title: 'Page not found',
      backHome: 'Back to Home',
    },
  },
}
