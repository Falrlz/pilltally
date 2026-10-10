import type { DemoMode } from '@/features/home/lib/workflowScene'

interface ModeFrameProps {
  mode: DemoMode
  // Small tag in the top-left corner: "Live", "Foto", "Video"
  tag: string
}

// How the tray is seen, drawn over the picture (viewBox 320 × 220):
// camera = viewfinder brackets with a blinking live square,
// photo  = a print's light border,
// video  = a player bar along the bottom rim.
// It never catches the pointer, so the corners below stay draggable.
export function ModeFrame({ mode, tag }: ModeFrameProps) {
  return (
    // key: a new mode fades its frame in
    <g key={mode} className="pointer-events-none motion-safe:animate-word-fade">
      {mode === 'camera' && <CameraBrackets />}
      {mode === 'image' && <PhotoBorder />}
      {mode === 'video' && <PlayerBar />}
      <FrameTag mode={mode} tag={tag} />
    </g>
  )
}

function CameraBrackets() {
  // One L in each corner of the picture
  const path = 'M10 32 V10 H32 M288 10 H310 V32 M310 188 V210 H288 M32 210 H10 V188'
  return <path d={path} fill="none" className="stroke-pill" strokeWidth="2.5" />
}

function PhotoBorder() {
  return <rect x="2" y="2" width="316" height="216" fill="none" className="stroke-pill" strokeWidth="4" />
}

function PlayerBar() {
  return (
    <g>
      {/* The bar lies on the bronze rim under the floor */}
      <line x1="40" y1="212" x2="300" y2="212" className="stroke-pill" strokeWidth="2" opacity="0.3" />
      {/* Played part: grows from the left again and again */}
      <line
        x1="40"
        y1="212"
        x2="300"
        y2="212"
        className="stroke-pill motion-safe:animate-video-progress"
        strokeWidth="2"
        style={{ transformBox: 'fill-box', transformOrigin: 'left center' }}
      />
      {/* Play triangle */}
      <path d="M22 207 L30 212 L22 217 Z" className="fill-pill" />
    </g>
  )
}

function FrameTag({ mode, tag }: ModeFrameProps) {
  // A dark plate behind the tag keeps it readable over the floor
  const plateWidth = 30 + tag.length * 7

  return (
    <g>
      <rect x="16" y="16" width={plateWidth} height="17" className="fill-bronze" opacity="0.85" />
      {mode === 'camera' ? (
        // Live: an iris square that blinks like a recording light
        <rect x="22" y="21" width="7" height="7" className="fill-primary motion-safe:animate-live-blink" />
      ) : (
        <rect x="22" y="21" width="7" height="7" className="fill-pill" />
      )}
      <text
        x="35"
        y="28"
        className="fill-pill font-sans uppercase"
        fontSize="9"
        fontWeight="500"
        letterSpacing="1.6"
      >
        {tag}
      </text>
    </g>
  )
}
