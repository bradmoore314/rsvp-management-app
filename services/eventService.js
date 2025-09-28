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

    async getEvent(eventId) {
        return this.getEventPublic(eventId);
    }

    async listEvents(userId) {
        const db = await getDB();
        return db.all('SELECT * FROM events WHERE user_id = ? ORDER BY created_at DESC', userId);
    }

    async getAllEvents() {
        const db = await getDB();
        return db.all('SELECT * FROM events ORDER BY created_at DESC');
    }

    async getEventsByHost(hostEmail) {
        const db = await getDB();
        return db.all('SELECT * FROM events WHERE host_email = ? ORDER BY created_at DESC', hostEmail);
    }

    async updateEvent(eventId, updateData) {
        const db = await getDB();
        const event = await db.get('SELECT * FROM events WHERE id = ?', eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        const fields = [];
        const values = [];

        if (updateData.name !== undefined) {
            fields.push('name = ?');
            values.push(updateData.name);
        }
        if (updateData.description !== undefined) {
            fields.push('description = ?');
            values.push(updateData.description);
        }
        if (updateData.date !== undefined) {
            fields.push('date = ?');
            values.push(updateData.date);
        }
        if (updateData.time !== undefined) {
            fields.push('time = ?');
            values.push(updateData.time);
        }
        if (updateData.location !== undefined) {
            fields.push('location = ?');
            values.push(updateData.location);
        }
        if (updateData.hostName !== undefined) {
            fields.push('host_name = ?');
            values.push(updateData.hostName);
        }
        if (updateData.hostEmail !== undefined) {
            fields.push('host_email = ?');
            values.push(updateData.hostEmail);
        }
        if (updateData.imageUrl !== undefined) {
            fields.push('image_url = ?');
            values.push(updateData.imageUrl);
        }
        if (updateData.status !== undefined) {
            fields.push('status = ?');
            values.push(updateData.status);
        }

        if (fields.length === 0) {
            return event;
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        values.push(eventId);

        await db.run(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, ...values);
        return this.getEvent(eventId);
    }

    async deleteEvent(userId, eventId) {
        const db = await getDB();
        const result = await db.run('DELETE FROM events WHERE id = ? AND user_id = ?', eventId, userId);
        return result.changes > 0;
    }

    validateEventData(data) {
        const errors = [];

        if (!data.name || data.name.trim() === '') {
            errors.push('Event name is required');
        }

        if (data.date && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
            errors.push('Date must be in YYYY-MM-DD format');
        }

        if (data.time && !/^\d{2}:\d{2}$/.test(data.time)) {
            errors.push('Time must be in HH:MM format');
        }

        if (data.hostEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.hostEmail)) {
            errors.push('Invalid host email format');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = EventService;
