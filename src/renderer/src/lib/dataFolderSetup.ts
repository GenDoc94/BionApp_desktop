import type { DataFolderInspection } from '@shared/types'

export function setupNeedsNewAdminCode(
  info: DataFolderInspection | null | undefined
): boolean {
  if (!info) return false
  return info.needsNewAdminCode
}
