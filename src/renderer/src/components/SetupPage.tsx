import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import logo from '../assets/BionApp.svg'
import { translateIpcError } from '../i18n/ipcErrors'
import LanguageToggle from './LanguageToggle'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

export default function SetupPage({
  onDone
}: {
  onDone: (path: string, adminCode: string) => Promise<void>
}) {
  const { t } = useTranslation()
  const [path, setPath] = useState<string | null>(null)
  const [adminCode, setAdminCode] = useState('')
  const [adminCodeConfirm, setAdminCodeConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const codesMatch = adminCode.trim() === adminCodeConfirm.trim()
  const codesPartial = Boolean(adminCode.trim() || adminCodeConfirm.trim())
  const canContinue =
    Boolean(path) &&
    !busy &&
    (!codesPartial || (codesMatch && adminCode.trim().length >= 4))

  return (
    <div className="bionapp-subpage min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bionapp-panel shadow-sm p-6 space-y-4">
        <div className="flex justify-center">
          <LanguageToggle />
        </div>
        <div className="flex flex-col items-center gap-2">
          <img src={logo} alt="BionApp" className="h-14 w-auto" />
          <h1 className="text-lg font-semibold">{t('setup.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground text-center">{t('setup.body')}</p>

        <Button
          variant="secondary"
          className="w-full"
          onClick={async () => {
            const p = await window.api.pickDataFolder()
            if (p) setPath(p)
          }}
        >
          {t('setup.pickFolder')}
        </Button>
        {path && (
          <code className="block text-xs break-all bg-muted/40 rounded p-2">{path}</code>
        )}

        <div className="space-y-2">
          <Label htmlFor="admin-code" className="text-xs">
            {t('setup.adminCode')}
          </Label>
          <Input
            id="admin-code"
            type="password"
            autoComplete="new-password"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            placeholder={t('setup.adminCodePlaceholder')}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-code-confirm" className="text-xs">
            {t('setup.confirmCode')}
          </Label>
          <Input
            id="admin-code-confirm"
            type="password"
            autoComplete="new-password"
            value={adminCodeConfirm}
            onChange={(e) => setAdminCodeConfirm(e.target.value)}
            placeholder={t('setup.confirmPlaceholder')}
            className="h-9 text-sm"
          />
          {codesPartial && !codesMatch && (
            <p className="text-xs text-destructive">{t('setup.mismatch')}</p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          className="w-full"
          disabled={!canContinue}
          onClick={async () => {
            if (!path || !canContinue) return
            setBusy(true)
            setError(null)
            try {
              await onDone(path, adminCode.trim())
            } catch (e) {
              setError(translateIpcError(e instanceof Error ? e.message : String(e)))
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? t('setup.preparing') : t('setup.continue')}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">{t('setup.remember')}</p>
      </div>
    </div>
  )
}
