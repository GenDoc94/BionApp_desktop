import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import type { DocumentoItem } from '../shared/types'

function safeFilename(raw: string): string | null {
  const base = path.basename(decodeURIComponent(raw)).trim()
  if (!base || base === '.' || base === '..' || /[<>:"|?*\x00-\x1f]/.test(base)) {
    return null
  }
  return base
}

export function documentosDir(dataPath: string): string {
  return path.join(dataPath, 'documentos')
}

export async function listDocumentos(dataPath: string): Promise<DocumentoItem[]> {
  const dir = documentosDir(dataPath)
  await fsp.mkdir(dir, { recursive: true })
  const entries = await fsp.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries
      .filter((e) => e.isFile())
      .map(async (e) => {
        const stat = await fsp.stat(path.join(dir, e.name))
        return {
          name: e.name,
          size: stat.size,
          updatedAt: stat.mtime.toISOString()
        }
      })
  )
  return files.sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export async function uploadDocumento(
  dataPath: string,
  name: string,
  data: ArrayBuffer | Buffer
): Promise<void> {
  const safe = safeFilename(name)
  if (!safe) throw new Error('Nombre de archivo no válido')
  const dir = documentosDir(dataPath)
  await fsp.mkdir(dir, { recursive: true })
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
  await fsp.writeFile(path.join(dir, safe), buf)
}

export async function deleteDocumento(dataPath: string, name: string): Promise<void> {
  const safe = safeFilename(name)
  if (!safe) throw new Error('Nombre de archivo no válido')
  const file = path.join(documentosDir(dataPath), safe)
  if (!fs.existsSync(file)) throw new Error('Archivo no encontrado')
  await fsp.unlink(file)
}

export async function readDocumento(
  dataPath: string,
  name: string
): Promise<{ name: string; data: Buffer }> {
  const safe = safeFilename(name)
  if (!safe) throw new Error('Nombre de archivo no válido')
  const file = path.join(documentosDir(dataPath), safe)
  if (!fs.existsSync(file)) throw new Error('Archivo no encontrado')
  return { name: safe, data: await fsp.readFile(file) }
}
