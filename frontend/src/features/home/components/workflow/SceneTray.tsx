import { SCENE_BODY, SCENE_FLOOR, SCENE_PILLS } from '@/features/home/lib/workflowScene'
import { PillShape } from '../tray/TrayPills'

// The mini counting tray of the step pictures: bronze body, lighter floor,
// and all pills (the same in every step). Units: viewBox 320 × 220.
export function SceneTray() {
  return (
    <g>
      <rect
        x={SCENE_BODY.x}
        y={SCENE_BODY.y}
        width={SCENE_BODY.width}
        height={SCENE_BODY.height}
        rx={SCENE_BODY.radius}
        className="fill-bronze"
      />
      <rect
        x={SCENE_FLOOR.x}
        y={SCENE_FLOOR.y}
        width={SCENE_FLOOR.width}
        height={SCENE_FLOOR.height}
        rx={SCENE_FLOOR.radius}
        className="fill-pine"
        opacity="0.32"
      />
      {SCENE_PILLS.map((pill) => (
        <PillShape key={pill.id} pill={pill} />
      ))}
    </g>
  )
}
