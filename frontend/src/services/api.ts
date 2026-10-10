import axios from 'axios'
import type { HealthResponse, ModelInfo, PredictResponse } from './types'

// Development: empty, so requests go to the Vite proxy (vite.config.ts).
// Production: the backend URL, set in frontend/.env (see .env.example).
const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

export async function getHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>('/health')
  return response.data
}

export async function getModelInfo(): Promise<ModelInfo> {
  const response = await apiClient.get<ModelInfo>('/api/v1/model/info')
  return response.data
}

/**
 * Full URL of the ONNX model for the browser.
 * ?v=<run_id>: the backend lets the browser cache this file forever,
 * and a new model has a new run_id, so it is downloaded again.
 */
export function getModelFileUrl(runId: string): string {
  const path = `${API_BASE_URL}/api/v1/model/file?v=${encodeURIComponent(runId)}`
  return new URL(path, window.location.origin).href
}

// Upload + counting can be slow on mobile networks, so wait longer than usual
const PREDICT_TIMEOUT_MS = 30000

/**
 * Count the pills in one image (the backend runs the model).
 * area: 4 points [x, y] in pixels of this image; only pills inside are counted.
 */
export async function predictImage(image: Blob, area: [number, number][] | null = null): Promise<PredictResponse> {
  const formData = new FormData()
  formData.append('file', image, 'image.jpg')
  if (area !== null) {
    formData.append('area', JSON.stringify(area))
  }

  const response = await apiClient.post<PredictResponse>('/api/v1/predict', formData, {
    timeout: PREDICT_TIMEOUT_MS,
  })
  return response.data
}
