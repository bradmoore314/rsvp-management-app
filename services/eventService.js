const { v4: uuidv4 } = require('uuid');
const { getDB } = require('./db');

class EventService {
    async createEvent(userId, data) {
        const db = await getDB();
        const id = uuidv4();
        await db.run(
            `INSERT INTO events (id, user_id, name, description, date, time, location, host_name, host_email, image_url, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            id,
            userId,
            data.name,
            data.description || null,
            data.date || null,
            data.time || null,
            data.location || null,
            data.hostName || null,
            data.hostEmail || null,
            data.imageUrl || null,
            data.status || 'active'
        );
        return this.getEventForUser(userId, id);
    }

    async getEventForUser(userId, eventId) {
        const db = await getDB();
        return db.get('SELECT * FROM events WHERE id = ? AND user_id = ?', eventId, userId);
    }

    async getEventPublic(eventId) {
        const db = await getDB();
        return db.get('SELECT * FROM events WHERE id = ?', eventId);
    }

    async listEvents(userId) {
        const db = await getDB();
        return db.all('SELECT * FROM events WHERE user_id = ? ORDER BY created_at DESC', userId);
    }

    async deleteEvent(userId, eventId) {
        const db = await getDB();
        const result = await db.run('DELETE FROM events WHERE id = ? AND user_id = ?', eventId, userId);
        return result.changes > 0;
    }
}

module.exports = EventService;
