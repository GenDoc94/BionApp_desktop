'use strict'

const fs = require('fs')
const path = require('path')
const ResEdit = require('resedit')

/** Español (España) — LANGID 0x0C0A */
const LANG_ES_ES = 3082
const CODEPAGE_UTF16 = 1200

const VERSION_STRINGS = {
  FileDescription: 'BionApp Desktop (beta)',
  ProductName: 'BionApp',
  CompanyName: 'GenDoc94',
  LegalCopyright: 'Copyright © GenDoc94',
  Comments: 'Autor: GenDoc94',
  InternalName: 'BionApp',
  OriginalFilename: 'BionApp.exe',
}

function parseVersionParts(version) {
  const [maj = 0, min = 0, pat = 0] = String(version || '0.0.0')
    .split('.')
    .map((n) => parseInt(n, 10) || 0)
  return [maj, min, pat, 0]
}

function applyWinExeMetadata(exePath, version) {
  if (!fs.existsSync(exePath)) {
    console.warn(`[win-exe-metadata] No encontrado: ${exePath}`)
    return
  }

  const [maj, min, pat, build] = parseVersionParts(version)
  const data = fs.readFileSync(exePath)
  const exe = ResEdit.NtExecutable.from(data, { ignoreCert: true })
  const res = ResEdit.NtExecutableResource.from(exe)
  const viList = ResEdit.Resource.VersionInfo.fromEntries(res.entries)

  if (!viList.length) {
    console.warn(`[win-exe-metadata] Sin VersionInfo en ${exePath}`)
    return
  }

  const vi = viList[0]

  for (const lang of vi.getAllLanguagesForStringValues()) {
    vi.removeAllStringValues(lang, true)
  }

  vi.setStringValues({ lang: LANG_ES_ES, codepage: CODEPAGE_UTF16 }, VERSION_STRINGS, true)
  vi.setFileVersion(maj, min, pat, build, LANG_ES_ES)
  vi.setProductVersion(maj, min, pat, build, LANG_ES_ES)
  vi.outputToResourceEntries(res.entries)
  res.outputResource(exe)
  fs.writeFileSync(exePath, Buffer.from(exe.generate()))
  console.log(`[win-exe-metadata] OK → ${path.basename(exePath)} (es-ES)`)
}

/**
 * Tras empaquetar win-unpacked (antes del portable).
 * No se toca el .exe portable final: modificar su PE rompería el SFX.
 */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return
  const exeName = `${context.packager.appInfo.productFilename}.exe`
  const exePath = path.join(context.appOutDir, exeName)
  applyWinExeMetadata(exePath, context.packager.appInfo.version)
}
