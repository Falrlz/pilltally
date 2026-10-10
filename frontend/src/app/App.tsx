import { RouterProvider } from 'react-router/dom'
import { LocaleProvider } from '@/app/providers/LocaleProvider'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { router } from '@/app/router'

// Providers wrap the router, so every page can use useTheme() and useLocalized()
export default function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <RouterProvider router={router} />
      </LocaleProvider>
    </ThemeProvider>
  )
}
