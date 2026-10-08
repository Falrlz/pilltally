import type { Localized } from '@/app/providers/localeContext'

export interface CountContent {
  title: string
  modesLabel: string
  modes: { camera: string; image: string; video: string }
  imagePicker: {
    button: string
    dropHint: string
  }
  videoPicker: {
    button: string
    dropHint: string
  }
  processing: string
  result: {
    unitOne: string
    unitMany: string
    noPills: string
    anotherImage: string
    imageAlt: string
  }
  // One text per error kind (features/counting/lib/predictError.ts) + unreadable file
  errors: {
    unreadableFile: string
    invalidImage: string
    tooLarge: string
    serverUnavailable: string
    unknown: string
  }
  tryAgain: string
  disclaimer: string
  detector: {
    loadingModel: string
    preparing: string
    ready: string
    error: string
  }
  camera: {
    intro: string
    start: string
    stop: string
    switchCamera: string
    requesting: string
    denied: string
    notFound: string
    unsupported: string
    error: string
    paused: string
    resume: string
    videoLabel: string
  }
  video: {
    playHint: string
    anotherVideo: string
    unsupported: string
    videoLabel: string
  }
  area: {
    toggle: string
    reset: string
    recount: string
    hint: string
    // "{n}" is replaced by the corner number
    cornerLabel: string
  }
  // Shared by camera and video (debug line)
  live: {
    detectionsPerSecond: string
    tracked: string
  }
  // Developer panel (?debug=1), compares browser and server counts
  debug: {
    title: string
    pickImage: string
    browser: string
    server: string
    milliseconds: string
  }
}

// DRAFT texts (docs/web_halaman.md section 4)
export const countContent: Localized<CountContent> = {
  id: {
    title: 'Hitung',
    modesLabel: 'Cara menghitung',
    modes: { camera: 'Kamera', image: 'Gambar', video: 'Video' },
    imagePicker: {
      button: 'Pilih gambar',
      dropHint: 'atau seret gambar ke sini',
    },
    videoPicker: {
      button: 'Pilih video',
      dropHint: 'atau seret video ke sini',
    },
    processing: 'Menghitung pil…',
    result: {
      unitOne: 'pil',
      unitMany: 'pil',
      noPills: 'Belum ada pil terdeteksi. Pastikan pil terlihat jelas dan cahaya cukup.',
      anotherImage: 'Gambar lain',
      imageAlt: 'Gambar yang diunggah dengan kotak di setiap pil',
    },
    errors: {
      unreadableFile: 'File ini tidak bisa dibaca sebagai gambar. Gunakan JPG, PNG, atau WebP.',
      invalidImage: 'Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.',
      tooLarge: 'Gambar terlalu besar.',
      serverUnavailable: 'Server sedang tidak bisa dihubungi. Coba lagi sebentar.',
      unknown: 'Terjadi kesalahan. Coba lagi.',
    },
    tryAgain: 'Coba lagi',
    disclaimer:
      'Hasil hitung adalah alat bantu. Untuk keperluan medis atau penyerahan obat, selalu periksa ulang secara manual.',
    detector: {
      loadingModel: 'Mengunduh model…',
      preparing: 'Menyiapkan model…',
      ready: 'Model siap',
      error: 'Model tidak bisa dimuat.',
    },
    camera: {
      intro: 'Pilltally butuh akses kamera untuk menghitung pil. Video tidak disimpan.',
      start: 'Mulai kamera',
      stop: 'Berhenti',
      switchCamera: 'Ganti kamera',
      requesting: 'Meminta izin kamera…',
      denied: 'Akses kamera ditolak. Izinkan kamera di pengaturan browser, lalu muat ulang halaman.',
      notFound: 'Kamera tidak ditemukan. Coba tab Gambar atau Video.',
      unsupported:
        'Browser ini belum mendukung kamera di halaman ini. Gunakan Chrome atau Edge versi terbaru, atau coba tab Gambar.',
      error: 'Kamera tidak bisa dibuka. Tutup aplikasi lain yang memakai kamera, lalu coba lagi.',
      paused: 'Dijeda.',
      resume: 'Lanjutkan',
      videoLabel: 'Video kamera dengan kotak di setiap pil',
    },
    video: {
      playHint: 'Putar video; jumlah pil mengikuti frame yang tampil.',
      anotherVideo: 'Video lain',
      unsupported: 'Video ini tidak bisa diputar di browser ini. Coba video MP4 atau WebM.',
      videoLabel: 'Video dengan kotak di setiap pil',
    },
    area: {
      toggle: 'Area hitung',
      reset: 'Reset area',
      recount: 'Hitung ulang',
      hint: 'Geser titik sudut untuk mengatur area. Hanya pil di dalam area yang dihitung.',
      cornerLabel: 'Titik sudut {n} area hitung (geser, atau pakai tombol panah)',
    },
    live: {
      detectionsPerSecond: 'deteksi/detik',
      tracked: 'dilacak',
    },
    debug: {
      title: 'Panel uji (debug)',
      pickImage: 'Uji gambar',
      browser: 'Browser',
      server: 'Server',
      milliseconds: 'ms',
    },
  },
  en: {
    title: 'Count',
    modesLabel: 'Counting mode',
    modes: { camera: 'Camera', image: 'Image', video: 'Video' },
    imagePicker: {
      button: 'Choose an image',
      dropHint: 'or drop an image here',
    },
    videoPicker: {
      button: 'Choose a video',
      dropHint: 'or drop a video here',
    },
    processing: 'Counting pills…',
    result: {
      unitOne: 'pill',
      unitMany: 'pills',
      noPills: 'No pills detected yet. Make sure the pills are clearly visible and well lit.',
      anotherImage: 'Another image',
      imageAlt: 'The uploaded image with a box on every pill',
    },
    errors: {
      unreadableFile: 'This file cannot be read as an image. Use JPG, PNG, or WebP.',
      invalidImage: 'This image format is not supported. Use JPG, PNG, or WebP.',
      tooLarge: 'The image is too large.',
      serverUnavailable: 'The server cannot be reached right now. Please try again shortly.',
      unknown: 'Something went wrong. Please try again.',
    },
    tryAgain: 'Try again',
    disclaimer: 'Counts are an aid. For medical use or dispensing, always double-check by hand.',
    detector: {
      loadingModel: 'Downloading the model…',
      preparing: 'Preparing the model…',
      ready: 'Model ready',
      error: 'The model could not be loaded.',
    },
    camera: {
      intro: 'Pilltally needs camera access to count pills. The video is not stored.',
      start: 'Start camera',
      stop: 'Stop',
      switchCamera: 'Switch camera',
      requesting: 'Asking for camera access…',
      denied: 'Camera access was denied. Allow the camera in your browser settings, then reload the page.',
      notFound: 'No camera found. Try the Image or Video tab.',
      unsupported:
        'This browser cannot use the camera on this page. Use the latest Chrome or Edge, or try the Image tab.',
      error: 'The camera could not be opened. Close other apps that use the camera, then try again.',
      paused: 'Paused.',
      resume: 'Resume',
      videoLabel: 'Camera video with a box on every pill',
    },
    video: {
      playHint: 'Play the video; the pill count follows the frame on screen.',
      anotherVideo: 'Another video',
      unsupported: 'This video cannot be played in this browser. Try an MP4 or WebM video.',
      videoLabel: 'Video with a box on every pill',
    },
    area: {
      toggle: 'Counting area',
      reset: 'Reset area',
      recount: 'Count again',
      hint: 'Drag the corners to set the area. Only pills inside the area are counted.',
      cornerLabel: 'Corner {n} of the counting area (drag, or use the arrow keys)',
    },
    live: {
      detectionsPerSecond: 'detections/s',
      tracked: 'tracked',
    },
    debug: {
      title: 'Test panel (debug)',
      pickImage: 'Test an image',
      browser: 'Browser',
      server: 'Server',
      milliseconds: 'ms',
    },
  },
}
