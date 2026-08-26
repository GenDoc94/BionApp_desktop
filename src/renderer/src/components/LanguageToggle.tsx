import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { setAppLocale } from '../i18n'
import type { AppLocale } from '../../../shared/locale'

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation()
  const locale: AppLocale = i18n.language.startsWith('en') ? 'en' : 'es'

  return (
    <div className={`inline-flex rounded-md border border-border p-0.5 ${className}`.trim()}>
      <Button
        type="button"
        size="sm"
        variant={locale === 'es' ? 'default' : 'ghost'}
        className="h-9 px-3"
        onClick={() => void setAppLocale('es')}
      >
        Español
      </Button>
      <Button
        type="button"
        size="sm"
        variant={locale === 'en' ? 'default' : 'ghost'}
        className="h-9 px-3"
        onClick={() => void setAppLocale('en')}
      >
        English
      </Button>
    </div>
  )
}
