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
          'Pilltally adalah aplikasi web untuk menghitung pil secara otomatis. Cukup arahkan kamera atau unggah foto atau video, lalu Pilltally menandai setiap pil dan menampilkan jumlahnya.',
      },
      {
        id: 'how-it-works',
        question: 'Bagaimana cara kerja Pilltally?',
        answer:
          'Pilltally memakai model kecerdasan buatan (YOLO26n) yang dilatih untuk mengenali pil. Model memberi kotak pada setiap pil yang terlihat, lalu jumlah kotak itulah yang menjadi jumlah pil.',
      },
      {
        id: 'modes',
        question: 'Apa saja cara yang dapat digunakan untuk menghitung pil?',
        answer:
          'Ada tiga cara: kamera live dari HP atau laptop, unggah gambar, dan unggah video. Semuanya ada di halaman Hitung.',
      },
      {
        id: 'accuracy',
        question: 'Apakah hasil hitung Pilltally akurat?',
        answer:
          'Pada data uji (335 gambar), 99,4% gambar dihitung tepat, dan sisanya hanya meleset 1 pil. Namun model belum diuji dengan foto HP sehari-hari, jadi hasil di lapangan bisa berbeda. Untuk hasil terbaik, gunakan cahaya terang dan latar polos, dan jangan biarkan pil bertumpuk.',
      },
      {
        id: 'area',
        question: 'Apakah saya dapat menentukan area yang ingin dihitung?',
        answer:
          'Bisa. Aktifkan area hitung, lalu geser 4 titik sudutnya ke sekeliling pil. Hanya pil di dalam area yang dihitung, dan area yang sama berlaku untuk kamera, gambar, dan video.',
      },
      {
        id: 'limitations',
        question: 'Apa saja keterbatasan Pilltally?',
        answer:
          'Pil yang bertumpuk, sangat kecil, atau berwarna mirip dengan latarnya bisa terlewat. Hasil juga dipengaruhi cahaya, sudut kamera, dan kualitas gambar. Pilltally adalah alat bantu, jadi untuk penyerahan obat selalu periksa ulang secara manual.',
      },
      {
        id: 'privacy',
        question: 'Bagaimana kebijakan privasi dan keamanan data pengguna?',
        answer:
          'Pilltally tidak memakai akun dan tidak menyimpan foto atau video. Kamera dan video diproses langsung di perangkat Anda tanpa dikirim ke server. Gambar yang diunggah dikirim ke server hanya untuk dihitung, lalu langsung dibuang.',
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
          'Pilltally is a web app that counts pills automatically. Point your camera or upload a photo or video, and Pilltally marks every pill and shows the count.',
      },
      {
        id: 'how-it-works',
        question: 'How does Pilltally work?',
        answer:
          'Pilltally uses an AI model (YOLO26n) trained to recognize pills. The model puts a box on every visible pill, and the number of boxes is the pill count.',
      },
      {
        id: 'modes',
        question: 'What ways can I use to count pills?',
        answer:
          'There are three: live camera on a phone or laptop, image upload, and video upload. All of them are on the Count page.',
      },
      {
        id: 'accuracy',
        question: 'Is the Pilltally count accurate?',
        answer:
          'On the test data (335 images), 99.4% of images were counted exactly, and the rest were off by only 1 pill. However, the model has not been tested on everyday phone photos yet, so real-world results may differ. For the best results, use bright light and a plain background, and do not let pills overlap.',
      },
      {
        id: 'area',
        question: 'Can I choose the area to count?',
        answer:
          'Yes. Turn on the counting area, then drag its 4 corner points around the pills. Only pills inside the area are counted, and the same area works for camera, image, and video.',
      },
      {
        id: 'limitations',
        question: 'What are the limitations of Pilltally?',
        answer:
          'Pills that overlap, are very small, or have a color close to the background can be missed. Results also depend on lighting, camera angle, and image quality. Pilltally is an aid, so always double-check by hand before dispensing medicine.',
      },
      {
        id: 'privacy',
        question: 'How is user privacy and data security handled?',
        answer:
          'Pilltally has no accounts and does not store photos or videos. Camera and video are processed on your device and never sent to the server. Uploaded images are sent to the server only to be counted, then discarded right away.',
      },
    ],
  },
}
