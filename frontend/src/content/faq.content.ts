import type { Localized } from '@/app/providers/localeContext'

export interface FaqItemContent {
  id: string
  question: string
  answer: string
}

export interface FaqContent {
  heading: string
  items: FaqItemContent[]
}

export const faqContent: Localized<FaqContent> = {
  id: {
    heading: 'Pertanyaan yang sering diajukan',
    items: [
      {
        id: 'what',
        question: 'Apa itu Pilltally?',
        answer:
          'Pilltally adalah platform penghitung pil otomatis berbasis kecerdasan buatan yang mendeteksi dan menghitung obat tablet serta kapsul secara instan melalui computer vision untuk mendukung efisiensi dan verifikasi farmasi.',
      },
      {
        id: 'how-it-works',
        question: 'Bagaimana cara kerja Pilltally?',
        answer:
          'Pilltally memproses frame citra (640×640 px) menggunakan model deteksi objek YOLO26n yang dieksekusi via ONNX Runtime (WebGPU/WASM di browser atau server). Bounding box hasil prediksi disaring dengan ambang keyakinan dan Non-Maximum Suppression (NMS) sebelum dihitung secara instan berdasarkan area yang ditentukan.',
      },
      {
        id: 'modes',
        question: 'Apa saja cara yang dapat digunakan untuk menghitung pil?',
        answer:
          'Ada tiga cara: kamera live dari HP atau laptop, unggah gambar, dan unggah video. Semuanya ada di halaman Hitung.',
      },
      {
        id: 'area',
        question: 'Apakah saya dapat menentukan area yang ingin dihitung?',
        answer:
          'Bisa. Aktifkan area hitung, lalu geser 4 titik sudutnya ke sekeliling pil. Hanya pil di dalam area yang dihitung, dan area yang sama berlaku untuk kamera, gambar, dan video.',
      },
      {
        id: 'accuracy',
        question: 'Apakah hasil hitung Pilltally akurat?',
        answer:
          'Keakuratan deteksi dan perhitungan dipengaruhi oleh kualitas citra, pencahayaan, sudut kamera, karakteristik objek, serta keterbatasan model komputasi. Pilltally memiliki keterbatasan sehingga kemungkinan kesalahan tetap ada, dan hasil hitung harus selalu diverifikasi secara manual.',
      },
      {
        id: 'limitations',
        question: 'Apa saja keterbatasan Pilltally?',
        answer:
          'Akibat keterbatasan dataset pelatihan dan model komputasi, sistem dapat mengalami penurunan akurasi pada pil yang saling bertumpuk (oklusi), berukuran sangat kecil, atau memiliki kontras warna rendah terhadap latar. Sebagai sistem pendukung, verifikasi manual oleh tenaga farmasi tetap diwajibkan sebelum penyerahan obat.',
      },
      {
        id: 'privacy',
        question: 'Bagaimana kebijakan privasi dan keamanan data pengguna?',
        answer:
          'Pilltally menerapkan prinsip privasi sejak perancangan (privacy-by-design) tanpa memerlukan registrasi akun. Aliran kamera dan video diproses sepenuhnya di sisi perangkat (on-device) tanpa transmisi ke server. Berkas gambar yang diunggah hanya diproses secara temporer di memori dan langsung dihapus setelah inferensi tanpa retensi data.',
      },
    ],
  },
  en: {
    heading: 'Frequently asked questions',
    items: [
      {
        id: 'what',
        question: 'What is Pilltally?',
        answer:
          'Pilltally is an AI-powered automated pill counting platform that instantly detects and counts tablets and capsules using computer vision to support pharmacy efficiency and verification.',
      },
      {
        id: 'how-it-works',
        question: 'How does Pilltally work?',
        answer:
          'Pilltally processes image frames (640×640 px) using a YOLO26n object detection model executed via ONNX Runtime (WebGPU/WASM in the browser or server backend). Predicted bounding boxes are filtered using confidence thresholding and Non-Maximum Suppression (NMS) before tallying pills within the designated area in real time.',
      },
      {
        id: 'modes',
        question: 'What ways can I use to count pills?',
        answer:
          'There are three: live camera on a phone or laptop, image upload, and video upload. All of them are on the Count page.',
      },
      {
        id: 'area',
        question: 'Can I choose the area to count?',
        answer:
          'Yes. Turn on the counting area, then drag its 4 corner points around the pills. Only pills inside the area are counted, and the same area works for camera, image, and video.',
      },
      {
        id: 'accuracy',
        question: 'Is the Pilltally count accurate?',
        answer:
          'Detection and counting accuracy is affected by image quality, lighting, camera angle, object characteristics, and model limitations. Errors can still occur, so results should always be verified manually.',
      },
      {
        id: 'limitations',
        question: 'What are the limitations of Pilltally?',
        answer:
          'Due to training dataset and model limitations, detection accuracy may decrease when pills overlap (occlusion), are exceptionally small, or have low color contrast against the background. As an assistive tool, manual verification by pharmacy personnel remains mandatory prior to dispensing medication.',
      },
      {
        id: 'privacy',
        question: 'How is user privacy and data security handled?',
        answer:
          'Pilltally is built on privacy-by-design principles and requires no user registration. Live camera and video streams are processed entirely on-device without transmitting visual data to servers. Uploaded images are processed strictly in memory and deleted immediately after inference with no data retention.',
      },
    ],
  },
}
