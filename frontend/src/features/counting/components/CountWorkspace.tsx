import { Camera, Image as ImageIcon, Video } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { useLocalized } from '@/app/providers/localeContext'
import { Alert } from '@/components/ui/Alert'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { countContent } from '@/content/count.content'
import { useCountingArea } from '../hooks/useCountingArea'
import { CameraCounter } from './CameraCounter'
import { DetectorDebugPanel } from './DetectorDebugPanel'
import { ImageCounter } from './ImageCounter'
import { VideoCounter } from './VideoCounter'

type CountMode = 'camera' | 'image' | 'video'

const DEFAULT_MODE: CountMode = 'camera'
const TABS_ID = 'count-mode'

// The mode comes from the URL (?mode=image), so Home can link to a tab
function readMode(value: string | null): CountMode {
  if (value === 'camera' || value === 'image' || value === 'video') {
    return value
  }
  return DEFAULT_MODE
}

// Everything on the Count page: mode tabs, the chosen mode, disclaimer
export function CountWorkspace() {
  const content = useLocalized(countContent)
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = readMode(searchParams.get('mode'))
  // /count?debug=1 shows the developer test panel
  const isDebug = searchParams.get('debug') === '1'
  // One counting area for all tabs
  const countingArea = useCountingArea()

  function changeMode(nextMode: CountMode) {
    // replace: switching tabs does not add steps to the browser's Back button
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('mode', nextMode)
    setSearchParams(nextParams, { replace: true })
  }

  const tabs: TabItem<CountMode>[] = [
    { value: 'camera', label: content.modes.camera, icon: <Camera className="size-4" aria-hidden="true" /> },
    { value: 'image', label: content.modes.image, icon: <ImageIcon className="size-4" aria-hidden="true" /> },
    { value: 'video', label: content.modes.video, icon: <Video className="size-4" aria-hidden="true" /> },
  ]

  return (
    <div className="space-y-6">
      <Tabs label={content.modesLabel} idPrefix={TABS_ID} tabs={tabs} value={mode} onChange={changeMode} />

      <div role="tabpanel" id={`${TABS_ID}-panel-${mode}`} aria-labelledby={`${TABS_ID}-tab-${mode}`}>
        {mode === 'camera' && <CameraCounter isDebug={isDebug} countingArea={countingArea} />}
        {mode === 'image' && <ImageCounter countingArea={countingArea} />}
        {mode === 'video' && <VideoCounter isDebug={isDebug} countingArea={countingArea} />}
      </div>

      <Alert variant="warning">{content.disclaimer}</Alert>

      {isDebug && <DetectorDebugPanel />}
    </div>
  )
}
