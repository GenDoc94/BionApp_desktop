import type Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { getMeta, setMeta, sha256 } from './db'
import type { AuthUser, Role, UserSession } from '../shared/types'

const ADMIN_CODE_META = 'admin_code_hash'

export function hasUsers(db: Database.Database): boolean {
  const row = db.prepare('SELECT 1 AS ok FROM users LIMIT 1').get() as { ok: number } | undefined
  return !!row
}

export function hasAdminCode(db: Database.Database): boolean {
  return !!getMeta(db, ADMIN_CODE_META)
}

function toSession(row: { id: string; username: string; role: Role }): UserSession {
  return {
    id: row.id,
    email: row.username,
    username: row.username,
    role: row.role
  }
}

export function toAuthUser(session: UserSession): AuthUser {
  return { id: session.id, email: session.email }
}

export function login(
  db: Database.Database,
  email: string,
  password: string
): UserSession | null {
  const row = db
    .prepare('SELECT id, username, password_hash, role FROM users WHERE username = ? COLLATE NOCASE')
    .get(email.trim()) as
    | { id: string; username: string; password_hash: string; role: Role }
    | undefined
  if (!row) return null
  if (!bcrypt.compareSync(password, row.password_hash)) return null
  return toSession(row)
}

export function createUser(
  db: Database.Database,
  payload: { email: string; password: string; role: Role; adminCode: string }
): { user?: { id: string; email: string; role: Role }; error?: string; status?: number } {
  const email = payload.email.trim()
  const password = payload.password
  const role = payload.role
  const adminCode = payload.adminCode

  if (!email || !password || !adminCode) {
    return { error: 'Completa correo, contraseña y código admin', status: 400 }
  }
  if (role !== 'user' && role !== 'admin') {
    return { error: 'Rol no válido', status: 400 }
  }
  if (password.length < 4) {
    return { error: 'La contraseña es demasiado corta', status: 400 }
  }

  const storedHash = getMeta(db, ADMIN_CODE_META)
  const receivedHash = sha256(adminCode)

  if (!storedHash) {
    // Primera creación: el código admin queda fijado en esta carpeta de datos
    setMeta(db, ADMIN_CODE_META, receivedHash)
  } else if (storedHash !== receivedHash) {
    return { error: 'Código admin incorrecto', status: 403 }
  }

  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE')
    .get(email) as { id: string } | undefined
  if (existing) {
    return { error: 'Ya existe un usuario con ese correo', status: 409 }
  }

  const id = crypto.randomUUID()
  const password_hash = bcrypt.hashSync(password, 10)
  db.prepare(
    'INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run(id, email, password_hash, role)

  return { user: { id, email, role } }
}

export function getProfileRole(
  db: Database.Database,
  username: string
): Role | null {
  const row = db
    .prepare('SELECT role FROM users WHERE username = ? COLLATE NOCASE')
    .get(username.trim()) as { role: Role } | undefined
  return row?.role ?? null
}
