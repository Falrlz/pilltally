import { useModelInfo } from '@/features/about/hooks/useModelInfo'
import { DatasetChapter } from './DatasetChapter'
import { DetectionChapter } from './DetectionChapter'
import { EvaluationChapter } from './EvaluationChapter'
import { ModelChapter } from './ModelChapter'
import { PreprocessingChapter } from './PreprocessingChapter'

// The five chapters of the About page. Model info is loaded once here
// and passed to the chapters that need it.
export function AboutChapters() {
  const modelInfo = useModelInfo()

  let threshold: number | undefined = undefined
  if (modelInfo.status === 'success') {
    threshold = modelInfo.data.conf_threshold
  }

  return (
    <>
      <DetectionChapter threshold={threshold} />
      <DatasetChapter />
      <PreprocessingChapter />
      <ModelChapter modelInfo={modelInfo} />
      <EvaluationChapter modelInfo={modelInfo} />
    </>
  )
}
