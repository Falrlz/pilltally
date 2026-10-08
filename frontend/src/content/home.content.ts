import type { Localized } from '@/app/providers/localeContext'

export interface HomeContent {
  hero: {
    // The title is: titleStart + one of rotatingWords (own line) + titleEnd
    titleStart: string
    rotatingWords: string[]
    titleEnd: string
    visualLabel: string
    countLabel: string
    dragHint: string
    // One per corner of the counting area: top-left, top-right, bottom-right, bottom-left
    cornerLabels: string[]
  }
  modes: {
    heading: string
    intro: string
    items: { id: 'camera' | 'image' | 'video'; title: string; description: string }[]
  }
  area: {
    heading: string
    intro: string
    vignetteLabel: string
    points: { id: string; text: string }[]
  }
  workflow: {
    heading: string
    steps: { id: string; title: string; description: string }[]
  }
  cta: {
    heading: string
    description: string
    buttonLabel: string
  }
}

export const homeContent: Localized<HomeContent> = {
  id: {
    hero: {
      titleStart: 'Menghitung pil dengan',
      rotatingWords: ['cepat', 'mudah', 'fleksibel'],
      titleEnd: ' secara otomatis',
      visualLabel:
        'Ilustrasi: pil di atas nampan hitung, dilihat dari atas. Setiap pil di dalam area hitung diberi kotak biru.',
      countLabel: 'pil',
      dragHint: 'Geser sudut bingkai biru untuk mengubah area hitung.',
      cornerLabels: [
        'Sudut kiri atas area hitung. Gunakan tombol panah untuk menggeser.',
        'Sudut kanan atas area hitung. Gunakan tombol panah untuk menggeser.',
        'Sudut kanan bawah area hitung. Gunakan tombol panah untuk menggeser.',
        'Sudut kiri bawah area hitung. Gunakan tombol panah untuk menggeser.',
      ],
    },
    modes: {
      heading: 'Mulai dari Mana Saja',
      intro: 'Pilih cara yang paling cocok dengan situasi Anda.',
      items: [
        {
          id: 'camera',
          title: 'Kamera Live',
          description: 'Arahkan kamera HP atau laptop ke pil, jumlahnya langsung muncul.',
        },
        {
          id: 'image',
          title: 'Unggah Gambar',
          description: 'Pilih satu foto, lalu lihat jumlah dan letak setiap pil.',
        },
        {
          id: 'video',
          title: 'Unggah Video',
          description: 'Putar video yang sudah direkam, pil dihitung selama video berjalan.',
        },
      ],
    },
    area: {
      heading: 'Lebih Fleksibel, Lebih Praktis',
      vignetteLabel:
        'Ilustrasi: sembilan pil di nampan. Lima pil di dalam area hitung biru diberi kotak; empat pil di luarnya tidak dihitung.',
      intro:
        'Hanya ingin menghitung sebagian pil? Atur area hitung, dan hanya pil di dalam area itu yang dihitung.',
      points: [
        { id: 'drag', text: 'Geser 4 titik sudut untuk membentuk area sesuai kebutuhan.' },
        {
          id: 'ignore',
          text: 'Pil di luar area diabaikan, jadi benda lain di meja tidak ikut terhitung.',
        },
        { id: 'all-modes', text: 'Satu area berlaku untuk kamera, gambar, dan video.' },
      ],
    },
    workflow: {
      heading: 'Tiga Langkah, Satu Hasil',
      steps: [
        { id: 'choose', title: 'Pilih cara', description: 'Kamera, gambar, atau video.' },
        {
          id: 'area',
          title: 'Atur area hitung',
          description: 'Opsional: geser 4 titik ke sekeliling pil.',
        },
        { id: 'result', title: 'Lihat hasil', description: 'Jumlah pil dan kotak di setiap pil.' },
      ],
    },
    cta: {
      heading: 'Siap menghitung?',
      description: 'Tanpa instal, tanpa akun. Foto dan video tidak disimpan.',
      buttonLabel: 'Mulai Hitung',
    },
  },
  en: {
    hero: {
      titleStart: 'Count pills',
      rotatingWords: ['quickly', 'easily', 'flexibly'],
      titleEnd: ' and automatically',
      visualLabel:
        'Illustration: pills on a counting tray, seen from above. Every pill inside the counting area gets a blue box.',
      countLabel: 'pills',
      dragHint: 'Drag a corner of the blue frame to change the counting area.',
      cornerLabels: [
        'Top-left corner of the counting area. Use the arrow keys to move it.',
        'Top-right corner of the counting area. Use the arrow keys to move it.',
        'Bottom-right corner of the counting area. Use the arrow keys to move it.',
        'Bottom-left corner of the counting area. Use the arrow keys to move it.',
      ],
    },
    modes: {
      heading: 'Start Anywhere',
      intro: 'Pick the way that fits your situation.',
      items: [
        {
          id: 'camera',
          title: 'Live Camera',
          description:
            'Point your phone or laptop camera at the pills and the count appears right away.',
        },
        {
          id: 'image',
          title: 'Upload an Image',
          description: 'Pick a photo and see the count and where every pill is.',
        },
        {
          id: 'video',
          title: 'Upload a Video',
          description: 'Play a recorded video and the pills are counted as it plays.',
        },
      ],
    },
    area: {
      heading: 'More Flexible, More Practical',
      vignetteLabel:
        'Illustration: nine pills on a tray. The five pills inside the blue counting area get a box; the four outside it are not counted.',
      intro:
        'Only want to count some of the pills? Set a counting area, and only the pills inside it are counted.',
      points: [
        { id: 'drag', text: 'Drag the 4 corner points to shape the area you need.' },
        {
          id: 'ignore',
          text: 'Pills outside the area are ignored, so other things on the table are not counted.',
        },
        { id: 'all-modes', text: 'One area works for camera, image, and video.' },
      ],
    },
    workflow: {
      heading: 'Three Steps, One Result',
      steps: [
        { id: 'choose', title: 'Choose a mode', description: 'Camera, image, or video.' },
        {
          id: 'area',
          title: 'Set the counting area',
          description: 'Optional: drag 4 points around the pills.',
        },
        { id: 'result', title: 'See the result', description: 'The pill count and a box on every pill.' },
      ],
    },
    cta: {
      heading: 'Ready to count?',
      description: 'No install, no account. Photos and videos are not stored.',
      buttonLabel: 'Start Counting',
    },
  },
}
