import { Router } from 'express'
import { authMiddleware } from '../auth.mjs'
import { getBoutiqueByInvite, loadSyncPayload, mergeSyncPayload } from '../db.mjs'

const router = Router()

router.get('/:inviteCode', authMiddleware, (req, res) => {
  const code = req.params.inviteCode
  const boutique = getBoutiqueByInvite(code)
  if (!boutique || boutique.id !== req.auth.boutiqueId) {
    res.status(403).json({ error: 'Accès refusé à cette boutique' })
    return
  }
  res.json(loadSyncPayload(code))
})

router.post('/:inviteCode', authMiddleware, (req, res) => {
  const code = req.params.inviteCode
  const boutique = getBoutiqueByInvite(code)
  if (!boutique || boutique.id !== req.auth.boutiqueId) {
    res.status(403).json({ error: 'Accès refusé à cette boutique' })
    return
  }
  try {
    const payload = mergeSyncPayload(code, boutique.id, req.body || {})
    res.json(payload)
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) })
  }
})

export default router
