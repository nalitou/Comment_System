import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import type { Role } from '../types'

export interface AuthedRequest extends Request {
  auth?: { userId: string; role: Role }
}

export function signToken(payload: { userId: string; role: Role }) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.tokenExpiresIn })
}

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const hdr = req.header('Authorization')
  const token = hdr?.startsWith('Bearer ') ? hdr.slice(7) : null
  if (!token) return res.status(401).json({ message: '未登录' })
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any
    req.auth = { userId: String(decoded.userId), role: decoded.role as Role }
    next()
  } catch {
    return res.status(401).json({ message: '登录已失效' })
  }
}

export function adminRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  authRequired(req, res, () => {
    if (req.auth?.role !== 'admin') return res.status(403).json({ message: '需要管理员权限' })
    next()
  })
}
