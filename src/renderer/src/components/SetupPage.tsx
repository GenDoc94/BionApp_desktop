import { useState } from 'react'
import logo from '../assets/BionApp.svg'
import { Button } from './ui/button'

export default function SetupPage({ onDone }: { onDone: (path: string) => Promise<void> }) {
  const [path, setPath] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="bionapp-subpage min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bionapp-panel shadow-sm p-6 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <img src={logo} alt="BionApp" className="h-14 w-auto" />
          <h1 className="text-lg font-semibold">BionApp escritorio</h1>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Elige la carpeta compartida donde se guardarán la base SQLite y los documentos.
          Puede ser una carpeta de red para varios PCs.
        </p>
        <Button
          variant="secondary"
          className="w-full"
          onClick={async () => {
            const p = await window.api.pickDataFolder()
            if (p) setPath(p)
          }}
        >
          Seleccionar carpeta…
        </Button>
        {path && (
          <code className="block text-xs break-all bg-muted/40 rounded p-2">{path}</code>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          className="w-full"
          disabled={!path || busy}
          onClick={async () => {
            if (!path) return
            setBusy(true)
            setError(null)
            try {
              await onDone(path)
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e))
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Preparando…' : 'Continuar'}
        </Button>
      </div>
    </div>
  )
}
