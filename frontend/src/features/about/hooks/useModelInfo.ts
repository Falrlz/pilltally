import { useEffect, useState } from 'react'
import { getModelInfo } from '@/services/api'
import type { ModelInfo } from '@/services/types'

// The 3 possible situations of the request
export type ModelInfoState =
  | { status: 'loading' }
  | { status: 'success'; data: ModelInfo }
  | { status: 'error' }

// Loads /api/v1/model/info once when the component appears
export function useModelInfo(): ModelInfoState {
  const [state, setState] = useState<ModelInfoState>({ status: 'loading' })

  useEffect(() => {
    // If the page is left before the answer arrives, ignore the answer
    let isCancelled = false

    async function load() {
      try {
        const data = await getModelInfo()
        if (!isCancelled) {
          setState({ status: 'success', data })
        }
      } catch {
        if (!isCancelled) {
          setState({ status: 'error' })
        }
      }
    }

    load()
    return () => {
      isCancelled = true
    }
  }, [])

  return state
}
