import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/client.js';
import * as schema from '../db/schema.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { hashPassword, verifyPassword, generateJWT, generateApiKey } from '../lib/auth.js';
import { authenticate } from '../middleware/authenticate.js';
const router = Router();
// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password || password.length < 8) {
        return res.status(400).json({ error: 'Valid email and password (min 8 chars) required' });
    }
    try {
        const existing = await db.select({ id: schema.users.id })
            .from(schema.users)
            .where(eq(schema.users.email, email))
            .then((r) => r[0]);
        if (existing) {
            return res.status(400).json({ error: 'Email already taken' });
        }
        const userId = uuidv4();
        const passwordHash = await hashPassword(password);
        const apiKey = generateApiKey();
        const [user] = await db.insert(schema.users).values({
            id: userId,
            email,
            passwordHash,
            apiKey
        }).returning();
        const token = generateJWT(userId);
        const { passwordHash: _, ...safeUser } = user;
        res.status(201).json({ token, user: safeUser });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    try {
        const user = await db.select()
            .from(schema.users)
            .where(eq(schema.users.email, email))
            .then((r) => r[0]);
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = generateJWT(user.id);
        const { passwordHash: _, ...safeUser } = user;
        res.json({ token, user: safeUser });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
    res.json(req.user);
});
// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logged out' });
});
// POST /api/auth/regenerate-key
router.post('/regenerate-key', authenticate, async (req, res) => {
    const newKey = generateApiKey();
    try {
        await db.update(schema.users)
            .set({ apiKey: newKey })
            .where(eq(schema.users.id, req.user.id));
        res.json({ api_key: newKey });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/auth/mcp-status
router.get('/mcp-status', authenticate, async (req, res) => {
    try {
        const lastActivity = await db.select({ timestamp: schema.activities.timestamp })
            .from(schema.activities)
            .where(and(eq(schema.activities.userId, req.user.id), sql `timestamp >= datetime('now', '-5 minutes')`))
            .orderBy(desc(schema.activities.timestamp))
            .limit(1)
            .then((r) => r[0]);
        res.json({
            connected: !!lastActivity,
            last_seen: lastActivity?.timestamp || null
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
