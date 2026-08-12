import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'boutique-locale-dev-secret-change-me'
const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d'

export async function hashPin(pin) {
  return bcrypt.hash(String(pin), 10)
}

export async function verifyPin(pin, hash) {
  return bcrypt.compare(String(pin), hash)
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Authentification requise' })
    return
  }
  const decoded = verifyToken(token)
  if (!decoded?.sub || !decoded?.boutiqueId) {
    res.status(401).json({ error: 'Session invalide ou expirée' })
    return
  }
  req.auth = decoded
  next()
}
