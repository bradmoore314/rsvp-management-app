#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../services/db');

function normalizeCollection(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return Object.values(value);
}

async function ensureUser(db, cache, email, name) {
    const key = (email || '').toLowerCase().trim() || 'host@example.com';
    if (cache.has(key)) {
        return cache.get(key);
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', key);
    if (existing) {
        cache.set(key, existing.id);
        return existing.id;
    }

    const id = uuidv4();
    await db.run('INSERT INTO users (id, email, name) VALUES (?, ?, ?)', id, key, name || email || 'Legacy Host');
    cache.set(key, id);
    return id;
}

async function importData(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Legacy data file not found: ${filePath}`);
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const payload = JSON.parse(raw);
    const db = await getDB();

    const usersCache = new Map();
    const eventOwners = new Map();

    await db.exec('BEGIN');

    try {
        const events = normalizeCollection(payload.events);
        for (const event of events) {
            const email = event.hostEmail || event.host_email || 'host@example.com';
            const name = event.hostName || event.host_name || null;
            const userId = await ensureUser(db, usersCache, email, name);
            const id = event.id || uuidv4();
            eventOwners.set(id, userId);

            await db.run(
                `INSERT OR REPLACE INTO events (id, user_id, name, description, date, time, location, host_name, host_email, image_url, status, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), COALESCE(?, CURRENT_TIMESTAMP))`,
                id,
                userId,
                event.name || 'Untitled Event',
                event.description || null,
                event.date || null,
                event.time || null,
                event.location || null,
                event.hostName || event.host_name || null,
                email,
                event.imageUrl || event.image_url || null,
                event.status || 'active',
                event.created || event.created_at || null,
                event.updated || event.updated_at || null
            );
        }

        const invites = normalizeCollection(payload.invites);
        for (const invite of invites) {
            const eventId = invite.eventId || invite.event_id;
            if (!eventId || !eventOwners.has(eventId)) {
                continue;
            }
            const id = invite.id || uuidv4();
            await db.run(
                `INSERT OR REPLACE INTO invites (id, event_id, rsvp_url, qr_code_data_url, created_at)
                 VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
                id,
                eventId,
                invite.rsvpUrl || invite.rsvp_url || '',
                invite.qrCodeDataURL || invite.qr_code_data_url || null,
                invite.created || invite.created_at || null
            );
        }

        const rsvps = normalizeCollection(payload.rsvps);
        for (const rsvp of rsvps) {
            const eventId = rsvp.eventId || rsvp.event_id;
            const inviteId = rsvp.inviteId || rsvp.invite_id;
            if (!eventId || !eventOwners.has(eventId)) {
                continue;
            }
            const id = rsvp.id || uuidv4();
            await db.run(
                `INSERT OR REPLACE INTO rsvps (id, event_id, invite_id, guest_name, guest_email, guest_phone, attendance, guest_count, message, submitted_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
                id,
                eventId,
                inviteId || null,
                rsvp.guestName || rsvp.guest_name || 'Guest',
                rsvp.guestEmail || rsvp.guest_email || null,
                rsvp.guestPhone || rsvp.guest_phone || null,
                rsvp.attendance || 'yes',
                Number(rsvp.guestCount || rsvp.guest_count || 1),
                rsvp.message || null,
                rsvp.submittedAt || rsvp.submitted_at || null
            );
        }

        await db.exec('COMMIT');
        console.log('✅ Legacy data import completed');
    } catch (error) {
        await db.exec('ROLLBACK');
        throw error;
    }
}

(async () => {
    try {
        const fileArg = process.argv[2];
        const filePath = fileArg ? path.resolve(fileArg) : path.join(process.cwd(), 'legacy-state.json');
        console.log(`📥 Importing legacy data from ${filePath}`);
        await importData(filePath);
        const db = await getDB();
        await db.close();
    } catch (error) {
        console.error('❌ Import failed:', error.message);
        process.exit(1);
    }
})();
