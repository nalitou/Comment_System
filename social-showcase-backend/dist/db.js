import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'db.json');
function ensureDir(p) {
    if (!fs.existsSync(p))
        fs.mkdirSync(p, { recursive: true });
}
ensureDir(dataDir);
const defaultData = {
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
    sensitiveWords: ['傻逼', '妈的', '法轮功', '色情', '赌博', '毒品'],
};
const adapter = new JSONFile(dbFile);
export const db = new Low(adapter, defaultData);
export async function initDB() {
    await db.read();
    db.data ||= defaultData;
    await db.write();
}
export function getDataDir() {
    return dataDir;
}
