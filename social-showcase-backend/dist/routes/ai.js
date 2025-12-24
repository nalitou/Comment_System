import { Router } from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { db } from '../db';
import { authRequired } from '../middleware/auth';
import { maskSensitive, now } from '../utils';
export const aiRouter = Router();
function pickTags(text) {
    const candidates = ['旅行', '美食', '学习', '日常', '运动', '音乐', '电影', '校园', '作业', '演示'];
    const tags = [];
    for (const c of candidates)
        if (text.includes(c))
            tags.push(c);
    if (!tags.length)
        tags.push('日常');
    return Array.from(new Set(tags)).slice(0, 5);
}
async function writeTask(task) {
    task.updatedAt = now();
    db.data.aiTasks = db.data.aiTasks.filter((t) => t.id !== task.id);
    db.data.aiTasks.push(task);
    await db.write();
}
aiRouter.post('/ai/process', authRequired, async (req, res) => {
    const schema = z.object({ postId: z.string().optional(), text: z.string().optional(), actions: z.array(z.enum(['gen_title', 'gen_tags', 'summarize', 'safety'])).min(1) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ message: '参数错误' });
    await db.read();
    const t = now();
    const task = {
        id: nanoid(),
        status: 'queued',
        actions: parsed.data.actions,
        input: { postId: parsed.data.postId, text: parsed.data.text },
        createdAt: t,
        updatedAt: t,
    };
    db.data.aiTasks.push(task);
    await db.write();
    void (async () => {
        try {
            await db.read();
            task.status = 'processing';
            await writeTask(task);
            await new Promise((r) => setTimeout(r, 600));
            await db.read();
            let text = parsed.data.text || '';
            if (parsed.data.postId) {
                const p = db.data.posts.find((x) => x.id === parsed.data.postId);
                if (p)
                    text = [p.title || '', p.text || '', p.tags.join(' ')].join(' ').trim();
            }
            const result = {};
            if (task.actions.includes('gen_title'))
                result.title = (text || '分享').slice(0, 20);
            if (task.actions.includes('summarize'))
                result.summary = (text || '').slice(0, 120);
            if (task.actions.includes('gen_tags'))
                result.tags = pickTags(text || '');
            if (task.actions.includes('safety')) {
                const r = maskSensitive(text || '', db.data.sensitiveWords || []);
                result.safety = r.allowed ? { allowed: true } : { allowed: false, reason: `命中敏感词：${r.hits.join('、')}` };
            }
            task.status = 'success';
            task.result = result;
            await writeTask(task);
        }
        catch (e) {
            await db.read();
            task.status = 'failed';
            task.error = e?.message || 'AI 任务失败';
            await writeTask(task);
        }
    })();
    return res.json({ taskId: task.id });
});
aiRouter.get('/ai/task/:id', authRequired, async (req, res) => {
    await db.read();
    const task = db.data.aiTasks.find((t) => t.id === req.params.id);
    if (!task)
        return res.status(404).json({ message: '任务不存在' });
    return res.json(task);
});
