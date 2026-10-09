import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { homeContent } from '@/content/home.content'
import { useIsLargeScreen } from '@/features/home/hooks/useIsLargeScreen'
import { useWorkflowDemo } from '@/features/home/hooks/useWorkflowDemo'
import { AreaPicture } from './workflow/AreaPicture'
import { ChooseModePicture } from './workflow/ChooseModePicture'
import { ResultPicture } from './workflow/ResultPicture'
import { WorkflowScroller } from './workflow/WorkflowScroller'
import { WorkflowStack } from './workflow/WorkflowStack'

// "Three steps, one result": one flow, 1 → 2 → 3, each step with a small
// picture you can play with. The three pictures share one scene, so the mode
// (1) and the area (2) decide the result (3).
// Laptops: steps on the left, read by scrolling; the picture of the current
// step stays in view on the right. Phones: steps stacked, picture under each.
export function WorkflowSection() {
  const { workflow, hero, modes } = useLocalized(homeContent)
  const demo = useWorkflowDemo()
  const isLarge = useIsLargeScreen()

  // What the chosen mode does: the same sentence as in "Start anywhere"
  let modeDescription = ''
  for (const item of modes.items) {
    if (item.id === demo.mode) {
      modeDescription = item.description
    }
  }

  // The picture for each step, in the order of workflow.steps
  const pictures = [
    <ChooseModePicture
      key="choose"
      mode={demo.mode}
      texts={workflow.demo}
      modeDescription={modeDescription}
      onChooseMode={demo.chooseMode}
    />,
    <AreaPicture
      key="area"
      mode={demo.mode}
      quad={demo.quad}
      texts={workflow.demo}
      cornerLabels={hero.cornerLabels}
      isAreaChanged={demo.isAreaChanged}
      onMoveCorner={demo.moveCorner}
      onResetArea={demo.resetArea}
    />,
    <ResultPicture
      key="result"
      mode={demo.mode}
      quad={demo.quad}
      insidePills={demo.insidePills}
      runId={demo.runId}
      isCounting={demo.isCounting}
      shownCount={demo.shownCount}
      selectedPill={demo.selectedPill}
      texts={workflow.demo}
      countLabel={hero.countLabel}
      // Phones: counting starts when the result picture comes into view.
      // Laptops: the scroller starts it when the reader reaches step 3.
      resultRef={isLarge ? undefined : demo.resultRef}
      onRecount={demo.recount}
      onSelectPill={demo.selectPill}
    />,
  ]

  return (
    <SectionContainer className="border-t border-border md:py-20 short:py-10">
      {isLarge ? (
        <WorkflowScroller
          heading={workflow.heading}
          steps={workflow.steps}
          pictures={pictures}
          onReachResult={demo.recount}
        />
      ) : (
        <>
          <h2 className="text-4xl leading-[1.1] md:text-5xl">{workflow.heading}</h2>
          <WorkflowStack steps={workflow.steps} pictures={pictures} />
        </>
      )}
    </SectionContainer>
  )
}
