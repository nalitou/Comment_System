import crypto from 'node:crypto';
export function now() {
    return Date.now();
}
export function pairKey(a, b) {
    return [a, b].sort().join('_');
}
export function maskSensitive(text, words) {
    const hits = [];
    let masked = text;
    for (const w of words) {
        if (!w)
            continue;
        if (masked.includes(w)) {
            hits.push(w);
            masked = masked.split(w).join('*'.repeat(w.length));
        }
    }
    return { hits, maskedText: masked, allowed: hits.length === 0 };
}
export function sha256(buf) {
    return crypto.createHash('sha256').update(buf).digest('hex');
}
