// Shapes of the backend responses. Keep in sync with backend/app/schemas/.

// GET /health (backend/app/schemas/health.py)
export interface HealthResponse {
  status: 'ok' | 'degraded'
  model_loaded: boolean
}

// GET /api/v1/model/info (backend/app/schemas/model.py)
export interface ModelInfo {
  run_id: string
  run_name: string
  promoted_at: string
  imgsz: number
  conf_threshold: number
  val: Record<string, number>
  test: Record<string, number>
}

// One detected pill, in pixels of the uploaded image (backend/app/schemas/predict.py)
export interface Box {
  x1: number
  y1: number
  x2: number
  y2: number
  score: number
}

// POST /api/v1/predict (backend/app/schemas/predict.py)
export interface PredictResponse {
  count: number
  boxes: Box[]
  image_width: number
  image_height: number
  conf_threshold: number
  inference_ms: number
}
