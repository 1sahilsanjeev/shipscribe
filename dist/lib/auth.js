import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db/client.js';
import * as schema from '../db/schema.js';
import { eq } from 'drizzle-orm';
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-change-this';
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '12');
export function generateApiKey() {
    return 'sk_live_' + crypto.randomBytes(16).toString('hex');
}
export async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}
export async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}
export function generateJWT(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}
export function verifyJWT(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
export async function validateApiKey(apiKey) {
    try {
        const user = await db.select()
            .from(schema.users)
            .where(eq(schema.users.apiKey, apiKey))
            .then((r) => r[0]);
        return user || null;
    }
    catch (error) {
        console.error('Error validating API key:', error);
        return null;
    }
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-char-encryption-key-here-!!!'; // 32 chars
const IV_LENGTH = 16;
export function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}
export function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
