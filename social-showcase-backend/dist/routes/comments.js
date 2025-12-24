import { Router } from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db';
import { authRequired } from '../middleware/auth';
import { now } from '../utils';
export const commentsRouter = Router();
commentsRouter.get('/posts/:postId/comments', authRequired, async (req, res) => {
    await db.read();
    const postId = req.params.postId;
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 50);
    let all = db.data.comments.filter((c) => c.postId === postId && !c.deleted);
    all.sort((a, b) => a.createdAt - b.createdAt);
    const total = all.length;
    const items = all.slice((page - 1) * pageSize, page * pageSize);
    return res.json({ items, total });
});
commentsRouter.post('/posts/:postId/comments', authRequired, async (req, res) => {
    const schema = z.object({ content: z.string().min(1), parentId: z.string().optional() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ message: '参数错误' });
    await db.read();
    const c = {
        id: nanoid(),
        postId: req.params.postId,
        authorId: req.auth.userId,
        content: parsed.data.content.trim(),
        parentId: parsed.data.parentId,
        createdAt: now(),
    };
    db.data.comments.push(c);
    await db.write();
    return res.json(c);
});
commentsRouter.delete('/comments/:id', authRequired, async (req, res) => {
    await db.read();
    const c = db.data.comments.find((x) => x.id === req.params.id);
    if (!c)
        return res.status(404).json({ message: '评论不存在' });
    if (c.authorId !== req.auth.userId)
        return res.status(403).json({ message: '无权限' });
    c.deleted = true;
    await db.write();
    return res.json({ success: true });
});
