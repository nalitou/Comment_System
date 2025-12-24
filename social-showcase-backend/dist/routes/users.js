import { Router } from 'express';
import { db } from '../db';
import { authRequired } from '../middleware/auth';
import { sanitizeUser } from './auth';
export const usersRouter = Router();
usersRouter.get('/users', authRequired, async (req, res) => {
    await db.read();
    const meId = req.auth.userId;
    const q = String(req.query.q || '').trim();
    let users = db.data.users.filter((u) => !u.deleted && u.id !== meId);
    if (q)
        users = users.filter((u) => u.phone.includes(q) || u.nickname.includes(q) || u.id.includes(q));
    users.sort((a, b) => b.createdAt - a.createdAt);
    return res.json(users.slice(0, 50).map(sanitizeUser));
});
usersRouter.get('/users/:id', authRequired, async (req, res) => {
    await db.read();
    const u = db.data.users.find((x) => x.id === req.params.id && !x.deleted);
    if (!u)
        return res.status(404).json({ message: '用户不存在' });
    return res.json(sanitizeUser(u));
});
