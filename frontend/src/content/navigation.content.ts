import { PATHS, type AppPath } from '@/app/paths'
import type { Localized } from '@/app/providers/localeContext'

export interface NavigationContent {
  brand: {
    name: string
  }
  menuItems: { id: string; label: string; path: AppPath }[]
  footer: {
    description: string
    navigationTitle: string
    disclaimerTitle: string
    disclaimerText: string
    copyright: string
  }
}

// Texts for the navbar and the footer
export const navigationContent: Localized<NavigationContent> = {
  id: {
    brand: {
      name: 'Pilltally',
    },
    menuItems: [
      { id: 'home', label: 'Beranda', path: PATHS.home },
      { id: 'count', label: 'Hitung', path: PATHS.count },
      { id: 'about', label: 'Tentang', path: PATHS.about },
    ],
    footer: {
      description:
        'Pilltally adalah platform penghitung pil otomatis berbasis kecerdasan buatan yang mendeteksi dan menghitung obat tablet serta kapsul secara instan melalui computer vision untuk mendukung efisiensi dan verifikasi farmasi.',
      navigationTitle: 'Navigasi',
      disclaimerTitle: 'Peringatan Medis',
      disclaimerText:
        'Keakuratan deteksi dan perhitungan dapat dipengaruhi oleh kualitas citra, kondisi pencahayaan, sudut kamera, karakteristik objek, serta keterbatasan dataset dan model komputasi yang digunakan. Pilltally masih memiliki keterbatasan, sehingga kemungkinan terjadinya kesalahan dalam proses deteksi maupun perhitungan tetap ada.',
      copyright: '© 2026 Pilltally',
    },
  },
  en: {
    brand: {
      name: 'Pilltally',
    },
    menuItems: [
      { id: 'home', label: 'Home', path: PATHS.home },
      { id: 'count', label: 'Count', path: PATHS.count },
      { id: 'about', label: 'About', path: PATHS.about },
    ],
    footer: {
      description:
        'Pilltally is an AI-powered automated pill counter that instantly detects and counts tablets and capsules using computer vision to support pharmacy efficiency and verification.',
      navigationTitle: 'Navigation',
      disclaimerTitle: 'Medical Disclaimer',
      disclaimerText:
        'Detection and counting accuracy can be affected by image quality, lighting, camera angle, object characteristics, and the limitations of the dataset and model used. Pilltally still has limitations, so detection or counting errors can still occur.',
      copyright: '© 2026 Pilltally',
    },
  },
}
