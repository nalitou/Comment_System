import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { config } from './config';
import { db } from './db';
import { now } from './utils';
export async function ensureSeeded() {
    await db.read();
    db.data ||= {
        users: [],
        smsCodes: [],
        posts: [],
        comments: [],
        ratings: [],
        friendRequests: [],
        friendships: [],
        files: [],
        videoJobs: [],
        aiTasks: [],
        sensitiveWords: [],
    };
    const data = db.data;
    const hasSuper = data.users.some((u) => u.phone === config.superUser.phone && !u.deleted);
    if (!hasSuper) {
        const u = {
            id: nanoid(),
            phone: config.superUser.phone,
            nickname: config.superUser.nickname,
            role: 'super_user',
            passwordHash: bcrypt.hashSync(config.superUser.password, 10),
            createdAt: now(),
        };
        data.users.push(u);
    }
    const hasAdmin = data.users.some((u) => u.role === 'admin' && !u.deleted);
    if (!hasAdmin) {
        const u = {
            id: nanoid(),
            phone: config.admin.phone,
            nickname: config.admin.nickname,
            role: 'admin',
            passwordHash: bcrypt.hashSync(config.admin.password, 10),
            createdAt: now(),
        };
        data.users.push(u);
    }
    if (!data.sensitiveWords?.length) {
        data.sensitiveWords = ['傻逼', '妈的', '法轮功', '色情', '赌博', '毒品'];
    }
    await db.write();
}
