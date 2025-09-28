process.env.APP_URL = 'http://localhost:3000';
process.env.APP_ORIGIN = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_PATH = ':memory:';
process.env.GOOGLE_CLIENT_ID = 'test-client';
process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost/auth/google/callback';

const fs = require('fs');
const path = require('path');
const { getDB } = require('../services/db');

beforeAll(async () => {
    const db = await getDB();
    const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await db.exec(sql);
    }
});

beforeEach(async () => {
    const db = await getDB();
    await db.exec('DELETE FROM rsvps; DELETE FROM invites; DELETE FROM events; DELETE FROM users;');
});

afterAll(async () => {
    const db = await getDB();
    await db.close();
});
