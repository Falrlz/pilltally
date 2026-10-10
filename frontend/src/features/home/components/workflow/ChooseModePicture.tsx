import { Camera, Image as ImageIcon, Video } from 'lucide-react'
import { SegmentedControl, type SegmentedOption } from '@/components/ui/SegmentedControl'
import type { HomeContent } from '@/content/home.content'
import type { DemoMode } from '@/features/home/lib/workflowScene'
import { ModeFrame } from './ModeFrame'
import { SceneTray } from './SceneTray'

type DemoTexts = HomeContent['workflow']['demo']

interface ChooseModePictureProps {
  mode: DemoMode
  texts: DemoTexts
  // What the chosen mode does, one sentence
  modeDescription: string
  onChooseMode: (mode: DemoMode) => void
}

// Step 1: the tray as the chosen mode sees it, with the three modes to pick from
export function ChooseModePicture({ mode, texts, modeDescription, onChooseMode }: ChooseModePictureProps) {
  const options: SegmentedOption<DemoMode>[] = [
    { value: 'camera', label: texts.modes.camera, icon: <Camera className="size-4" strokeWidth={1.5} aria-hidden="true" /> },
    { value: 'image', label: texts.modes.image, icon: <ImageIcon className="size-4" strokeWidth={1.5} aria-hidden="true" /> },
    { value: 'video', label: texts.modes.video, icon: <Video className="size-4" strokeWidth={1.5} aria-hidden="true" /> },
  ]

  return (
    <>
      <svg viewBox="0 0 320 220" role="img" aria-label={texts.sceneLabel} className="block h-auto w-full">
        <SceneTray />
        <ModeFrame mode={mode} tag={texts.frameTags[mode]} />
      </svg>
      <div className="mt-4">
        <SegmentedControl label={texts.modeGroupLabel} options={options} value={mode} onChange={onChooseMode} />
      </div>
      <p aria-live="polite" className="mt-3 text-sm leading-relaxed text-muted">
        {modeDescription}
      </p>
    </>
  )
}
