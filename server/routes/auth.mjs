import { Router } from 'express'
import { customAlphabet } from 'nanoid'
import {
  getBoutiqueById,
  getBoutiqueByInvite,
  getUserById,
  getUsersByBoutique,
  publicUser,
  rowToBoutique,
  upsertBoutique,
  upsertUser,
  ensureSyncSnapshot,
} from '../db.mjs'
import { authMiddleware, hashPin, signToken, verifyPin } from '../auth.mjs'

const router = Router()
const newId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)
const inviteNano = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

function toBoutiqueResponse(row) {
  if (!row) return null
  if (row.inviteCode) return rowToBoutiqueFromClient(row)
  return rowToBoutique(row)
}

function rowToBoutiqueFromClient(b) {
  return {
    id: b.id,
    name: b.name,
    currency: b.currency,
    inviteCode: b.inviteCode,
    paperWidthMm: b.paperWidthMm,
    autoPrintTicket: !!b.autoPrintTicket,
    usdRateCdf: b.usdRateCdf,
    usdRateUpdatedAt: b.usdRateUpdatedAt,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }
}

function tokenResponse(userRow, boutiqueRow) {
  const user = publicUser(userRow)
  const boutique = toBoutiqueResponse(boutiqueRow)
  const token = signToken({
    sub: user.id,
    boutiqueId: boutique.id,
    role: user.role,
    inviteCode: boutique.inviteCode,
  })
  return { token, user, boutique }
}

router.post('/register-boutique', async (req, res) => {
  try {
    const { name, ownerName, pin, currency, usdRateCdf } = req.body || {}
    if (!name?.trim() || !ownerName?.trim() || !pin || String(pin).length < 4) {
      res.status(400).json({ error: 'Nom, propriétaire et PIN (4+ chiffres) requis' })
      return
    }

    const ts = Date.now()
    const boutique = {
      id: `boutique_${newId()}`,
      name: String(name).trim(),
      currency: currency || 'CDF',
      inviteCode: inviteNano(),
      paperWidthMm: 58,
      autoPrintTicket: false,
      usdRateCdf: usdRateCdf ?? 2800,
      usdRateUpdatedAt: ts,
      createdAt: ts,
      updatedAt: ts,
    }
    const owner = {
      id: `user_${newId()}`,
      boutiqueId: boutique.id,
      name: String(ownerName).trim(),
      role: 'proprietaire',
      pinHash: await hashPin(pin),
      active: true,
      createdAt: ts,
      updatedAt: ts,
    }

    upsertBoutique(boutique)
    upsertUser(owner)
    ensureSyncSnapshot(boutique.inviteCode, boutique.id)

    // Seed sync entities for boutique + owner
    const { mergeSyncPayload } = await import('../db.mjs')
    mergeSyncPayload(boutique.inviteCode, boutique.id, {
      entities: {
        boutiques: [{ ...boutique, pinHash: undefined }],
        users: [{ ...owner, pinHash: owner.pinHash }],
      },
      events: [],
    })

    res.status(201).json(tokenResponse(owner, boutique))
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) })
  }
})

router.post('/join', async (req, res) => {
  try {
    const { inviteCode, name, pin, role } = req.body || {}
    if (!inviteCode || !name?.trim() || !pin || String(pin).length < 4) {
      res.status(400).json({ error: 'Code invitation, nom et PIN requis' })
      return
    }

    const boutique = getBoutiqueByInvite(inviteCode)
    if (!boutique) {
      res.status(404).json({ error: 'Code invitation invalide' })
      return
    }

    const ts = Date.now()
    const user = {
      id: `user_${newId()}`,
      boutiqueId: boutique.id,
      name: String(name).trim(),
      role: role === 'gerant' ? 'gerant' : 'vendeur',
      pinHash: await hashPin(pin),
      active: true,
      createdAt: ts,
      updatedAt: ts,
    }
    upsertUser(user)

    const { mergeSyncPayload } = await import('../db.mjs')
    mergeSyncPayload(boutique.inviteCode, boutique.id, {
      entities: { users: [{ ...user, pinHash: user.pinHash }] },
      events: [],
    })

    res.status(201).json(tokenResponse(user, boutique))
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { boutiqueId, inviteCode, pin, userId } = req.body || {}
    if (!pin || String(pin).length < 4) {
      res.status(400).json({ error: 'PIN requis' })
      return
    }

    let boutique = boutiqueId ? getBoutiqueById(boutiqueId) : null
    if (!boutique && inviteCode) boutique = getBoutiqueByInvite(inviteCode)
    if (!boutique) {
      res.status(404).json({ error: 'Boutique introuvable' })
      return
    }

    const users = getUsersByBoutique(boutique.id).filter((u) => u.active)
    let userRow = null
    if (userId) {
      const candidate = users.find((u) => u.id === userId)
      if (candidate && (await verifyPin(pin, candidate.pin_hash))) userRow = candidate
    } else {
      for (const u of users) {
        if (await verifyPin(pin, u.pin_hash)) {
          userRow = u
          break
        }
      }
    }

    if (!userRow) {
      res.status(401).json({ error: 'PIN incorrect' })
      return
    }

    res.json(tokenResponse(userRow, boutique))
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) })
  }
})

router.get('/me', authMiddleware, (req, res) => {
  const user = publicUser(getUserById(req.auth.sub))
  const boutique = getBoutiqueById(req.auth.boutiqueId)
  if (!user || !boutique) {
    res.status(404).json({ error: 'Session invalide' })
    return
  }
  res.json({ user, boutique })
})

router.get('/boutique/:inviteCode/users', authMiddleware, (req, res) => {
  const boutique = getBoutiqueByInvite(req.params.inviteCode)
  if (!boutique || boutique.id !== req.auth.boutiqueId) {
    res.status(403).json({ error: 'Accès refusé' })
    return
  }
  res.json({ users: getUsersByBoutique(boutique.id).map(publicUser) })
})

export default router
