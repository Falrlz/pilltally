# Pilltally - Frontend

The web app for **Pilltally**, an automated pill counter. It has three pages: **Home** (with the FAQ), **Count**, and **About** (model, dataset, and evaluation).

Live camera and video counting run **entirely in the browser**: the YOLO26n ONNX model is executed by ONNX Runtime Web (WebGPU, with a WASM fallback) inside a Web Worker. Photo uploads are resized in the browser and counted by the FastAPI backend (see [`backend/README.md`](../backend/README.md)).

---

## Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript 6](https://www.typescriptlang.org/)
- **Routing**: [React Router](https://reactrouter.com/), one lazily loaded chunk per page
- **Bundler & Tooling**: [Vite 8](https://vite.dev/), [Vitest](https://vitest.dev/), [ESLint](https://eslint.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (`@tailwindcss/vite`) with semantic design tokens
- **Inference**: [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html) (WebGPU and WASM)
- **Typography**: Shippori Mincho (display) and Zen Kaku Gothic New (text), self-hosted `woff2`
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)

---

## Directory Structure

```text
frontend/
├── public/
│   └── favicon.svg                 # Brand mark, follows the light/dark theme
├── vite/
│   └── ortRuntime.ts               # Serves ONNX Runtime Web files at /ort/ in dev, copies them to dist/ort
├── src/
│   ├── app/                        # App shell
│   │   ├── layouts/RootLayout.tsx  # Navbar, page outlet, footer
│   │   ├── providers/              # LocaleProvider (id/en), ThemeProvider (light/dark/system)
│   │   ├── paths.ts                # All route paths in one place
│   │   └── router.tsx              # Routes with lazy-loaded pages
│   │
│   ├── components/
│   │   ├── brand/                  # BrandMark
│   │   ├── shared/                 # Navbar, MobileNav, SettingsMenu, Footer, PageHeader, ...
│   │   └── ui/                     # Button, Tabs, Accordion, Alert, SegmentedControl
│   │
│   ├── content/                    # Every page text, Indonesian + English (both required)
│   │
│   ├── features/
│   │   ├── home/                   # Hero tray, modes, counting area demo, 3-step workflow
│   │   ├── faq/                    # FAQ section (shown on Home)
│   │   ├── about/                  # Chapters: detection, dataset, preprocessing, model, evaluation
│   │   └── counting/               # The Count page
│   │       ├── components/         # CountWorkspace, CameraCounter, VideoCounter, ImageCounter,
│   │       │                       # CountingAreaEditor, LiveBoxesCanvas, CountDisplay, ...
│   │       ├── hooks/              # useCamera, useLiveDetection, useDetector, useImageCount,
│   │       │                       # useCountingArea, usePrefetchDetector
│   │       ├── lib/                # Pure logic + tests: letterbox, postprocess, tracker,
│   │       │                       # countSmoother, countingArea, frameAction, resizeImage, ...
│   │       └── worker/             # detector.worker, detectorClient, protocol, runtimeFiles
│   │
│   ├── pages/                      # HomePage, CountPage, AboutPage, NotFoundPage
│   ├── services/                   # Axios client and API types
│   └── styles/                     # theme.css (tokens), index.css (type scale, motion), fonts
│
├── .env.example                    # VITE_API_URL for production builds
├── index.html
├── package.json
└── vite.config.ts                  # @/ alias, API proxy, COOP/COEP headers, phone mode
```

---

## Architecture & Key Features

### 1. Three counting modes
The Count page has three tabs: **Camera** (default), **Photo**, and **Video**. The tab is kept in the URL (`/count?mode=image`), so Home can link straight to a mode.

| Mode | Where the model runs | Flow |
| :--- | :--- | :--- |
| Camera | Browser worker | Back camera → frame → detect → track → draw |
| Video | Browser worker | Local file → frame → detect → track → draw (the file is never uploaded) |
| Photo | Backend | Resize to ≤1280 px (JPEG 0.9) → `POST /api/v1/predict` → boxes drawn on the photo |

### 2. Model in a Web Worker
`detectorClient` owns one shared worker. The worker loads ONNX Runtime Web, picks **WebGPU** when available and **WASM** otherwise, and answers one `detect` message at a time, so the main thread only draws. Frames are sent as `ImageBitmap`, and the input tensor buffer is reused between frames.

### 3. Two-stage model loading
Home and About **never run the model**. When the browser is idle, they download the model and runtime files into the normal HTTP cache (skipped on Save-Data and slow 2G/3G connections). The Count page then only has to start the session. The model URL carries the run id (`/api/v1/model/file?v=<run_id>`), so a cached copy stays valid until a new model is promoted.

### 4. Same math as Python
`lib/letterbox.ts` and `lib/postprocess.ts` copy the backend's preprocessing and postprocessing: letterbox to 640 with gray padding (rounding half to even, like Python), `score >= conf_threshold`, NMS with IoU 0.7, and boxes mapped back to the frame. `postprocess.test.ts` checks them against `lib/fixtures/parity.json`, which is generated from the real Python predictor.

### 5. Stable live counts
Raw detections flicker, so the live modes add two small steps:

- **Tracker** (`lib/tracker.ts`): a new pill needs a score of at least 0.65 and must be seen in 2 rounds; it is kept while its score stays above 0.4 and dropped after 3 missed rounds. Detections are matched to tracks by center distance (at most one pill size).
- **Count smoother** (`lib/countSmoother.ts`): the number on screen is the most frequent count of the last 5 rounds.

Detection runs as fast as the device allows, while `LiveBoxesCanvas` draws interpolated boxes on every animation frame, so boxes move smoothly between detections.

### 6. Counting area
The user drags 4 corner points (pointer or arrow keys). The area is stored as fractions of the frame (0 to 1), so one area works for all three modes. The image is cropped to the area's bounding box, the outside of the quadrilateral is painted gray, and a pill counts only if its box center is inside.

### 7. Bilingual content and themes
All text lives in `src/content/*.content.ts` as `{ id, en }` pairs; a missing translation is a type error. The theme follows the system by default and can be switched to light or dark from the settings menu (laptop) or the mobile menu.

### 8. Code rules
- Imports go one way: `pages → features → components`. A feature never imports another feature.
- `lib/` files are pure functions with tests next to them.
- Colors and fonts come only from tokens in `styles/theme.css`.
- Imports use the `@/` alias for `src/`.

---

## Getting Started

### 1. Prerequisites
- **Node.js** 20+ and npm
- **Backend** running at `http://127.0.0.1:8000` (see [`backend/README.md`](../backend/README.md))

### 2. Install
```bash
npm install
```

### 3. Development Server
```bash
npm run dev
```
Open `http://localhost:5173/`. Requests to `/api` and `/health` are proxied to the backend.

The dev and preview servers send `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers, which ONNX Runtime Web needs for multi-threaded WASM.

### 4. Testing on a Phone
```bash
npm run dev:phone
```
This mode serves over HTTPS with a self-signed certificate (browsers only allow the camera on secure pages) and listens on the local network. Open the printed network address on a phone in the same Wi-Fi and accept the certificate warning.

### 5. Debug Panel
Open `/count?debug=1` to see the active backend (WebGPU or WASM), timings, and a side-by-side comparison of the browser count and the server count for the same image.

### 6. Production Build
```bash
npm run build      # type check + bundle into dist/ (includes dist/ort)
npm run preview    # serve dist/ locally
```
For a deployed build, copy `.env.example` to `.env` and set `VITE_API_URL` to the backend address.

---

## Quality Assurance & Testing

```bash
# Unit tests (110 tests, Vitest)
npm test

# Lint
npm run lint

# Type check
npx tsc -b
```
