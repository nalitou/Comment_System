import jwt from 'jsonwebtoken';
import { config } from '../config';
export function signToken(payload) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.tokenExpiresIn });
}
export function authRequired(req, res, next) {
    const hdr = req.header('Authorization');
    const token = hdr?.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token)
        return res.status(401).json({ message: '未登录' });
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.auth = { userId: String(decoded.userId), role: decoded.role };
        next();
    }
    catch {
        return res.status(401).json({ message: '登录已失效' });
    }
}
export function adminRequired(req, res, next) {
    authRequired(req, res, () => {
        if (req.auth?.role !== 'admin')
            return res.status(403).json({ message: '需要管理员权限' });
        next();
    });
}
