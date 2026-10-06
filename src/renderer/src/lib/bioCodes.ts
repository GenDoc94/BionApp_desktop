/** BIO-80117 y PN 80117 son el mismo producto. */

export function normalizeBioCode(raw: string): string {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
  if (!s) return ""
  const m = s.match(/^(?:BIO-?)?(\d{4,6})$/)
  if (m) return `BIO-${m[1]}`
  if (s.startsWith("BIO-")) return s
  return `BIO-${s}`
}

export function bioToPn(bio: string): string {
  const n = normalizeBioCode(bio)
  const m = n.match(/^BIO-(.+)$/)
  return m ? m[1] : n
}

export function stripPnKitSuffix(pn: string): string {
  const m = String(pn ?? "").trim().match(/^(\d+)-\d+$/)
  return m ? m[1] : String(pn ?? "").trim()
}

export function pnMatchesBio(pn: string, bio: string): boolean {
  const a = stripPnKitSuffix(pn)
  const b = bioToPn(bio)
  if (!a || !b) return false
  return a.toLowerCase() === b.toLowerCase()
}

export function sameLn(a: string, b: string): boolean {
  return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase()
}

export function stockKey(bio: string, ln: string): string {
  return `${normalizeBioCode(bio)}::${String(ln ?? "").trim().toLowerCase()}`
}
