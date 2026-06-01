import Dashboard from './components/Dashboard'
import { I18nContext, useI18nProvider } from './i18n'

export default function App() {
  const i18n = useI18nProvider()
  return (
    <I18nContext.Provider value={i18n}>
      <Dashboard />
    </I18nContext.Provider>
  )
}
