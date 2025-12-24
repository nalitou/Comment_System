import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from '../config';
import { db } from '../db';
import { adminRequired, signToken } from '../middleware/auth';
import { sanitizeUser } from './auth';
export const adminRouter = Router();
adminRouter.post('/admin/login', async (req, res) => {
    const schema = z.object({ username: z.string().min(1), password: z.string().min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ message: '参数错误' });
    const { username, password } = parsed.data;
    if (username !== config.admin.username)
        return res.status(400).json({ message: '账号或密码错误' });
    await db.read();
    const admin = db.data.users.find((u) => u.role === 'admin' && !u.deleted);
    if (!admin)
        return res.status(500).json({ message: '管理员未初始化' });
    const ok = admin.passwordHash ? bcrypt.compareSync(password, admin.passwordHash) : password === config.admin.password;
    if (!ok)
        return res.status(400).json({ message: '账号或密码错误' });
    const token = signToken({ userId: admin.id, role: 'admin' });
    return res.json({ token, admin: sanitizeUser(admin) });
});
adminRouter.get('/admin/users', adminRequired, async (req, res) => {
    await db.read();
    const q = String(req.query.q || '').trim();
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    let users = db.data.users.filter((u) => !u.deleted);
    if (q)
        users = users.filter((u) => u.phone.includes(q) || u.nickname.includes(q) || u.id.includes(q));
    users.sort((a, b) => b.createdAt - a.createdAt);
    const total = users.length;
    const items = users.slice((page - 1) * pageSize, page * pageSize).map(sanitizeUser);
    return res.json({ items, total });
});
adminRouter.delete('/admin/users/:id', adminRequired, async (req, res) => {
    await db.read();
    const id = req.params.id;
    const u = db.data.users.find((x) => x.id === id);
    if (!u)
        return res.status(404).json({ message: '用户不存在' });
    u.deleted = true;
    await db.write();
    return res.json({ success: true });
});
adminRouter.get('/admin/posts', adminRequired, async (req, res) => {
    await db.read();
    const q = String(req.query.q || '').trim();
    const tag = String(req.query.tag || '').trim();
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 10);
    let posts = [...db.data.posts];
    if (q)
        posts = posts.filter((p) => (p.title || '').includes(q) || (p.text || '').includes(q) || p.id.includes(q));
    if (tag)
        posts = posts.filter((p) => p.tags.includes(tag));
    posts.sort((a, b) => b.createdAt - a.createdAt);
    const total = posts.length;
    const items = posts.slice((page - 1) * pageSize, page * pageSize);
    return res.json({ items, total });
});
adminRouter.delete('/admin/posts/:id', adminRequired, async (req, res) => {
    await db.read();
    const id = req.params.id;
    db.data.posts = db.data.posts.filter((p) => p.id !== id);
    db.data.comments = db.data.comments.filter((c) => c.postId !== id);
    db.data.ratings = db.data.ratings.filter((r) => r.postId !== id);
    await db.write();
    return res.json({ success: true });
});
// 为了兼容当前前端实现：adminApi.stats() 实际请求的是 /admin/stats/active
adminRouter.get('/admin/stats/active', adminRequired, async (_req, res) => {
    await db.read();
    const posts = db.data.posts;
    const dayKey = (t) => {
        const d = new Date(t);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
    };
    const trendMap = new Map();
    const typeRatio = { text: 0, image: 0, video: 0, mixed: 0 };
    const tagMap = new Map();
    for (const p of posts) {
        trendMap.set(dayKey(p.createdAt), (trendMap.get(dayKey(p.createdAt)) || 0) + 1);
        const hasImg = p.media.some((m) => m.kind === 'image');
        const hasVid = p.media.some((m) => m.kind === 'video');
        if (!hasImg && !hasVid)
            typeRatio.text++;
        else if (hasImg && !hasVid)
            typeRatio.image++;
        else if (!hasImg && hasVid)
            typeRatio.video++;
        else
            typeRatio.mixed++;
        for (const t of p.tags)
            tagMap.set(t, (tagMap.get(t) || 0) + 1);
    }
    const trend = Array.from(trendMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));
    const topTags = Array.from(tagMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));
    return res.json({ trend, typeRatio, topTags });
});
// 额外拆分接口（可选，供后续扩展）
adminRouter.get('/admin/stats/posts-trend', adminRequired, async (req, res) => {
    req.url = '/admin/stats/active';
    return adminRouter.handle(req, res);
});
adminRouter.get('/admin/stats/type-ratio', adminRequired, async (req, res) => {
    req.url = '/admin/stats/active';
    return adminRouter.handle(req, res);
});
adminRouter.get('/admin/stats/top-tags', adminRequired, async (req, res) => {
    req.url = '/admin/stats/active';
    return adminRouter.handle(req, res);
});
