import type { Localized } from '@/app/providers/localeContext'

// Metric keys as they appear in model_info.json (val / test)
export type CountMetricKey = 'mae' | 'exact_match' | 'within_1'
export type DetectionMetricKey = 'precision' | 'recall' | 'mAP50' | 'mAP50-95'

// File name prefix of each dataset; per-dataset metrics are named like "cp_mae"
export type DatasetPrefix = 'cp' | 'kr' | 'ul'

interface ChapterText {
  heading: string
  subline: string
}

export interface AboutContent {
  header: {
    title: string
    subtitle: string
  }
  detection: ChapterText & {
    lede: string
    formulaLabel: string
    formulaTerms: { count: string; score: string; threshold: string }
  }
  dataset: ChapterText & {
    lede: string
    splitHeading: string
    splitNames: { train: string; val: string; test: string }
    imagesUnit: string
    sourcesHeading: string
    sourceKind: string
    sources: { id: DatasetPrefix; name: string; origin: string; description: string; url: string }[]
    openInNewTab: string
  }
  preprocessing: ChapterText & {
    lede: string
    steps: { id: string; title: string; description: string }[]
  }
  model: ChapterText & {
    lede: string
    specs: { id: string; label: string; value: string }[]
    liveLabels: { threshold: string; thresholdNote: string; runName: string; promotedAt: string }
    loading: string
    error: string
    chart: {
      heading: string
      description: string
      xLabel: string
      yLabel: string
      selected: string
    }
  }
  evaluation: ChapterText & {
    lede: string
    loading: string
    error: string
    countHeading: string
    countColumns: { dataset: string; images: string }
    countMetrics: Record<CountMetricKey, string>
    overall: string
    datasetNames: Record<DatasetPrefix, string>
    detectionHeading: string
    detectionColumns: { metric: string; val: string; test: string }
    detectionMetrics: Record<DetectionMetricKey, string>
    note: string
  }
}

// ---- Fixed numbers (not in model_info.json); source: docs/dataset.md and docs/hasil_model.md ----

// Images per split after preprocessing (docs/dataset.md § 5)
export const SPLIT_IMAGES = { train: 7721, val: 559, test: 335 }

// Test images per dataset (docs/dataset.md § 5)
export const TEST_IMAGES: Record<DatasetPrefix, number> = { cp: 175, kr: 148, ul: 12 }

// Validation MAE per score threshold (docs/hasil_model.md § 2).
// UPDATE when a new model is promoted.
export const THRESHOLD_SEARCH = [
  { threshold: 0.1, mae: 0.068 },
  { threshold: 0.25, mae: 0.048 },
  { threshold: 0.4, mae: 0.041 },
  { threshold: 0.5, mae: 0.039 },
  { threshold: 0.6, mae: 0.038 },
  { threshold: 0.65, mae: 0.034 },
  { threshold: 0.7, mae: 0.039 },
  { threshold: 0.75, mae: 0.048 },
  { threshold: 0.8, mae: 0.082 },
]

const SOURCE_URLS: Record<DatasetPrefix, string> = {
  cp: 'https://universe.roboflow.com/countingpills-rbjwo/countingpills',
  kr: 'https://universe.roboflow.com/pilldetection-qsfgv/pill-detection-tbmmm',
  ul: 'https://docs.ultralytics.com/datasets/detect/medical-pills/',
}

// ---- Texts ----

export const aboutContent: Localized<AboutContent> = {
  id: {
    header: {
      title: 'Kecerdasan Buatan di Balik Pilltally',
      subtitle: 'Membedah model, data, dan teknologi yang mendasari sistem Pilltally.',
    },
    detection: {
      heading: 'Menghitung dengan Mendeteksi',
      subline: 'Single-Stage Object Detection · YOLO26n',
      lede: 'Pilltally memformulasikan penghitungan pil sebagai masalah deteksi objek. Setiap citra diproses oleh YOLO26n, detektor satu tahap yang memprediksi lokasi dan skor keyakinan setiap pil dalam satu kali inferensi. Prediksi yang tumpang-tindih disaring dengan Non-Maximum Suppression, lalu jumlah pil ditentukan dari kotak yang lolos ambang skor:',
      formulaLabel:
        'Jumlah pil sama dengan banyaknya kotak deteksi yang skornya lebih besar atau sama dengan ambang tau',
      formulaTerms: {
        count: 'jumlah pil',
        score: 'skor keyakinan kotak ke-i',
        threshold: 'ambang skor',
      },
    },
    dataset: {
      heading: 'Dataset Pelatihan & Protokol Integritas',
      subline: '3 Sumber Publik · 8.615 Citra · 33.319 Pil',
      lede: 'Model dilatih pada gabungan tiga dataset publik yang saling melengkapi: pil lepas berkepadatan tinggi, variasi bentuk dan warna obat, serta tambahan variasi kondisi pengambilan gambar. Seluruh data dibagi menjadi 7.721 citra latih, 559 validasi, dan 335 uji.',
      splitHeading: 'Pembagian data',
      splitNames: { train: 'Latih', val: 'Validasi', test: 'Uji' },
      imagesUnit: 'citra',
      sourcesHeading: 'Sumber Data',
      sourceKind: 'Dataset',
      sources: [
        {
          id: 'cp',
          name: 'CountingPills',
          origin: 'Roboflow Universe, v36',
          description:
            '7.011 citra pil lepas berkepadatan tinggi di atas nampan hitung farmasi; sumber utama untuk skenario penghitungan.',
          url: SOURCE_URLS.cp,
        },
        {
          id: 'kr',
          name: 'Pill Detection',
          origin: 'Roboflow Universe, v22',
          description: '1.489 citra dari 74 merek obat dengan variasi bentuk, warna, dan imprint.',
          url: SOURCE_URLS.kr,
        },
        {
          id: 'ul',
          name: 'medical-pills',
          origin: 'Ultralytics',
          description: '115 citra sebagai tambahan variasi pil dan latar.',
          url: SOURCE_URLS.ul,
        },
      ],
      openInNewTab: '(membuka tab baru)',
    },
    preprocessing: {
      heading: 'Preprocessing & Harmonisasi Data',
      subline: 'Label Seragam · Group Split Anti-Leakage',
      lede: 'Ketiga dataset memiliki format label, kelas, dan pembagian data yang berbeda. Sebelum pelatihan, semuanya diseragamkan melalui lima keputusan berikut:',
      steps: [
        {
          id: 'class',
          title: 'Harmonisasi kelas',
          description:
            'Seluruh kelas asli digabung menjadi satu kelas pill, karena tujuan sistem adalah menghitung, bukan mengenali jenis obat.',
        },
        {
          id: 'labels',
          title: 'Konversi label',
          description:
            'Anotasi poligon (95% objek CountingPills) dikonversi menjadi bounding box.',
        },
        {
          id: 'split',
          title: 'Group split anti-leakage',
          description:
            'Pill Detection dibagi 8:1:1 per kode kombinasi pil, dan medical-pills per kelompok frame yang mirip, sehingga foto yang hampir sama tidak muncul di data latih dan data uji sekaligus.',
        },
        {
          id: 'negatives',
          title: 'Citra negatif dipertahankan',
          description:
            '1.049 citra tanpa pil (12%) tetap disertakan agar model belajar tidak menghasilkan deteksi palsu pada latar kosong.',
        },
        {
          id: 'resolution',
          title: 'Resolusi & augmentasi',
          description:
            'Input 640 px dengan letterbox. Tanpa augmentasi offline; hanya augmentasi online bawaan YOLO selama pelatihan.',
        },
      ],
    },
    model: {
      heading: 'Spesifikasi Teknis Model',
      subline: 'Parameter Pelatihan & Runtime',
      lede: 'Konfigurasi pelatihan dan runtime model yang dipakai aplikasi, baik di server maupun langsung di browser:',
      specs: [
        { id: 'arch', label: 'Arsitektur', value: 'YOLO26n (Ultralytics), detektor satu tahap' },
        { id: 'weights', label: 'Bobot awal', value: 'Pretrained COCO, seluruh layer dilatih ulang' },
        { id: 'classes', label: 'Jumlah kelas', value: '1 (pill)' },
        { id: 'training', label: 'Pelatihan', value: '50 epoch · batch 16 · GPU T4 Kaggle (±1 jam)' },
        { id: 'input', label: 'Dimensi masukan', value: '3 × 640 × 640 (RGB, letterbox)' },
        { id: 'nms', label: 'Pasca-proses', value: 'Non-Maximum Suppression, IoU 0,7' },
        { id: 'format', label: 'Format runtime', value: 'ONNX FP32, 9,3 MB' },
        {
          id: 'runtime',
          label: 'Inferensi',
          value: 'ONNX Runtime (server) · ONNX Runtime Web, WebGPU/WASM (browser)',
        },
      ],
      liveLabels: {
        threshold: 'Ambang skor (τ)',
        thresholdNote: 'dipilih dari data validasi',
        runName: 'Nama run',
        promotedAt: 'Tanggal model',
      },
      loading: 'Memuat informasi model…',
      error: 'Informasi model tidak bisa dimuat. Server sedang tidak bisa dihubungi.',
      chart: {
        heading: 'Kalibrasi ambang skor',
        description:
          'Ambang τ dipilih dengan mencoba beberapa nilai pada data validasi. Nilai 0,65 menghasilkan MAE terkecil.',
        xLabel: 'Ambang skor',
        yLabel: 'MAE validasi',
        selected: 'dipilih',
      },
    },
    evaluation: {
      heading: 'Hasil Evaluasi pada Data Uji',
      subline: '335 Citra yang Tidak Pernah Dilihat Saat Pelatihan',
      lede: 'Performa diukur pada data uji yang dipisahkan sejak awal dengan protokol group split. Metrik utama adalah ketepatan jumlah, karena itulah keluaran yang dilihat pengguna:',
      loading: 'Memuat hasil evaluasi…',
      error: 'Hasil evaluasi tidak bisa dimuat. Server sedang tidak bisa dihubungi.',
      countHeading: 'Ketepatan jumlah per dataset',
      countColumns: { dataset: 'Dataset', images: 'Citra' },
      countMetrics: { mae: 'MAE', exact_match: 'Jumlah tepat', within_1: 'Selisih ≤ 1' },
      overall: 'Keseluruhan',
      datasetNames: { cp: 'CountingPills', kr: 'Pill Detection', ul: 'medical-pills' },
      detectionHeading: 'Metrik deteksi',
      detectionColumns: { metric: 'Metrik', val: 'Validasi', test: 'Uji' },
      detectionMetrics: {
        precision: 'Precision',
        recall: 'Recall',
        mAP50: 'mAP50',
        'mAP50-95': 'mAP50-95',
      },
      // Written for the current model (docs/hasil_model.md); UPDATE when a new model is promoted
      note: 'Jumlah tepat 99,4% berarti hanya 2 dari 335 citra uji yang meleset, masing-masing tepat satu pil. Subset medical-pills merupakan titik terlemah (65,2% tepat pada validasi) karena jumlah citranya kecil. Model juga belum dievaluasi pada foto kamera ponsel, sehingga performa di lapangan dapat berbeda.',
    },
  },
  en: {
    header: {
      title: 'The AI Behind Pilltally',
      subtitle: 'A look inside the model, data, and technology behind Pilltally.',
    },
    detection: {
      heading: 'Counting by Detecting',
      subline: 'Single-Stage Object Detection · YOLO26n',
      lede: 'Pilltally frames pill counting as an object detection problem. Every image is processed by YOLO26n, a single-stage detector that predicts the location and confidence score of every pill in a single inference pass. Overlapping predictions are filtered with Non-Maximum Suppression, and the pill count is the number of boxes that pass the score threshold:',
      formulaLabel:
        'The pill count equals the number of detection boxes whose score is greater than or equal to the threshold tau',
      formulaTerms: {
        count: 'pill count',
        score: 'confidence score of box i',
        threshold: 'score threshold',
      },
    },
    dataset: {
      heading: 'Training Dataset & Integrity Protocol',
      subline: '3 Public Sources · 8,615 Images · 33,319 Pills',
      lede: 'The model is trained on a combination of three complementary public datasets: dense loose pills, varied drug shapes and colors, and extra variation in capture conditions. All data is split into 7,721 training, 559 validation, and 335 test images.',
      splitHeading: 'Data split',
      splitNames: { train: 'Train', val: 'Validation', test: 'Test' },
      imagesUnit: 'images',
      sourcesHeading: 'Data Sources',
      sourceKind: 'Dataset',
      sources: [
        {
          id: 'cp',
          name: 'CountingPills',
          origin: 'Roboflow Universe, v36',
          description:
            '7,011 images of dense loose pills on pharmacy counting trays; the main source for the counting scenario.',
          url: SOURCE_URLS.cp,
        },
        {
          id: 'kr',
          name: 'Pill Detection',
          origin: 'Roboflow Universe, v22',
          description: '1,489 images of 74 drug brands with varied shapes, colors, and imprints.',
          url: SOURCE_URLS.kr,
        },
        {
          id: 'ul',
          name: 'medical-pills',
          origin: 'Ultralytics',
          description: '115 images adding variety in pills and backgrounds.',
          url: SOURCE_URLS.ul,
        },
      ],
      openInNewTab: '(opens in a new tab)',
    },
    preprocessing: {
      heading: 'Preprocessing & Data Harmonization',
      subline: 'Unified Labels · Anti-Leakage Group Split',
      lede: 'The three datasets differ in label format, classes, and splits. Before training, they were unified through these five decisions:',
      steps: [
        {
          id: 'class',
          title: 'Class harmonization',
          description:
            'All original classes are merged into a single pill class, because the goal is counting, not recognizing the drug type.',
        },
        {
          id: 'labels',
          title: 'Label conversion',
          description:
            'Polygon annotations (95% of CountingPills objects) are converted to bounding boxes.',
        },
        {
          id: 'split',
          title: 'Anti-leakage group split',
          description:
            'Pill Detection is split 8:1:1 per pill-combination code, and medical-pills per group of similar frames, so near-identical photos never appear in both training and test data.',
        },
        {
          id: 'negatives',
          title: 'Negative images kept',
          description:
            '1,049 images without pills (12%) are kept so the model learns not to produce false detections on empty backgrounds.',
        },
        {
          id: 'resolution',
          title: 'Resolution & augmentation',
          description:
            '640 px input with letterboxing. No offline augmentation; only YOLO’s built-in online augmentation during training.',
        },
      ],
    },
    model: {
      heading: 'Technical Model Specifications',
      subline: 'Training & Runtime Parameters',
      lede: 'Training and runtime configuration of the model used by the app, both on the server and directly in the browser:',
      specs: [
        { id: 'arch', label: 'Architecture', value: 'YOLO26n (Ultralytics), single-stage detector' },
        { id: 'weights', label: 'Initial weights', value: 'COCO pretrained, all layers fine-tuned' },
        { id: 'classes', label: 'Number of classes', value: '1 (pill)' },
        { id: 'training', label: 'Training', value: '50 epochs · batch 16 · Kaggle T4 GPU (~1 hour)' },
        { id: 'input', label: 'Input dimensions', value: '3 × 640 × 640 (RGB, letterbox)' },
        { id: 'nms', label: 'Post-processing', value: 'Non-Maximum Suppression, IoU 0.7' },
        { id: 'format', label: 'Runtime format', value: 'ONNX FP32, 9.3 MB' },
        {
          id: 'runtime',
          label: 'Inference',
          value: 'ONNX Runtime (server) · ONNX Runtime Web, WebGPU/WASM (browser)',
        },
      ],
      liveLabels: {
        threshold: 'Score threshold (τ)',
        thresholdNote: 'chosen on validation data',
        runName: 'Run name',
        promotedAt: 'Model date',
      },
      loading: 'Loading model information…',
      error: 'Model information could not be loaded. The server cannot be reached.',
      chart: {
        heading: 'Score threshold calibration',
        description:
          'The threshold τ was chosen by trying several values on the validation data. 0.65 gives the lowest MAE.',
        xLabel: 'Score threshold',
        yLabel: 'Validation MAE',
        selected: 'chosen',
      },
    },
    evaluation: {
      heading: 'Evaluation Results on Test Data',
      subline: '335 Images Never Seen During Training',
      lede: 'Performance is measured on test data held out from the start with the group split protocol. The key metric is count accuracy, because that is the output users see:',
      loading: 'Loading evaluation results…',
      error: 'Evaluation results could not be loaded. The server cannot be reached.',
      countHeading: 'Count accuracy per dataset',
      countColumns: { dataset: 'Dataset', images: 'Images' },
      countMetrics: { mae: 'MAE', exact_match: 'Exact count', within_1: 'Off by ≤ 1' },
      overall: 'Overall',
      datasetNames: { cp: 'CountingPills', kr: 'Pill Detection', ul: 'medical-pills' },
      detectionHeading: 'Detection metrics',
      detectionColumns: { metric: 'Metric', val: 'Validation', test: 'Test' },
      detectionMetrics: {
        precision: 'Precision',
        recall: 'Recall',
        mAP50: 'mAP50',
        'mAP50-95': 'mAP50-95',
      },
      // Written for the current model (docs/hasil_model.md); UPDATE when a new model is promoted
      note: 'An exact count of 99.4% means only 2 of the 335 test images were miscounted, each by exactly one pill. The medical-pills subset is the weakest point (65.2% exact on validation) because it has few images. The model has also not been evaluated on phone camera photos yet, so real-world performance may differ.',
    },
  },
}
