import { PATHS } from '@/app/paths'
import { useLocalized } from '@/app/providers/localeContext'
import { SectionContainer } from '@/components/shared/SectionContainer'
import { ButtonLink } from '@/components/ui/ButtonLink'
import { uiContent } from '@/content/ui.content'

export default function NotFoundPage() {
  const { notFound } = useLocalized(uiContent)

  return (
    <SectionContainer>
      <h1 className="text-3xl font-bold">{notFound.title}</h1>
      <ButtonLink to={PATHS.home} variant="secondary" className="mt-6">
        {notFound.backHome}
      </ButtonLink>
    </SectionContainer>
  )
}
